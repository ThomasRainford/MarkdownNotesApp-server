import jwt from "jsonwebtoken";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import bcrypt from "bcrypt";
import { COOKIE_NAME } from "../constants";
import { Collection } from "../entities/Collection";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { OrmContext } from "../types/types";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { UserRegisterInput } from "./input-types/UserRegisterInput";
import { ActivityFeedResponse } from "./object-types/ActivityFeedResponse";
import { CollectionResponse } from "./object-types/CollectionResponse";
import { UserResponse } from "./object-types/UserResponse";
import { NotesList } from "../entities/NotesList";
import { Note } from "./object-types/Note";

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuth)
  async me(@Ctx() { em, req }: OrmContext): Promise<User | null> {
    const repo = em.getRepository(User);

    const user = await repo.findOne({ _id: req.session.userId }, [
      "collections.lists",
      "chatPrivates.participants",
      "chatRooms.members",
    ]);
    return user;
  }

  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuth)
  async user(
    @Arg("username") username: string,
    @Ctx() { em }: OrmContext
  ): Promise<User | null> {
    const repo = em.getRepository(User);

    const user = await repo.findOne({ username }, [
      "collections.lists",
      "chatPrivates.participants",
      "chatRooms.members",
    ]);

    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("registerInput") registerInput: UserRegisterInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<UserResponse> {
    const { email, username, password } = registerInput;
    const repo = em.getRepository(User);
    // Validate register info.
    const errors: UserResponse | null = validateRegister(registerInput);
    if (errors) {
      return errors;
    }

    const hasUserName = await repo.findOne({ username });
    const hasUserEmail = await repo.findOne({ email });

    if (hasUserName || hasUserEmail) {
      return {
        errors: [
          {
            field: "registerInput",
            message: "Already registered",
          },
        ],
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      email,
      username,
      password: hashedPassword,
    });

    await em.populate(user, ["collections"]);

    await em.persistAndFlush(user);

    const userIndb = await repo.findOne({ email: user.email });
    const userId = userIndb?._id;

    // Stores user id session
    // Gives a cookie to the user
    // Logs them in once registered
    req.session.userId = userId;

    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req, em }: OrmContext
  ): Promise<UserResponse> {
    const repo = em.getRepository(User);

    const isEmail = usernameOrEmail.includes("@");
    const user = await repo.findOne(
      isEmail
        ? {
            email: usernameOrEmail,
          }
        : {
            username: usernameOrEmail,
          }
    );

    // Validate usernameOrEmail.
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: isEmail
              ? "Email does not exist."
              : "Username does not exist.",
          },
        ],
      };
    }

    // Validate password.
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect Password.",
          },
        ],
      };
    }

    // log the user in
    req.session.userId = user._id;

    return {
      user,
    };
  }

  @Mutation(() => User, { nullable: true })
  async logout(@Ctx() { em, req, res }: OrmContext): Promise<User | null> {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ _id: req.session.userId });

    const logoutPromise: Promise<boolean> = new Promise((resolve) => {
      req.session.destroy((error) => {
        res.clearCookie(COOKIE_NAME);
        if (error) {
          console.log(error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });

    const result = await logoutPromise;

    if (!result) {
      return null;
    }

    return user;
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async updateUser(
    @Ctx() { em, req }: OrmContext,
    @Arg("username", { nullable: true }) username?: string,
    @Arg("password", { nullable: true }) password?: string
  ): Promise<UserResponse> {
    // Check if both args exist.
    if (!username && !password) {
      return {
        errors: [
          {
            field: "username & password",
            message: "Requires either username or password or both.",
          },
        ],
      };
    }

    const repo = em.getRepository(User);

    const user = await repo.findOne({ _id: req.session.userId });

    // If the user is not logged in then send error.
    // Otherwise update fields.
    if (!user) {
      return {
        errors: [
          {
            field: "req.session.userId",
            message: "Please login",
          },
        ],
      };
    }

    const users = await repo.findAll();
    const usernameExists =
      users.find((user) => user.username === username) !== undefined;
    if (usernameExists) {
      return {
        errors: [
          {
            field: "username",
            message: `A user with the username "${username}" already exists.`,
          },
        ],
      };
    }

    if (username) {
      user.username = username;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    em.persistAndFlush(user);

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async follow(
    @Arg("targetUserId") targetUserId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<boolean | null> {
    const repo = em.getRepository(User);

    if (!req.session.userId) {
      return false;
    }

    const meId = req.session["userId"].toString();

    // Don't follow self.
    if (meId === targetUserId) {
      return null;
    }

    const me = await repo.findOne({ id: meId });
    const targetUser = await repo.findOne({ id: targetUserId });

    if (!targetUser || !me) {
      return false;
    }

    if (me.following.includes(targetUserId)) {
      me.following = me.following.filter((value: string) => {
        return value !== targetUserId;
      });
      targetUser.followers = targetUser.followers.filter((value: string) => {
        return value !== meId;
      });
      return false;
    } else {
      me.following.push(targetUserId);
      targetUser.followers.push(meId);
    }

    await em.persistAndFlush(me);

    return true;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async following(
    @Ctx() { em, req }: OrmContext
  ): Promise<Promise<User | null>[] | null> {
    const repo = em.getRepository(User);

    if (!req.session.userId) {
      return null;
    }

    const me = await repo.findOne({ id: req.session["userId"].toString() });

    if (!me) {
      return null;
    }

    const following = me.following;

    const allFollowing = following.map(async (userId) => {
      const user = await repo.findOne({ id: userId });
      return user;
    });

    return allFollowing;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async followers(
    @Ctx() { em, req }: OrmContext
  ): Promise<Promise<User | null>[] | null> {
    const repo = em.getRepository(User);

    if (!req.session.userId) {
      return null;
    }

    const me = await repo.findOne({ id: req.session["userId"].toString() });

    if (!me) {
      return null;
    }

    const followers = me.followers;

    const allFollowers = followers.map(async (userId) => {
      const user = await repo.findOne({ id: userId });
      return user;
    });

    return allFollowers;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async userFollowing(
    @Arg("userId") userId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<Promise<User | null>[] | null> {
    const repo = em.getRepository(User);

    if (!req.session.userId) {
      return null;
    }

    const user = await repo.findOne({ id: userId.toString() });

    if (!user) {
      return null;
    }

    const following = user.following;

    const allFollowing = following.map(async (userId) => {
      const user = await repo.findOne({ id: userId });
      return user;
    });

    return allFollowing;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async userFollowers(
    @Arg("userId") userId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<Promise<User | null>[] | null> {
    const repo = em.getRepository(User);

    if (!req.session.userId) {
      return null;
    }

    const user = await repo.findOne({ id: userId.toString() });

    if (!user) {
      return null;
    }

    const followers = user.followers;

    const allFollowers = followers.map(async (userId) => {
      const user = await repo.findOne({ id: userId });
      return user;
    });

    return allFollowers;
  }

  @Query(() => [Collection])
  @UseMiddleware(isAuth)
  async userVotes(
    @Arg("userId") userId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<Promise<Collection | null>[] | null> {
    const userRepo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    if (!req.session.userId) {
      return null;
    }

    const user = await userRepo.findOne({ id: userId.toString() });

    if (!user) {
      return null;
    }

    const upvoted = user.upvoted;
    const collections = upvoted.map(async (upvote: string) => {
      const collection = await collectionRepo.findOne({ id: upvote }, [
        "owner",
        "lists",
      ]);
      return collection;
    });

    return collections;
  }

  @Query(() => [Collection], { nullable: true })
  @UseMiddleware(isAuth)
  async publicNotes(
    @Arg("username") username: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<Collection[] | null> {
    const collectionsRepo = em.getRepository(Collection);
    const repo = em.getRepository(User);

    const user = await repo.findOne({ username }, ["collections"]);

    let collections;
    if (user) {
      if (req.session.userId?.equals(user._id)) {
        collections = collectionsRepo.find({ owner: user?.id }, [
          "owner",
          "lists",
        ]);
      } else {
        collections = collectionsRepo.find<("owner" | "lists")[]>(
          { owner: user?.id },
          { filters: ["visibility"] }
        );
      }
    }

    if (!collections) {
      return null;
    }

    return collections;
  }

  @Mutation(() => CollectionResponse)
  @UseMiddleware(isAuth)
  async savePublicCollection(
    @Arg("targetUserId") targetUserId: string,
    @Arg("collectionId") collectionId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<CollectionResponse> {
    const collectionsRepo = em.getRepository(Collection);
    const userRepo = em.getRepository(User);

    const publicCollections = await collectionsRepo.find(
      { owner: targetUserId },
      { filters: ["visibility"], populate: ["lists"] }
    );

    if (publicCollections.length === 0) {
      return {
        error: {
          property: "visibility",
          message: "No public collections",
        },
      };
    }

    // Get the chosen collection
    const collectionToAdd = publicCollections.find(
      (collection) => collection.id === collectionId
    );
    if (!collectionToAdd) {
      return {
        error: {
          property: "collection",
          message: "Collection does not exist.",
        },
      };
    }

    // Save the collection to the currently logged in users collections
    const me = await userRepo.findOne({
      id: req.session["userId"]?.toString(),
    });

    if (!me) {
      return {
        error: {
          property: "user",
          message: "User is not logged in.",
        },
      };
    }

    const { title, visibility, lists, upvotes } = collectionToAdd;
    const collection = new Collection({ title, visibility });

    collection.owner = me;
    // Create copies of the collectionToAdd lists and notes.
    collection.lists.removeAll();
    const newLists = lists.toArray().map((list) => {
      const notes = list.notes.map((note: Note) => {
        return new Note({ title: note.title, body: note.body });
      });
      return new NotesList({ title: list.title, notes });
    });
    newLists.forEach((list) => {
      collection.lists.add(list);
    });
    collection.upvotes = upvotes;
    me.collections.add(collection);
    await em.populate(collection, ["owner", "lists"]);

    await em.persistAndFlush(collection);

    return { collection };
  }

  @Query(() => [ActivityFeedResponse], { nullable: true })
  @UseMiddleware(isAuth)
  async activityFeed(
    @Ctx() { em, req }: OrmContext
  ): Promise<ActivityFeedResponse[] | null> {
    const userRepo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    if (!req.session.userId) {
      return null;
    }

    // Get currently logged in users.
    const me = await userRepo.findOne(
      { id: req.session["userId"].toString() },
      ["collections"]
    );

    if (!me) {
      return null;
    }

    // Get all the following users.
    const allFollowing = new Array<User>();
    for (const userId of me.following) {
      const user = await userRepo.findOne({ id: userId });
      if (user) {
        allFollowing.push(user);
      }
    }

    // Get all following users public collections.
    const limit = 2592000000; // 30 days
    const publicCollections = new Array<ActivityFeedResponse>();
    for (const user of allFollowing) {
      const collections = await collectionRepo.find(
        { owner: user.id },
        { filters: ["visibility"] }
      );
      collections.forEach((collection) => {
        const createAtDelta = Date.now() - collection.createdAt.getTime();
        const updatedAtDelta = Date.now() - collection.updatedAt.getTime();
        const activityCreate: ActivityFeedResponse = {
          activity: "create",
          collection,
        };
        const activityUpdate: ActivityFeedResponse = {
          activity: "update",
          collection,
        };

        // Only push collection created in the last 30 days.
        // Push updated collection if updated after created.
        if (createAtDelta < limit) {
          if (updatedAtDelta < createAtDelta) {
            publicCollections.push(activityUpdate);
          } else {
            publicCollections.push(activityCreate);
          }
        } else if (createAtDelta > limit) {
          if (updatedAtDelta < limit) {
            publicCollections.push(activityUpdate);
          }
        }
      });
    }
    return publicCollections;
  }

  @Mutation(() => UserResponse)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em }: OrmContext
  ): Promise<UserResponse> {
    const repo = em.getRepository(User);

    const user = await repo.findOne({ email });

    if (!user) {
      return {
        errors: [
          {
            field: "email",
            message: "User not registered.",
          },
        ],
      };
    }

    const secret = process.env.JWT_SECRET + user.password;
    const payload = {
      id: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "15m" });
    const link = `${process.env.CLIENT_DOMAIN}/account/reset-password/?id=${user.id}&token=${token}`;

    // This is temp. Need to send link in email.
    //console.log('Reset password: ', link)

    await sendEmail(
      user.email,
      `<a href="${link}">Click here to reset your password.</a>`
    );

    return { user };
  }

  @Mutation(() => UserResponse)
  async resetPassword(
    @Arg("userId") userId: string,
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { em }: OrmContext
  ): Promise<UserResponse> {
    const repo = em.getRepository(User);

    const user = await repo.findOne({ id: userId });

    if (!user) {
      return {
        errors: [
          {
            field: "email",
            message: "User not registered.",
          },
        ],
      };
    }

    const secret = process.env.JWT_SECRET + user.password;

    try {
      jwt.verify(token, secret);
    } catch (error) {
      return {
        errors: [
          {
            field: "token",
            message: "Unable to verify token",
          },
        ],
      };
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await em.persistAndFlush(user);

    return { user };
  }
}

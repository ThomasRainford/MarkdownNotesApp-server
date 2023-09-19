import { ChatRoom } from "../entities/ChatRoom";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { OrmContext } from "../types/types";
import {
  Arg,
  Ctx,
  Mutation,
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
  Root,
  Subscription,
  UseMiddleware,
} from "type-graphql";
import { ChatRoomResponse } from "./object-types/ChatRoomResponse";
import { CreateChatRoomInput } from "./input-types/CreateChatRoomInput";
import { UserLeaveChatRoomPayload } from "./object-types/UserLeaveChatRoomPayload";
import { UserLeaveChatRoomArgs } from "./input-types/UserLeaveChatRoomArgs";
import { UserLeaveChatRoomResponse } from "./object-types/UserLeaveChatRoomResponse";

const channels = {
  USER_JOIN: "USER_JOIN",
  USER_LEAVE: "USER_LEAVE",
};

@Resolver(ChatRoom)
export class ChatRoomResolver {
  @Query(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async chatRoom(
    @Arg("chatRoomId") chatRoomId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRoom = await chatRoomRepo.findOne(
      {
        id: chatRoomId,
      },
      ["members", "messages"]
    );
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    // Check if authenticated user is a member of the chat room.
    if (!chatRoom?.members.contains(me)) {
      return {
        error: {
          property: "chatRoom.members",
          message: "You are not a member of this chat room.",
        },
      };
    }
    // Check if ChatRoom exists.
    if (!chatRoom) {
      return {
        error: {
          property: "chatRoom",
          message: "ChatRoom does not exist.",
        },
      };
    }
    return { chatRoom };
  }

  @Query(() => [ChatRoom])
  @UseMiddleware(isAuth)
  async chatRooms(@Ctx() { em, req }: OrmContext): Promise<ChatRoom[]> {
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRooms = await chatRoomRepo.findAll({
      populate: ["members", "messages"],
    });
    // Filter chatRooms by authenticated user in members.
    const userChatRooms = chatRooms.filter((cp) =>
      cp.members.getItems().find((u) => u._id.equals(req.session.userId || ""))
    );
    return userChatRooms;
  }

  @Mutation(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async createChatRoom(
    @Arg("chatRoomInput") chatRoomInput: CreateChatRoomInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const { name, userIds } = chatRoomInput;
    // Check if userIds has length of at least 1.
    if (userIds.length === 0) {
      return {
        error: {
          property: "chatRoomInput.userIds",
          message: "At least 1 userId must be provided.",
        },
      };
    }
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    const users = await userRepo.find({ id: userIds });
    if (!users || users.length === 0) {
      return {
        error: {
          property: "chatRoomInput.userIds",
          message: "Cannot find any users to add to chat room.",
        },
      };
    }
    const chatRoom = new ChatRoom({ name, users });
    await em.populate(chatRoom, ["members", "messages"]);
    await em.persistAndFlush(chatRoom);

    return { chatRoom };
  }

  @Mutation(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async updateChatRoom(
    @Arg("chatRoomId") chatRoomId: string,
    @Arg("name") name: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRoom = await chatRoomRepo.findOne(
      {
        id: chatRoomId,
      },
      ["members", "messages"]
    );
    // Check if ChatRoom exists.
    if (!chatRoom) {
      return {
        error: {
          property: "chatRoom",
          message: "ChatRoom does not exist.",
        },
      };
    }
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    // Check if authenticated user is a member of the chat room.
    if (!chatRoom?.members.contains(me)) {
      return {
        error: {
          property: "chatRoom.members",
          message: "You are not a member of this chat room.",
        },
      };
    }
    chatRoom.name = name;

    await em.persistAndFlush(chatRoom);

    return { chatRoom };
  }

  @Mutation(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async joinChatRoom(
    @Arg("chatRoomId") chatRoomId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRoom = await chatRoomRepo.findOne(
      {
        id: chatRoomId,
      },
      ["members", "messages"]
    );
    // Check if ChatRoom exists.
    if (!chatRoom) {
      return {
        error: {
          property: "chatRoom",
          message: "ChatRoom does not exist.",
        },
      };
    }
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    if (chatRoom?.members.contains(me)) {
      return {
        error: {
          property: "chatRoom.members",
          message: "You are already a member of this chat room.",
        },
      };
    }
    chatRoom?.members.add(me);
    me.chatRooms.add(chatRoom);

    await em.persistAndFlush([chatRoom, me]);

    return { chatRoom };
  }

  @Mutation(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async leaveChatRoom(
    @PubSub() pubSub: PubSubEngine,
    @Arg("chatRoomId") chatRoomId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRoom = await chatRoomRepo.findOne(
      {
        id: chatRoomId,
      },
      ["members", "messages"]
    );
    // Check if ChatRoom exists.
    if (!chatRoom) {
      return {
        error: {
          property: "chatRoom",
          message: "ChatRoom does not exist.",
        },
      };
    }
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    if (!chatRoom?.members.contains(me)) {
      return {
        error: {
          property: "chatRoom.members",
          message: "You are not a member of this chat room.",
        },
      };
    }
    chatRoom?.members.remove(me);
    me.chatRooms.remove(chatRoom);

    await em.persistAndFlush([chatRoom, me]);
    // Publish deleted message ID to channel.
    await pubSub.publish(channels.USER_LEAVE, { chatRoom, user: me });
    return { chatRoom };
  }

  // TODO: Add subscription for user joining and leaving chat room:
  // - Subscription will return the new chat room (new members list).
  // - Filtering will include only members of the chat room.
  // This is very similar to the message subscriptions.

  @Subscription({
    topics: channels.USER_LEAVE,
    filter: ({
      payload,
      args,
    }: {
      payload: UserLeaveChatRoomPayload;
      args: { userLeaveChatRoomInput: UserLeaveChatRoomArgs };
    }) => {
      return (
        payload.chatRoom.members
          .toArray()
          .find((user) => user.id === args.userLeaveChatRoomInput.userId) !==
          undefined &&
        payload.chatRoom.id === args.userLeaveChatRoomInput.chatId
      );
    },
  })
  userLeaveChatRoom(
    @Root() payload: UserLeaveChatRoomPayload,
    @Arg("userLeaveChatRoomInput") userLeaveChatRoomInput: UserLeaveChatRoomArgs
  ): UserLeaveChatRoomResponse {
    payload;
    return {
      chatRoomId: userLeaveChatRoomInput.chatId,
      userId: userLeaveChatRoomInput.userId,
    };
  }
}

import { isAuth } from "../middleware/isAuth";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { ChatPrivate } from "../entities/ChatPrivate";
import { OrmContext } from "../types/types";
import { ChatPrivateResponse } from "./object-types/ChatPrivateResponse";
import { CreateChatPrivateInput } from "./input-types/CreateChatPrivateInput";
import { User } from "../entities/User";

@Resolver(ChatPrivate)
export class ChatPrivateResolver {
  @Query(() => ChatPrivateResponse)
  @UseMiddleware(isAuth)
  async chatPrivate(
    @Arg("chatPrivateId") chatPrivateId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatPrivateResponse> {
    const chatPrivateRepo = em.getRepository(ChatPrivate);
    const chatPrivate = await chatPrivateRepo.findOne(
      {
        id: chatPrivateId,
        $and: [{ owner: req.session.userId }],
      },
      ["participants"]
    );
    // Check if ChatPrivate exists.
    if (!chatPrivate) {
      return {
        error: {
          property: "chatPrivate",
          message: "ChatPrivate does not exist.",
        },
      };
    }
    return { chatPrivate };
  }

  @Query(() => [ChatPrivate])
  @UseMiddleware(isAuth)
  async chatPrivates(@Ctx() { em, req }: OrmContext): Promise<ChatPrivate[]> {
    const chatPrivateRepo = em.getRepository(ChatPrivate);
    const chatPrivates = await chatPrivateRepo.findAll({
      populate: ["participants", "messages"],
    });
    // Filter chatPrivates by authenticated user in participants.
    const userChatPrivates = chatPrivates.filter((cp) =>
      cp.participants
        .getItems()
        .find((u) => u._id.equals(req.session.userId || ""))
    );
    return userChatPrivates;
  }

  @Mutation(() => ChatPrivateResponse)
  @UseMiddleware(isAuth)
  async createChatPrivate(
    @Arg("chatPrivateInput") chatPrivateInput: CreateChatPrivateInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatPrivateResponse> {
    const chatPrivateRepo = em.getRepository(ChatPrivate);
    const userRepo = em.getRepository(User);
    const { userId } = chatPrivateInput;
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatPrivates",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    const user = await userRepo.findOne({ id: userId });
    if (!user) {
      return {
        error: {
          property: "chatPrivateInput.userAId",
          message: "Cannot find a user for userA.",
        },
      };
    }
    // Check if authenticated user already has a private chat with 'user'.
    const meHasPrivateChat = (me.chatPrivates.toArray() as ChatPrivate[]).find(
      async (cp: ChatPrivate) => {
        const _cp = await chatPrivateRepo.findOne({ id: cp.id }, [
          "participants",
        ]);
        return _cp?.participants.contains(user);
      }
    );
    if (meHasPrivateChat) {
      return {
        error: {
          property: "chatPrivates[].participants",
          message: "Already have a private chat with the given user.",
        },
      };
    }
    const chatPrivate = new ChatPrivate({ userA: me, userB: user });
    await em.populate(chatPrivate, ["participants", "messages"]);
    await em.persistAndFlush(chatPrivate);

    return { chatPrivate };
  }
}

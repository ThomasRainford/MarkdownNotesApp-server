import { isAuth } from "../middleware/isAuth";
import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { ChatPrivate } from "../entities/ChatPrivate";
import { OrmContext } from "../types/types";
import { ChatPrivateResponse } from "./object-types/ChatPrivateResponse";

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
      populate: ["participants"],
    });
    // Filter chatPrivates by authenticated user in participants.
    const userChatPrivates = chatPrivates.filter((cp) =>
      cp.participants.getItems().find((u) => u._id === req.session.userId)
    );
    return userChatPrivates;
  }
}

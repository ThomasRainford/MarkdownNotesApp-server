import { Message } from "../entities/Message";
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
import { OrmContext } from "../types/types";
import { isAuth } from "../middleware/isAuth";
import { User } from "../entities/User";
import { CreateMessageResponse } from "./object-types/CreateMessageResponse";
import { MessageSentPayload } from "./object-types/MessagePayload";
import { CreateMessageInput } from "./input-types/CreateMessageInput";
import { ChatPrivate } from "../entities/ChatPrivate";
import { NewMessageArgs } from "./input-types/NewMessageArgs";

const channels = {
  NEW_MESSAGE: "NEW_MESSAGE",
};

@Resolver(Message)
export class MessageResolver {
  @Query(() => [Message])
  @UseMiddleware(isAuth)
  async messages(@Ctx() { em }: OrmContext): Promise<Message[]> {
    const messageRepo = em.getRepository(Message);
    return await messageRepo.findAll(["sender"]);
  }

  @Mutation(() => CreateMessageResponse)
  @UseMiddleware(isAuth)
  async createPrivateMessage(
    @PubSub() pubSub: PubSubEngine,
    @Arg("createMessageInput") createMessageInput: CreateMessageInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<CreateMessageResponse> {
    const { content, chatId } = createMessageInput;
    const userRepo = em.getRepository(User);
    // Find user.
    const user = await userRepo.findOne({ _id: req.session.userId }, [
      "chatPrivates",
    ]);
    // If the user is not logged in then send error.
    // Otherwise create new message.
    if (!user) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    // Find chat.
    const chatPrivateRepo = em.getRepository(ChatPrivate);
    const chatPrivate = await chatPrivateRepo.findOne({ id: chatId }, [
      "participants",
      "messages",
    ]);
    // Check if ChatPrivate exists.
    if (!chatPrivate) {
      return {
        error: {
          property: "chatId",
          message: "A chat with the given ID was not found.",
        },
      };
    }
    // Chat is not a private chat.
    if (!(chatPrivate instanceof ChatPrivate)) {
      return {
        error: {
          property: "chatId",
          message: "An ID for a chat room was given.",
        },
      };
    }
    // Check user has a ChatPrivate with the given id.
    const hasChatPrivate = user.chatPrivates.contains(chatPrivate);
    if (!hasChatPrivate) {
      return {
        error: {
          property: "chatId",
          message: "You do not have access to this private chat.",
        },
      };
    }
    // Create and persist new message.
    const message = new Message({ content, sender: user, chat: chatPrivate });
    chatPrivate.messages.add(message);
    await em.persistAndFlush([message, chatPrivate]);
    // Publish new message to channel.
    await pubSub.publish(channels.NEW_MESSAGE, { message });
    // Return new message.
    return { message };
  }

  @Subscription({
    topics: channels.NEW_MESSAGE,
    filter: ({
      payload,
      args,
    }: {
      payload: MessageSentPayload;
      args: { messageSentInput: NewMessageArgs };
    }) => {
      const chat = payload.message?.chat;
      if (chat instanceof ChatPrivate) {
        return (
          chat.participants
            .toArray()
            .find((user) => user.id === args.messageSentInput.userId) !==
            undefined &&
          payload.message?.chat.id === args.messageSentInput.chatId
        );
      }
      return false;
    },
  })
  messageSent(
    @Root() payload: MessageSentPayload,
    @Arg("messageSentInput") messageSentInput: NewMessageArgs
  ): MessageSentPayload {
    messageSentInput;
    return { message: payload.message };
  }
}
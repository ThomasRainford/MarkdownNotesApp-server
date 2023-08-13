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
import { MessagePayload } from "./object-types/MessagePayload";

const channel = "CHAT_CHANNEL";

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
  async createMessage(
    @PubSub() pubSub: PubSubEngine,
    @Arg("content") content: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<CreateMessageResponse> {
    const userRepo = em.getRepository(User);
    // Find user.
    const user = await userRepo.findOne({ _id: req.session.userId }, [
      "messages",
    ]);
    // If the user is not logged in then send error.
    // Otherwise create new message.
    if (!user) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login",
        },
      };
    }
    // Create and persist new message.
    const message = new Message({ content, sender: user });
    user.messages.add(message);
    await em.persistAndFlush([message, user]);
    // Publish new message to channel.
    await pubSub.publish(channel, message);
    // Return new message.
    return { message };
  }

  @Subscription({
    topics: channel,
  })
  messageSent(@Root() message: Message): MessagePayload {
    return { message };
  }
}

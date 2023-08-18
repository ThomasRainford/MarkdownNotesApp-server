import { Chat } from "../../entities/Chat";
import { User } from "../../entities/User";
import { Field, InputType } from "type-graphql";

@InputType()
export class MessageInput {
  @Field()
  content: string;

  @Field(() => User)
  sender: User;

  @Field(() => Chat)
  chat: Chat;
}

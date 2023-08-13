import { User } from "../../entities/User";
import { Field, InputType } from "type-graphql";

@InputType()
export class MessageInput {
  @Field()
  content: string;

  @Field(() => User)
  sender: User;
}

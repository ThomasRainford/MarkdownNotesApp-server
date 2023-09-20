import { User } from "../../entities/User";
import { Field, InputType } from "type-graphql";

@InputType()
export class ChatPrivateInput {
  @Field(() => User)
  userA: User;

  @Field(() => User)
  userB: User;
}

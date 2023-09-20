import { User } from "../../entities/User";
import { Field, InputType } from "type-graphql";

@InputType()
export class ChatRoomInput {
  @Field()
  name: string;

  @Field(() => [User])
  users: User[];
}

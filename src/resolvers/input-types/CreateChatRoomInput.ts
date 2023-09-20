import { Field, InputType } from "type-graphql";

@InputType()
export class CreateChatRoomInput {
  @Field()
  name: string;

  @Field(() => [String])
  userIds: string[];
}

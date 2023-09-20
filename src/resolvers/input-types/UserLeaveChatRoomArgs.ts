import { Field, InputType } from "type-graphql";

@InputType()
export class UserLeaveChatRoomArgs {
  @Field()
  chatId: string;

  @Field()
  userId: string;
}

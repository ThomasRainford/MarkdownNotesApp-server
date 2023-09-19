import { Field, InputType } from "type-graphql";

@InputType()
export class UserJoinChatRoomArgs {
  @Field()
  chatId: string;

  @Field()
  userId: string;
}

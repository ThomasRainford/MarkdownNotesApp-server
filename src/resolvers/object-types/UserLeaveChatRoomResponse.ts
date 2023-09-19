import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UserLeaveChatRoomResponse {
  @Field()
  chatRoomId: string;

  @Field()
  userId: string;
}

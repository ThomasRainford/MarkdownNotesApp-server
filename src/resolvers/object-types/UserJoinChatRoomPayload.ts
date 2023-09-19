import { User } from "../../entities/User";
import { ChatRoom } from "../../entities/ChatRoom";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UserJoinChatRoomPayload {
  @Field(() => ChatRoom)
  chatRoom: ChatRoom;

  @Field(() => User)
  user: User;
}

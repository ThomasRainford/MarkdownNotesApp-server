import { ObjectType, Field } from "type-graphql";
import { Error } from "./Error";
import { ChatRoom } from "../../entities/ChatRoom";

@ObjectType()
export class ChatRoomResponse {
  @Field(() => ChatRoom, { nullable: true })
  chatRoom?: ChatRoom;

  @Field(() => Error, { nullable: true })
  error?: Error;
}

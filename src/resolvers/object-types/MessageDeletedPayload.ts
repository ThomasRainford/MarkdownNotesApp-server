import { Message } from "../../entities/Message";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MessageDeletedPayload {
  @Field(() => Message)
  message: Message;
}

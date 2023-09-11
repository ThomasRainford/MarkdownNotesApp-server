import { Message } from "../../entities/Message";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MessageUpdatedPayload {
  @Field(() => Message)
  message: Message;
}

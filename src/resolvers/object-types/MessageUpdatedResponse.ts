import { Message } from "../../entities/Message";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MessageUpdatedResponse {
  @Field({ nullable: true })
  message?: Message;

  @Field({ nullable: true })
  error?: string;
}

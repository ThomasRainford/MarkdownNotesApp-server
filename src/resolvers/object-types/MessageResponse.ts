import { Message } from "../../entities/Message";
import { ObjectType, Field } from "type-graphql";
import { Error } from "./Error";

@ObjectType()
export class MessageResponse {
  @Field(() => Message, { nullable: true })
  message?: Message;

  @Field(() => Error, { nullable: true })
  error?: Error;
}

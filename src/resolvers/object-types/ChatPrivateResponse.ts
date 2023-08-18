import { ChatPrivate } from "../../entities/ChatPrivate";
import { ObjectType, Field } from "type-graphql";
import { Error } from "./Error";

@ObjectType()
export class ChatPrivateResponse {
  @Field(() => ChatPrivate, { nullable: true })
  chatPrivate?: ChatPrivate;

  @Field(() => Error, { nullable: true })
  error?: Error;
}

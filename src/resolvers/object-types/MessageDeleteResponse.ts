import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MessageDeleteResponse {
  @Field()
  messageId: string;
}

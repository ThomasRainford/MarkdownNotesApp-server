import { Field, InputType } from "type-graphql";

@InputType()
export class CreateChatPrivateInput {
  @Field()
  userId: string;
}

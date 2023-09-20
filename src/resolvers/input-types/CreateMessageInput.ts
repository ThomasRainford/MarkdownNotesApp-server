import { Field, InputType } from "type-graphql";

@InputType()
export class CreateMessageInput {
  @Field()
  content: string;

  @Field()
  chatId: string;
}

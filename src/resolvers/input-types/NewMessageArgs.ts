import { Field, InputType } from "type-graphql";

@InputType()
export class NewMessageArgs {
  @Field()
  userId: string;

  @Field()
  chatId: string;
}

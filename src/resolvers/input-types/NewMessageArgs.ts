import { Field, InputType } from "type-graphql";

@InputType()
export class NewMessageArgs {
  @Field()
  chatId: string;
}

import { Field, InputType } from "type-graphql";

@InputType()
export class DeleteMessageArgs {
  @Field()
  chatId: string;

  @Field()
  userId: string;
}

import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateMessageArgs {
  @Field()
  chatId: string;

  @Field()
  userId: string;
}

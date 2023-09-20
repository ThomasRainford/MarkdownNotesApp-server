import { Field, InputType } from "type-graphql";

@InputType()
export class MessageUpdateInput {
  @Field()
  content: string;
}

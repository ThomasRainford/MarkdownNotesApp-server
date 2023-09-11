import { Field, InputType } from "type-graphql";

@InputType()
export class PaginationInput {
  @Field()
  cursor: number;

  @Field()
  limit: number;
}

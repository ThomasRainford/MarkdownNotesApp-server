import { Field, ID, ObjectType } from "type-graphql";
import { Message } from "./Message";
import {
  Collection,
  OneToMany,
  PrimaryKey,
  SerializedPrimaryKey,
} from "@mikro-orm/core";
import { ObjectId } from "@mikro-orm/mongodb";

@ObjectType()
export class Chat {
  @Field(() => ID)
  @PrimaryKey()
  _id: ObjectId;

  @Field()
  @SerializedPrimaryKey()
  id: string;

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.chat)
  message = new Collection<Message>(this);
}

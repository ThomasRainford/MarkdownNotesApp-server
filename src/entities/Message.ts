import { Field, ID, ObjectType } from "type-graphql";
import { User } from "./User";
import { MessageInput } from "../resolvers/input-types/MessageInput";
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  SerializedPrimaryKey,
} from "@mikro-orm/core";
import { ObjectId } from "@mikro-orm/mongodb";
import { Chat } from "./Chat";

@ObjectType() // type-graphql
@Entity() // orm
export class Message {
  @Field(() => ID)
  @PrimaryKey()
  _id: ObjectId;

  @Field()
  @SerializedPrimaryKey()
  id: string;

  @Field()
  @Property({ type: "text" })
  content: string;

  @Field(() => User)
  @ManyToOne(() => User)
  sender: User;

  @Field(() => Chat)
  @ManyToOne(() => Chat)
  chat: Chat;

  @Field(() => Date)
  @Property()
  createdAt = new Date();

  @Field(() => Date)
  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  constructor({ content, sender, chat }: MessageInput) {
    this.content = content;
    this.sender = sender;
    this.chat = chat;
  }
}

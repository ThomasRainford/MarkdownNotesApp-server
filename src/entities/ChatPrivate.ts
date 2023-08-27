import { Field, ObjectType } from "type-graphql";
import { Chat } from "./Chat";
import { User } from "./User";
import { Collection, Entity, ManyToMany } from "@mikro-orm/core";
import { ChatPrivateInput } from "../resolvers/input-types/ChatPrivateInput";

@ObjectType() // type-graphql
@Entity() // orm
export class ChatPrivate extends Chat {
  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.chatPrivates)
  participants = new Collection<User>(this);

  constructor({ userA, userB }: ChatPrivateInput) {
    super();
    this.participants.add(userA, userB);
  }
}

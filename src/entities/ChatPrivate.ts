import { Field, ObjectType } from "type-graphql";
import { Chat } from "./Chat";
import { User } from "./User";
import { Collection, ManyToMany } from "@mikro-orm/core";

@ObjectType()
export class ChatPrivate extends Chat {
  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.chatPrivates)
  participants = new Collection<User>(this);
}

import { Field, ObjectType } from "type-graphql";
import { Chat } from "./Chat";
import { User } from "./User";
import { Collection, Entity, ManyToMany, Property } from "@mikro-orm/core";
import { ChatRoomInput } from "../resolvers/input-types/ChatRoomInput";

@ObjectType() // type-graphql
@Entity() // orm
export class ChatRoom extends Chat {
  @Field()
  @Property({ type: "text" })
  name: string;

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.chatRooms)
  members = new Collection<User>(this);

  constructor({ name, users }: ChatRoomInput) {
    super();
    this.name = name;
    this.members.add(...users);
  }
}

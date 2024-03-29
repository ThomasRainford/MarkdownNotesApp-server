import {
  Collection,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryKey,
  Property,
  SerializedPrimaryKey,
} from "@mikro-orm/core";
import { ObjectId } from "@mikro-orm/mongodb";
import { Field, ID, ObjectType } from "type-graphql";
import { UserRegisterInput } from "../resolvers/input-types/UserRegisterInput";
import { Collection as EntityCollection } from "./Collection";
import { ChatPrivate } from "./ChatPrivate";
import { ChatRoom } from "./ChatRoom";

@ObjectType() // type-graphql
@Entity() // orm
export class User {
  @Field(() => ID)
  @PrimaryKey()
  _id: ObjectId;

  @Field()
  @SerializedPrimaryKey()
  id: string;

  @Field()
  @Property({ type: "text", unique: true })
  email!: string;

  @Field()
  @Property({ type: "text", unique: true })
  username!: string;

  @Property()
  password!: string;

  @Field(() => [String])
  @Property()
  following = new Array<string>();

  @Field(() => [String])
  @Property()
  followers = new Array<string>();

  @Field(() => [EntityCollection])
  @OneToMany(() => EntityCollection, (collection) => collection.owner)
  collections = new Collection<EntityCollection>(this);

  @Field(() => [String])
  @Property()
  upvoted = new Array<string>();

  @Field(() => [ChatPrivate])
  @ManyToMany(() => ChatPrivate, "participants", { owner: true })
  chatPrivates = new Collection<ChatPrivate>(this);

  @Field(() => [ChatRoom])
  @ManyToMany(() => ChatRoom, "members", { owner: true })
  chatRooms = new Collection<ChatRoom>(this);

  @Field(() => Date)
  @Property()
  createdAt = new Date();

  @Field(() => Date)
  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  constructor({ email, username, password }: UserRegisterInput) {
    this.email = email;
    this.username = username;
    this.password = password;
  }
}

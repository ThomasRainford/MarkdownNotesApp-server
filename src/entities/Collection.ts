import { Entity, PrimaryKey, Property, SerializedPrimaryKey, Collection as OrmCollection, ManyToOne, OneToMany, Filter } from "@mikro-orm/core";
import { ObjectId } from "@mikro-orm/mongodb";
import { CollectionInput } from "../resolvers/input-types/CollectionInput";
import { Field, ID, ObjectType } from "type-graphql";
import { NotesList } from "./NotesList";
import { User } from "./User";

@ObjectType()
@Entity()
@Filter({ name: 'visibility', cond: { visibility: 'public' } })
export class Collection {

   @Field(() => ID)
   @PrimaryKey()
   _id: ObjectId

   @Field()
   @SerializedPrimaryKey()
   id: string

   @Field(() => User)
   @ManyToOne()
   owner: User

   @Field()
   @Property()
   title: string

   @Field(() => [NotesList])
   @OneToMany(() => NotesList, notesList => notesList.collection)
   lists = new OrmCollection<NotesList>(this)

   @Field(() => Number)
   @Property()
   upvotes = 0

   @Field()
   @Property()
   visibility: string

   @Field(() => Date)
   @Property()
   createdAt = new Date()

   @Field(() => Date)
   @Property({ onUpdate: () => new Date() })
   updatedAt = new Date()

   constructor({ title, visibility }: CollectionInput) {
      this.title = title
      this.visibility = visibility
   }

}
import {
  EntityManager,
  IDatabaseDriver,
  Connection,
  EntityName,
} from "@mikro-orm/core";
import { NotesList } from "../entities/NotesList";
import { Collection } from "../entities/Collection";
import { Error } from "../resolvers/object-types/Error";
import { ObjectId } from "@mikro-orm/mongodb";

export const validateTitle = async (
  owner: ObjectId | undefined,
  title: string,
  entity: EntityName<Collection | NotesList>,
  type: "collection" | "noteslist",
  em: EntityManager<IDatabaseDriver<Connection>>
): Promise<Error | null> => {
  const typeFormatted = type === "collection" ? "Collection" : "NotesList";

  if (title === "") {
    return {
      property: "title",
      message: `'title' cannot be empty.`,
    };
  }

  const existingCollection = await em
    .getRepository(entity)
    .findOne({ title, owner });
  if (existingCollection) {
    return {
      property: "title",
      message: `${typeFormatted} with title '${title}' already exisits.`,
    };
  }

  return null;
};

import {
  EntityManager,
  IDatabaseDriver,
  Connection,
  EntityName,
  LoadedCollection,
} from "@mikro-orm/core";
import { NotesList } from "../entities/NotesList";
import { Collection } from "../entities/Collection";
import { Error } from "../resolvers/object-types/Error";
import { ObjectId } from "@mikro-orm/mongodb";

export const validateCollectionTitle = async (
  owner: ObjectId | undefined,
  title: string,
  entity: EntityName<Collection>,
  em: EntityManager<IDatabaseDriver<Connection>>
): Promise<Error | null> => {
  if (title === "") {
    return {
      property: "title",
      message: `'title' cannot be empty.`,
    };
  }

  const existing = await em.getRepository(entity).findOne({ title, owner });
  if (existing) {
    return {
      property: "title",
      message: `Collection with title '${title}' already exisits.`,
    };
  }

  return null;
};

export const validateNotesListTitle = async (
  collection:
    | (Collection & {
        lists: LoadedCollection<NotesList, NotesList>;
      })
    | null,
  title: string,
  entity: EntityName<NotesList>,
  em: EntityManager<IDatabaseDriver<Connection>>
): Promise<Error | null> => {
  if (title === "") {
    return {
      property: "title",
      message: `'title' cannot be empty.`,
    };
  }

  const existing = await em
    .getRepository(entity)
    .findOne({ title, collection });
  if (existing) {
    return {
      property: "title",
      message: `NotesList with title '${title}' already exisits.`,
    };
  }

  return null;
};

export const validateNoteTitle = (title: string) => {
  if (title === "") {
    return {
      property: "noteInput.title",
      message: "'title' cannot be empty.",
    };
  }
  return null;
};

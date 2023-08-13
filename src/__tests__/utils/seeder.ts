import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import argon2 from "argon2";
import { NotesList } from "../../entities/NotesList";
import { Note } from "../../resolvers/object-types/Note";
import { Collection } from "../../entities/Collection";
import { User } from "../../entities/User";
import { Message } from "../../entities/Message";

export const seed = async (
  em: EntityManager<IDatabaseDriver<Connection>>
): Promise<void> => {
  const users = await createUsers(em);

  await createCollections(em, users);
  await createNotesLists(em, users);
  await createMessages(em, users);
};

const createUsers = async (em: EntityManager<IDatabaseDriver<Connection>>) => {
  const users: User[] = [];
  let hashedPassword = await argon2.hash("password1");
  const user1 = new User({
    email: "user1@mail.com",
    username: "User1",
    password: hashedPassword,
  });
  hashedPassword = await argon2.hash("password2");
  const user2 = new User({
    email: "user2@mail.com",
    username: "User2",
    password: hashedPassword,
  });
  hashedPassword = await argon2.hash("password3");
  const user3 = new User({
    email: "user3@mail.com",
    username: "User3",
    password: hashedPassword,
  });
  hashedPassword = await argon2.hash("password4");
  const user4 = new User({
    email: "user4@mail.com",
    username: "User4",
    password: hashedPassword,
  });
  await em.populate(user1, ["collections"]);
  await em.populate(user2, ["collections"]);
  await em.populate(user3, ["collections"]);
  await em.populate(user4, ["collections"]);

  await em.persistAndFlush([user1, user2, user3, user4]);
  users.push(user1, user2, user3, user4);
  return users;
};

const createMessages = async (
  em: EntityManager<IDatabaseDriver<Connection>>,
  users: User[]
) => {
  for (const user of users) {
    const message1 = new Message({
      content: "message1",
    });
    const message2 = new Message({
      content: "message2",
    });
    const message3 = new Message({
      content: "message3",
    });
    message1.sender = user;
    message2.sender = user;
    message3.sender = user;
    user.messages.add(message1, message2, message3);
    await em.populate(message1, ["sender"]);
    await em.populate(message2, ["sender"]);
    await em.populate(message3, ["sender"]);

    await em.persistAndFlush([message1, message2, message3]);
  }
};

const createCollections = async (
  em: EntityManager<IDatabaseDriver<Connection>>,
  users: User[]
) => {
  for (const user of users) {
    const collection1 = new Collection({
      title: "Collection 1",
      visibility: "public",
    });
    const collection2 = new Collection({
      title: "Collection 2",
      visibility: "public",
    });
    const collection3 = new Collection({
      title: "Collection 3",
      visibility: "private",
    });
    collection1.owner = user;
    collection2.owner = user;
    collection3.owner = user;
    user.collections.add(collection1, collection2, collection3);
    await em.populate(collection1, ["owner", "lists"]);
    await em.populate(collection2, ["owner", "lists"]);
    await em.populate(collection3, ["owner", "lists"]);

    await em.persistAndFlush([collection1, collection2, collection3]);
  }
};

const createNotesLists = async (
  em: EntityManager<IDatabaseDriver<Connection>>,
  users: User[]
) => {
  const notes = [
    new Note({ title: "Note 1", body: "Body 1" }),
    new Note({ title: "Note 2", body: "Body 2" }),
    new Note({ title: "Note 3", body: "Body 3" }),
    new Note({ title: "Note 4", body: "Body 4" }),
  ];
  for (const user of users) {
    const collections = user.collections;
    for (const collection of collections) {
      const notesList1 = new NotesList({
        title: "NotesList 1",
        notes,
      });
      const notesList2 = new NotesList({
        title: "NotesList 2",
        notes,
      });
      const notesList3 = new NotesList({
        title: "NotesList 3",
        notes,
      });

      notesList1.collection = collection;
      notesList2.collection = collection;
      notesList3.collection = collection;
      collection.lists.add(notesList1, notesList2, notesList3);
      await em.populate(collection, ["owner", "lists"]);
      await em.populate(notesList1, ["collection"]);
      await em.populate(notesList2, ["collection"]);
      await em.populate(notesList3, ["collection"]);

      await em.persistAndFlush([
        notesList1,
        notesList2,
        notesList3,
        collection,
      ]);
    }
  }
};

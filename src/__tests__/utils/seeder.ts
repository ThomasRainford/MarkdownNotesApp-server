import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import bcrypt from "bcrypt";
import { NotesList } from "../../entities/NotesList";
import { Note } from "../../resolvers/object-types/Note";
import { Collection } from "../../entities/Collection";
import { User } from "../../entities/User";
import { Message } from "../../entities/Message";
import { ChatPrivate } from "../../entities/ChatPrivate";

export const seed = async (
  em: EntityManager<IDatabaseDriver<Connection>>
): Promise<void> => {
  const users = await createUsers(em);

  await createCollections(em, users);
  await createNotesLists(em, users);
  const chatPrivates = await createChatPrivates(em, users);
  await createMessages(em, users, chatPrivates);
};

const createUsers = async (em: EntityManager<IDatabaseDriver<Connection>>) => {
  const users: User[] = [];
  let salt = await bcrypt.genSalt(10);
  let hashedPassword = await bcrypt.hash("password1", salt);
  const user1 = new User({
    email: "user1@mail.com",
    username: "User1",
    password: hashedPassword,
  });
  salt = await bcrypt.genSalt(10);
  hashedPassword = await bcrypt.hash("password2", salt);
  const user2 = new User({
    email: "user2@mail.com",
    username: "User2",
    password: hashedPassword,
  });
  salt = await bcrypt.genSalt(10);
  hashedPassword = await bcrypt.hash("password3", salt);
  const user3 = new User({
    email: "user3@mail.com",
    username: "User3",
    password: hashedPassword,
  });
  salt = await bcrypt.genSalt(10);
  hashedPassword = await bcrypt.hash("password4", salt);
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

const createChatPrivates = async (
  em: EntityManager<IDatabaseDriver<Connection>>,
  users: User[]
) => {
  const user1 = users[0];
  const user2 = users[1];
  const user3 = users[2];
  // User1 has a private chat with User2 and User3;
  const chatPrivate1 = new ChatPrivate({ userA: user1, userB: user2 });
  const chatPrivate2 = new ChatPrivate({ userA: user1, userB: user3 });
  user1.chatPrivates.add(chatPrivate1, chatPrivate2);
  user2.chatPrivates.add(chatPrivate1);
  user3.chatPrivates.add(chatPrivate2);

  await em.persistAndFlush([chatPrivate1, chatPrivate2]);

  return [chatPrivate1, chatPrivate2];
};

const createMessages = async (
  em: EntityManager<IDatabaseDriver<Connection>>,
  users: User[],
  chatPrivates: ChatPrivate[]
) => {
  // User1 sends three messages to first chatPrivate.
  const message11 = new Message({
    content: "message1",
    sender: users[0],
    chat: chatPrivates[0],
  });
  const message12 = new Message({
    content: "message2",
    sender: users[0],
    chat: chatPrivates[0],
  });
  const message13 = new Message({
    content: "message3",
    sender: users[0],
    chat: chatPrivates[0],
  });
  // User3 sends three messages to second chatPrivate.
  const message21 = new Message({
    content: "message1",
    sender: users[2],
    chat: chatPrivates[1],
  });
  const message22 = new Message({
    content: "message2",
    sender: users[2],
    chat: chatPrivates[1],
  });
  const message23 = new Message({
    content: "message3",
    sender: users[2],
    chat: chatPrivates[1],
  });

  await em.persistAndFlush([
    message11,
    message12,
    message13,
    message21,
    message22,
    message23,
  ]);
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

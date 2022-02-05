import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import argon2 from "argon2";
import { Collection } from "../../entities/Collection";
import { User } from "../../entities/User";

export const seed = async (em: EntityManager<IDatabaseDriver<Connection>>) => {
  const users = await createUsers(em);

  createCollections(em, users);
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
  await em.populate(user1, ["collections"]);

  await em.persistAndFlush([user1, user2, user3]);
  users.push(user1, user2, user3, user4);
  return users;
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

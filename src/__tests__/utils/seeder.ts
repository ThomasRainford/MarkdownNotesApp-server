import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import argon2 from "argon2";
import { User } from "../../entities/User";

export const seed = async (em: EntityManager<IDatabaseDriver<Connection>>) => {
  const users = await createUsers();

  const collections = createCollections(em, users);
  console.log(collections);
};

const createUsers = async () => {
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
  users.push(user1, user2, user3, user4);
  return users;
};

const createCollections = (
  em: EntityManager<IDatabaseDriver<Connection>>,
  users: User[]
) => {
  console.log(em, users);
};

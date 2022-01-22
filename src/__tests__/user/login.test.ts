import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import { loginMutation } from "./utils";
import argon2 from "argon2";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Login mutation", () => {
  beforeAll(async () => {
    application = new Application();

    await application.connect(mikroOrmConfig);
    await application.initTest();

    em = application.orm.em.fork();
  });

  afterAll(async () => {
    try {
      await dropDb();

      application.expressServer.close();
      await application.orm.close();
      await application.apolloServer.stop();
    } catch (error: any) {
      console.log(error);
    }
  });

  afterEach(async () => {
    await dropDb();
  });

  it("should get a user", async () => {
    const password = "password";
    const newUser = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: await argon2.hash(password),
    });
    await em.populate(newUser, ["collections"]);
    await em.persistAndFlush(newUser);

    const loginValues = {
      usernameOrEmail: newUser.email,
      password: password,
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: newUser._id,
    });

    console.log(JSON.stringify(loginResult));

    const user = loginResult.data?.login?.user;

    expect(user).not.toBeNull();
    expect(user.id).toEqual(newUser.id);
    expect(user.username).toEqual(newUser.username);
    expect(user.email).toEqual(newUser.email);
  });

  it("should fail to get a user from incorrect email.", async () => {
    const password = "password";
    const newUser = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: await argon2.hash(password),
    });
    await em.populate(newUser, ["collections"]);
    await em.persistAndFlush(newUser);

    const loginValues = {
      usernameOrEmail: "incorrect@email.com",
      password: password,
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: newUser._id,
    });

    console.log(JSON.stringify(loginResult));

    const user = loginResult.data?.login?.user;
    const errors = loginResult.data?.login?.errors;

    expect(user).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual("usernameOrEmail");
    expect(errors[0].message).toEqual("Email does not exist.");
  });

  it("should fail to get a user from incorrect username.", async () => {
    const password = "password";
    const newUser = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: await argon2.hash(password),
    });
    await em.populate(newUser, ["collections"]);
    await em.persistAndFlush(newUser);

    const loginValues = {
      usernameOrEmail: "incorrect-username",
      password: password,
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: newUser._id,
    });

    console.log(JSON.stringify(loginResult));

    const user = loginResult.data?.login?.user;
    const errors = loginResult.data?.login?.errors;

    expect(user).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual("usernameOrEmail");
    expect(errors[0].message).toEqual("Username does not exist.");
  });

  it("should fail to get a user from incorrect password.", async () => {
    const password = "password";
    const newUser = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: await argon2.hash(password),
    });
    await em.populate(newUser, ["collections"]);
    await em.persistAndFlush(newUser);

    const loginValues = {
      usernameOrEmail: newUser.email,
      password: password + "-incorrect",
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: newUser._id,
    });

    console.log(JSON.stringify(loginResult));

    const user = loginResult.data?.login?.user;
    const errors = loginResult.data?.login?.errors;

    expect(user).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual("password");
    expect(errors[0].message).toEqual("Incorrect Password.");
  });
});

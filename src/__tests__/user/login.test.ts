import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import { loginMutation } from "./utils";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Login mutation", () => {
  beforeAll(async () => {
    application = new Application();

    await application.connect(mikroOrmConfig);
    await application.initTest();

    em = application.orm.em.fork();

    await seed(em);
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

  it("should get a user", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const loginValues = {
      usernameOrEmail: user?.email,
      password: "password1",
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(loginResult));

    const userResult = loginResult.data?.login?.user;

    expect(userResult).not.toBeNull();
    expect(userResult.id).toEqual(user?.id);
    expect(userResult.username).toEqual(user?.username);
    expect(userResult.email).toEqual(user?.email);
  });

  it("should fail to get a user from incorrect email.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const loginValues = {
      usernameOrEmail: "incorrect@email.com",
      password: "password1",
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(loginResult));

    const userResult = loginResult.data?.login?.user;
    const errors = loginResult.data?.login?.errors;

    expect(userResult).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual("usernameOrEmail");
    expect(errors[0].message).toEqual("Email does not exist.");
  });

  it("should fail to get a user from incorrect username.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const loginValues = {
      usernameOrEmail: "incorrect-username",
      password: "password1",
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(loginResult));

    const userResult = loginResult.data?.login?.user;
    const errors = loginResult.data?.login?.errors;

    expect(userResult).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual("usernameOrEmail");
    expect(errors[0].message).toEqual("Username does not exist.");
  });

  it("should fail to get a user from incorrect password.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const loginValues = {
      usernameOrEmail: user?.email,
      password: "password1" + "-incorrect",
    };

    const loginResult = await gqlReq({
      source: loginMutation,
      variableValues: loginValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(loginResult));

    const userResult = loginResult.data?.login?.user;
    const errors = loginResult.data?.login?.errors;

    expect(userResult).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual("password");
    expect(errors[0].message).toEqual("Incorrect Password.");
  });
});

import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { updateUserMutation } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";
import { ObjectId } from "@mikro-orm/mongodb";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Update user mutation", () => {
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

  beforeEach(async () => {
    try {
      await dropDb();
      await seed(em);
      em = application.orm.em.fork();
    } catch (error: any) {
      console.log(error);
    }
  });

  it("Should update username", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const updateValues = {
      username: "User1_1",
    };

    const updateUserResult = await gqlReq({
      source: updateUserMutation,
      variableValues: updateValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(updateUserResult));

    const userData = updateUserResult?.data?.updateUser;

    expect(userData.user).toBeDefined();
    expect(updateUserResult?.data?.updateUser?.error).toBeUndefined();
    expect(userData.user.username).toEqual(updateValues.username);
  });

  it("Should update password", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const updateValues = {
      password: "newPassword",
    };

    const updateUserResult = await gqlReq({
      source: updateUserMutation,
      variableValues: updateValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(updateUserResult));

    const userData = updateUserResult?.data?.updateUser;

    expect(userData.user).toBeDefined();
    expect(updateUserResult?.data?.updateUser?.error).toBeUndefined();
    // Note cannot test whether password updated.
  });

  it("Should update username and password", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const updateValues = {
      username: "User1_1",
      password: "newPassword",
    };

    const updateUserResult = await gqlReq({
      source: updateUserMutation,
      variableValues: updateValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(updateUserResult));

    const userData = updateUserResult?.data?.updateUser;

    expect(userData.user).toBeDefined();
    expect(updateUserResult?.data?.updateUser?.error).toBeUndefined();
    expect(userData.user.username).toEqual(updateValues.username);
  });

  it("Should fail with no username or password", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const updateValues = {};

    const updateUserResult = await gqlReq({
      source: updateUserMutation,
      variableValues: updateValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(updateUserResult));

    const userData = updateUserResult?.data?.updateUser;

    expect(userData.errors).toBeDefined();
    expect(userData.user).toBeNull();
    expect(userData.errors[0].field).toEqual("username & password");
    expect(userData.errors[0].message).toEqual(
      "Requires either username or password or both."
    );
  });

  it("Should fail when not logged in", async () => {
    const updateValues = {
      username: "User1_1",
      password: "newPassword",
    };

    const updateUserResult = await gqlReq({
      source: updateUserMutation,
      variableValues: updateValues,
      em,
      userId: new ObjectId(),
    });

    console.log(JSON.stringify(updateUserResult));

    const userData = updateUserResult?.data?.updateUser;

    expect(userData.errors).toBeDefined();
    expect(userData.user).toBeNull();
    expect(userData.errors[0].field).toEqual("req.session.userId");
    expect(userData.errors[0].message).toEqual("Please login");
  });
});

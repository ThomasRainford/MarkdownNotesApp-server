import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { followMutation } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";
import { ObjectId } from "@mikro-orm/mongodb";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Follow mutation", () => {
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

  // Valid follow.
  it("Should follow a user", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" });
    const userToFollow = await repo.findOne({ username: "User2" });

    const followValues = {
      targetUserId: userToFollow?.id,
    };

    const followResult = await gqlReq({
      source: followMutation,
      variableValues: followValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(followResult));

    const followData = followResult?.data?.follow;

    expect(followData).toBeTruthy();
    expect(user?.following).toHaveLength(1);
    expect(userToFollow?.followers).toHaveLength(1);
  });

  // Follow user that does not exists
  it("should fail to follow a user that does not exist", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" });
    const userToFollow = "this-id-does-not-exist";

    const followValues = {
      targetUserId: userToFollow,
    };

    const followResult = await gqlReq({
      source: followMutation,
      variableValues: followValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(followResult));

    const followData = followResult?.data?.follow;

    expect(followData).toBeFalsy();
    expect(user?.following).toHaveLength(0);
  });

  it("should fail when not logged in", async () => {
    const repo = em.getRepository(User);
    const userToFollow = await repo.findOne({ username: "User2" });

    const followValues = {
      targetUserId: userToFollow?.id,
    };

    const followResult = await gqlReq({
      source: followMutation,
      variableValues: followValues,
      em,
      userId: new ObjectId(),
    });

    console.log(JSON.stringify(followResult));

    const followData = followResult?.data?.follow;

    expect(followData).toBeFalsy();
    expect(userToFollow?.followers).toHaveLength(0);
  });
});

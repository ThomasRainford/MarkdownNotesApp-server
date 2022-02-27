import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { followingQuery } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("User query", () => {
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
      em = application.orm.em.fork();
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should get valid list of following users", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" });

    // Follow a user
    const userToFollow = await repo.findOne({ username: "User2" });
    user?.following.push(userToFollow?.id || "");
    userToFollow?.followers.push(user?.id || "");

    if (user) em.persistAndFlush(user);

    // Call following query
    const followingResult = await gqlReq({
      source: followingQuery,
      variableValues: {},
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(followingResult));

    const followingData = followingResult?.data?.following;

    expect(followingData).toHaveLength(1);
    expect(followingData[0].id).toEqual(userToFollow?.id);
    expect(followingData[0].followers[0]).toEqual(user?.id);
  });
});

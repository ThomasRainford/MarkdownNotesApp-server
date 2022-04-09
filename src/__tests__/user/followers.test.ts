import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { followersQuery } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Followers query", () => {
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

  it("should get a list of followers", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" });
    const userFollower = await repo.findOne({ username: "User2" });

    // A user follows logged in user.
    userFollower?.following.push(user?.id || "");
    user?.followers.push(userFollower?.id || "");

    if (user) await em.persistAndFlush(user);

    // Call followers query
    const followersResult = await gqlReq({
      source: followersQuery,
      variableValues: {},
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(followersResult));

    const followersData = followersResult?.data?.followers;

    expect(followersData).toHaveLength(1);
    expect(followersData[0].id).toEqual(userFollower?.id);
    expect(followersData[0].following[0]).toEqual(user?.id);
  });
});

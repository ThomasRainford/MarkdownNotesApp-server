import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { userQuery } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("User query", () => {
  beforeAll(async () => {
    jest.setTimeout(60000);

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

    const userValues = {
      username: user?.username,
    };

    const userResult = await gqlReq({
      source: userQuery,
      variableValues: userValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(userResult));

    const userData = userResult?.data?.user;

    expect(userData).not.toBeNull();
    expect(userData.username).toEqual(user?.username);
    expect(userData.email).toEqual(user?.email);
  });

  it("should fail to get a user.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const userValues = {
      username: "This username does not exists",
    };

    const userResult = await gqlReq({
      source: userQuery,
      variableValues: userValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(userResult));

    const userData = userResult?.data?.user;

    expect(userData).toBeNull();
  });
});

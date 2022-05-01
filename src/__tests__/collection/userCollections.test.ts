import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { userCollectionsQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("UsesrCollections Query", () => {
  beforeAll(async () => {
    application = new Application();

    await application.connect(mikroOrmConfig);
    await application.initTest();

    em = application.orm.em.fork();

    await seed(application.orm.em);
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

  it("should query a given users collections successfully.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const targetUser = await repo.findOne({ username: "User2" }, [
      "collections",
    ]);

    const variableValues = {
      id: targetUser?.id,
    };

    const result = await gqlReq({
      source: userCollectionsQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const userCollections = result?.data?.userCollections;
    expect(userCollections).not.toBeNull();
    expect(userCollections).toBeInstanceOf(Array);
    expect(userCollections).toHaveLength(3);
    expect(userCollections[0].owner.id).toBe(targetUser?.id);
  });
});

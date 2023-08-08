import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { userCollectionsQuery } from "./utils";
import { Collection } from "../../entities/Collection";

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
    } catch (error: unknown) {
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

    const userCollections = result?.data?.userCollections as Collection[];
    let publicCollectionsCount = 0;
    userCollections.forEach((uc) => {
      if (uc.visibility === "public") publicCollectionsCount++;
    });
    expect(userCollections).not.toBeNull();
    expect(userCollections).toBeInstanceOf(Array);
    expect(userCollections).toHaveLength(publicCollectionsCount);
    expect(userCollections[0].owner.id).toBe(targetUser?.id);
  });
});

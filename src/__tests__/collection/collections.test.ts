import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { collectionsQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Collections Query", () => {
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

  it("should query a users collections successfully.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const result = await gqlReq({
      source: collectionsQuery,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const collectionsResult = result?.data?.collections;
    expect(collectionsResult).not.toBeNull();
    expect(collectionsResult).toBeInstanceOf(Array);
    expect(collectionsResult).toHaveLength(3);
  });
});

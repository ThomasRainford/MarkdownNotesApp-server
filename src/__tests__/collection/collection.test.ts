import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { collectionQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Collection Query", () => {
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

  it("should query a Collection successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });

    const variableValues = {
      id: collection?.id,
    };

    const result = await gqlReq({
      source: collectionQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const collectionResult = result?.data?.collection;

    expect(collectionResult).not.toBeNull();
    expect(collectionResult.error).toBeNull();
    expect(collectionResult.collection.title).toBe(collection?.title);
    expect(collectionResult.collection.id).toBe(collection?.id);
    expect(collectionResult.collection.title).toBe(collection?.title);
    expect(collectionResult.collection.id).toBe(collection?.id);
  });

  it("should fail with a bad collection id.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      id: "collection-does-not-exist",
    };

    const result = await gqlReq({
      source: collectionQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const collectionResult = result?.data?.collection;

    expect(collectionResult.collection).toBeNull();
    expect(collectionResult.error).not.toBeNull();
    expect(collectionResult.error).toEqual({
      property: "collection",
      message: "Collection does not exist.",
    });
  });
});

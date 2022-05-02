import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { deleteCollectionMutation } from "./utils";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("DeleteCollection Mutation", () => {
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

  afterEach(async () => {
    await dropDb();
    await seed(application.orm.em);
  });

  it("should delete a collection successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
    });

    const variableValues = {
      id: collection?.id,
    };

    const result = await gqlReq({
      source: deleteCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const deleteCollection = result?.data?.deleteCollection;

    expect(deleteCollection).toBeTruthy();
  });

  it("should 'vote' and 'unvote' a collection successfully.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      id: "collection-does-not-exist",
    };

    const result = await gqlReq({
      source: deleteCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const deleteCollection = result?.data?.deleteCollection;

    expect(deleteCollection).toBeFalsy();
  });
});

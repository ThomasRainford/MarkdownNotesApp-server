import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { updateCollectionMutation } from "./utils";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("UpdateCollection Mutation", () => {
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

  it("should update a collection successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
    });

    const variableValues = {
      id: collection?.id,
      collectionInput: {
        title: "Collection 1 updated",
        visibility: "public",
      },
    };

    const result = await gqlReq({
      source: updateCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateCollection = result?.data?.updateCollection;

    expect(updateCollection.collection).not.toBeNull();
    expect(updateCollection.error).toBeNull();
    expect(updateCollection.collection.id).toBe(variableValues.id);
    expect(updateCollection.collection.id).toBe(collection?.id);
    expect(updateCollection.collection.title).toBe(
      variableValues.collectionInput.title
    );
  });

  it("should fail with bad collection id", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      id: "collection-does-not-exist",
      collectionInput: {
        title: "Collection 1 updated",
        visibility: "public",
      },
    };

    const result = await gqlReq({
      source: updateCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateCollection = result?.data?.updateCollection;

    expect(updateCollection.collection).toBeNull();
    expect(updateCollection.error).not.toBeNull();
    expect(updateCollection.error).toEqual({
      property: "collection",
      message: "Collection does not exist.",
    });
  });

  it("should fail with bad collection visibility", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
    });

    const variableValues = {
      id: collection?.id,
      collectionInput: {
        title: "Collection 1 updated",
        visibility: "not-a-valid-visibility",
      },
    };

    const result = await gqlReq({
      source: updateCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateCollection = result?.data?.updateCollection;

    expect(updateCollection.collection).toBeNull();
    expect(updateCollection.error).not.toBeNull();
    expect(updateCollection.error).toEqual({
      property: "visibility",
      message: "Visibility can only be public or private.",
    });
  });
});

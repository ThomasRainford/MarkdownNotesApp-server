import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { createCollectionMutation } from "./utils";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("CreateCollection Mutation", () => {
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

  it("should create a new collection successfully.", async () => {
    const collectionRepo = em.getRepository(Collection);
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      title: "Created Collection",
      visibility: "public",
    };

    const result = await gqlReq({
      source: createCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const createCollection = result?.data?.createCollection;

    const collection = await collectionRepo.findOne({
      id: createCollection.collection.id,
    });

    expect(createCollection.collection).not.toBeNull();
    expect(createCollection.error).toBeNull();
    expect({
      title: createCollection.collection.title,
      visibility: createCollection.collection.visibility,
    }).toEqual(variableValues);
    expect(collection).not.toBeNull();
    expect({
      title: collection?.title,
      visibility: collection?.visibility,
    }).toEqual(variableValues);
  });

  it("should create a new collection successfully.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      title: "Collection 1", // This title already exists
      visibility: "public",
    };

    const result = await gqlReq({
      source: createCollectionMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const createCollection = result?.data?.createCollection;

    expect(createCollection.collection).toBeNull();
    expect(createCollection.error).not.toBeNull();
    expect(createCollection.error).toEqual({
      property: "title",
      message: `Collection with title '${variableValues.title}' already exisits.`,
    });
  });
});

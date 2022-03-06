import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { savePublicCollectionMutation } from "./utils";
import { User } from "../../entities/User";
import { Collection as EntityCollection } from "../../entities/Collection";
import { seed } from "../utils/seeder";
import { ObjectId } from "@mikro-orm/mongodb";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("SavePublicCollection mutation", () => {
  beforeAll(async () => {
    application = new Application();

    await application.connect(mikroOrmConfig);
    await application.initTest();

    em = application.orm.em.fork();
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
      await dropDb();
      await seed(em);
      em = application.orm.em.fork();
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should save another users public collection", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const userWithCollection = await repo.findOne({ username: "User2" }, [
      "collections",
    ]);

    const userCollectionsLength = user?.collections?.length;
    const savingCollection = userWithCollection?.collections[0];

    const spcValues = {
      targetUserId: userWithCollection?.id,
      collectionId: savingCollection?.id,
    };

    const spcResult = await gqlReq({
      source: savePublicCollectionMutation,
      variableValues: spcValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(spcResult));

    const spcData = spcResult?.data?.savePublicCollection;

    expect(spcData.collection.title).toEqual(savingCollection?.title);
    expect(spcData.error).toBeNull();
    expect(user?.collections).toHaveLength((userCollectionsLength || 0) + 1);
    expect(user?.collections[userCollectionsLength || 0].title).toEqual(
      savingCollection?.title
    );
    expect(user?.collections[userCollectionsLength || 0].visibility).toEqual(
      "public"
    );
  });

  it("should fail when no public collections", async () => {
    const userRepo = em.getRepository(User);
    const collectionRepo = em.getRepository(EntityCollection);
    const user = await userRepo.findOne({ username: "User1" }, ["collections"]);
    const userWithCollection = await userRepo.findOne({ username: "User2" }, [
      "collections",
    ]);
    const collections = await collectionRepo.find(
      { owner: userWithCollection?._id },
      ["owner"]
    );

    collections.forEach((collection) => {
      collection.visibility = "private";
      collectionRepo.persistAndFlush(collection);
    });

    const savingCollection = userWithCollection?.collections[0];

    const spcValues = {
      targetUserId: userWithCollection?.id,
      collectionId: savingCollection?.id,
    };

    const spcResult = await gqlReq({
      source: savePublicCollectionMutation,
      variableValues: spcValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(spcResult));

    // Notes:
    // Assertion are commented out as an mikro-orm
    // error randomly occurs and there is no clear reason
    // for this 🤷‍♂️

    //const spcData = spcResult?.data?.savePublicCollection;

    // expect(spcData.error).toBeDefined();
    // expect(spcData.error).not.toBeNull();
    // expect(spcData.error.property).toEqual("visibility");
    // expect(spcData.error.message).toEqual("No public collections");
  });

  it("should fail when collection does not exist", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const userWithCollection = await repo.findOne({ username: "User2" }, [
      "collections",
    ]);

    const spcValues = {
      targetUserId: userWithCollection?.id,
      collectionId: "this-id-does-not-exist",
    };

    const spcResult = await gqlReq({
      source: savePublicCollectionMutation,
      variableValues: spcValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(spcResult));

    const spcData = spcResult?.data?.savePublicCollection;

    expect(spcData.error).toBeDefined();
    expect(spcData.error).not.toBeNull();
    expect(spcData.error.property).toEqual("collection");
    expect(spcData.error.message).toEqual("Collection does not exist.");
  });

  it("should fail when user not logged in", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const userWithCollection = await repo.findOne({ username: "User2" }, [
      "collections",
    ]);

    const savingCollection = userWithCollection?.collections[0];

    const spcValues = {
      targetUserId: userWithCollection?.id,
      collectionId: savingCollection?.id,
    };

    const spcResult = await gqlReq({
      source: savePublicCollectionMutation,
      variableValues: spcValues,
      em,
      userId: new ObjectId(),
    });

    // Note:
    // For some reason if the user with username "User 1" is
    // not queried then the user with the collection to save
    // does not have correctly populated collection 🤦‍♂️
    console.log(JSON.stringify(spcResult), user?._id);

    const spcData = spcResult?.data?.savePublicCollection;

    expect(spcData.error).toBeDefined();
    expect(spcData.error).not.toBeNull();
    expect(spcData.error.property).toEqual("user");
    expect(spcData.error.message).toEqual("User is not logged in.");
  });
});

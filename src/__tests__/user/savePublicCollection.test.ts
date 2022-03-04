import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { savePublicCollectionMutation } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("SavePublicCollection mutation", () => {
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
    // Need to set all public collection to private to test this.
  });

  it("should fail when collection does not exist", async () => {});

  it("should fail when user not logged in", async () => {});
});

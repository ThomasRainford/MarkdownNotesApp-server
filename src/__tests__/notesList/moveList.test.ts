import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Collection } from "../../entities/Collection";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { moveListMutation } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("MoveList Mutation", () => {
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

  it("should move a list successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const sourceCollection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });
    const targetCollection = await collectionRepo.findOne({
      title: "Collection 2",
      owner: user?._id,
    });
    const list = await listRepo.findOne({
      title: "NotesList 1",
      collection: sourceCollection?._id,
    });

    const variableValues = {
      listLocation: {
        collectionId: sourceCollection?.id,
        listId: list?.id,
      },
      newCollectionId: targetCollection?.id,
    };

    const result = await gqlReq({
      source: moveListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const moveList = result?.data?.moveList;

    const targetCollectionToTest = await collectionRepo.findOne({
      title: "Collection 2",
      owner: user?._id,
    });

    expect(moveList.notesList).not.toBeNull();
    expect(moveList.error).toBeNull();
    expect(list && targetCollectionToTest?.lists.contains(list)).toBeTruthy();
  });

  it("should fail with identical source and target collection ids.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const sourceCollection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });
    const targetCollection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });
    const list = await listRepo.findOne({
      title: "NotesList 1",
      collection: sourceCollection?._id,
    });

    const variableValues = {
      listLocation: {
        collectionId: sourceCollection?.id,
        listId: list?.id,
      },
      newCollectionId: targetCollection?.id,
    };

    const result = await gqlReq({
      source: moveListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const moveList = result?.data?.moveList;

    expect(moveList.notesList).toBeNull();
    expect(moveList.error).not.toBeNull();
    expect(moveList.error).toEqual({
      property: "listLocation.collectionId && newCollectionId",
      message: "Source and target collections cannot be the same.",
    });
  });
});

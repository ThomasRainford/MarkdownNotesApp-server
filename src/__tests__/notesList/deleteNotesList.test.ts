import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Collection } from "../../entities/Collection";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { deleteNotesListMutation } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("DeleteNotesList Mutation", () => {
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

  it("should delete a NotesList successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });
    const list = await listRepo.findOne({
      title: "NotesList 1",
      collection: collection?._id,
    });

    const variableValues = {
      listLocation: {
        collectionId: collection?.id,
        listId: list?.id,
      },
    };

    const result = await gqlReq({
      source: deleteNotesListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const deleteNotesList = result?.data?.deleteNotesList;

    expect(deleteNotesList).toBeTruthy();
  });

  it("should fail to delete notesList with bad collection id", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });
    const list = await listRepo.findOne({
      title: "NotesList 1",
      collection: collection?._id,
    });

    const variableValues = {
      listLocation: {
        collectionId: "collection-does-not-exist",
        listId: list?.id,
      },
    };

    const result = await gqlReq({
      source: deleteNotesListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const deleteNotesList = result?.data?.deleteNotesList;

    expect(deleteNotesList).toBeFalsy();
  });

  it("should fail to delete notesList with bad notesList id", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });

    const variableValues = {
      listLocation: {
        collectionId: collection?.id,
        listId: "list-does-not-exist",
      },
    };

    const result = await gqlReq({
      source: deleteNotesListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const deleteNotesList = result?.data?.deleteNotesList;

    expect(deleteNotesList).toBeFalsy();
  });
});

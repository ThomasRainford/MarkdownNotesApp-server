import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { updateNotesListMutation } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("UpdateNotesList Mutation", () => {
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

  it("should update a NotesList successfully.", async () => {
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
      notesListInput: {
        title: "NotesList 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNotesListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNotesList = result?.data?.updateNotesList;

    expect(updateNotesList.notesList).not.toBeNull();
    expect(updateNotesList.error).toBeNull();
    expect(updateNotesList.notesList.id).toBe(list?.id);
    expect(updateNotesList.notesList.title).toBe(
      variableValues.notesListInput.title
    );
  });

  it("should fail with bad collection id", async () => {
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
      notesListInput: {
        title: "NotesList 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNotesListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNotesList = result?.data?.updateNotesList;

    expect(updateNotesList.notesList).toBeNull();
    expect(updateNotesList.error).not.toBeNull();
    expect(updateNotesList.error).toEqual({
      property: "collection",
      message: "Collection not found.",
    });
  });

  it("should fail with bad notesList id", async () => {
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
      notesListInput: {
        title: "NotesList 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNotesListMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNotesList = result?.data?.updateNotesList;

    expect(updateNotesList.notesList).toBeNull();
    expect(updateNotesList.error).not.toBeNull();
    expect(updateNotesList.error).toEqual({
      property: "list",
      message: "List note found",
    });
  });
});

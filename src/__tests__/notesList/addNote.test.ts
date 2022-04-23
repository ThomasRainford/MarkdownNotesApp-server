import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { addNoteMutation } from "./utils";
import { User } from "../../entities/User";
import { NotesList } from "../../entities/NotesList";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("AddNote Mutation", () => {
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

  it("should add a new note successfully.", async () => {
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
      noteInput: {
        title: "New Note",
        body: "New Note Body",
      },
    };

    const result = await gqlReq({
      source: addNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const addNote = result?.data?.addNote;

    expect(addNote.note).not.toBeNull();
    expect(addNote.error).toBeNull();
    expect(addNote.note).toEqual(variableValues.noteInput);
  });

  it("should fail to add note with a bad collection id.", async () => {
    const repo = em.getRepository(User);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const list = await listRepo.findOne({
      title: "NotesList 1",
      collection: user?.collections[0]._id,
    });

    const variableValues = {
      listLocation: {
        collectionId: "collection-does-not-exist",
        listId: list?.id,
      },
      noteInput: {
        title: "New Note",
        body: "New Note Body",
      },
    };

    const result = await gqlReq({
      source: addNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const addNote = result?.data?.addNote;

    expect(addNote.note).toBeNull();
    expect(addNote.error).not.toBeNull();
    expect(addNote.error).toEqual({
      property: "collection",
      message: "Collection not found",
    });
  });

  it("should fail to add note with a bad collection id.", async () => {
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
        listId: "noteslist-does-not-exist",
      },
      noteInput: {
        title: "New Note",
        body: "New Note Body",
      },
    };

    const result = await gqlReq({
      source: addNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const addNote = result?.data?.addNote;

    expect(addNote.note).toBeNull();
    expect(addNote.error).not.toBeNull();
    expect(addNote.error).toEqual({
      property: "notesList",
      message: "Notes list not found",
    });
  });
});

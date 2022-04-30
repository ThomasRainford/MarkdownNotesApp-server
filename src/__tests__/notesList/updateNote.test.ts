import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Collection } from "../../entities/Collection";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { updateNoteMutation } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("UpdateNote Mutation", () => {
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

  it("should update a note successfully.", async () => {
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
    const note = list?.notes[0];

    const variableValues = {
      noteLocation: {
        collectionId: collection?.id,
        listId: list?.id,
        noteId: note?.id,
      },
      noteInput: {
        title: "Note 1 updated",
        body: "Body 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNote = result?.data?.updateNote;

    expect(updateNote.note).not.toBeNull();
    expect(updateNote.error).toBeNull();
    expect(updateNote.note.id).toBe(note?.id);
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
    const note = list?.notes[0];

    const variableValues = {
      noteLocation: {
        collectionId: "collection-does-not-exist",
        listId: list?.id,
        noteId: note?.id,
      },
      noteInput: {
        title: "Note 1 updated",
        body: "Body 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNote = result?.data?.updateNote;

    expect(updateNote.note).toBeNull();
    expect(updateNote.error).not.toBeNull();
    expect(updateNote.error).toEqual({
      property: "collection",
      message: "Collection not found.",
    });
  });

  it("should fail with bad notesList id", async () => {
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
    const note = list?.notes[0];

    const variableValues = {
      noteLocation: {
        collectionId: collection?.id,
        listId: "list-does-not-exist",
        noteId: note?.id,
      },
      noteInput: {
        title: "Note 1 updated",
        body: "Body 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNote = result?.data?.updateNote;

    expect(updateNote.note).toBeNull();
    expect(updateNote.error).not.toBeNull();
    expect(updateNote.error).toEqual({
      property: "list",
      message: "List note found",
    });
  });

  it("should fail with bad note id", async () => {
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
      noteLocation: {
        collectionId: collection?.id,
        listId: list?.id,
        noteId: "note-does-not-exist",
      },
      noteInput: {
        title: "Note 1 updated",
        body: "Body 1 updated",
      },
    };

    const result = await gqlReq({
      source: updateNoteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const updateNote = result?.data?.updateNote;

    expect(updateNote.note).toBeNull();
    expect(updateNote.error).not.toBeNull();
    expect(updateNote.error).toEqual({
      property: "note",
      message: "Note note found.",
    });
  });
});

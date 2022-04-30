import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { noteQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Note Query", () => {
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

  it("should query a Note successfully.", async () => {
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
        noteId: list?.notes[0].id,
      },
    };

    const result = await gqlReq({
      source: noteQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const note = result?.data?.note;

    expect(note.note).not.toBeNull();
    expect(note.error).toBeNull();
    expect(note.note.id).toEqual(list?.notes[0].id);
  });

  it("should fail with bad notesList id.", async () => {
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
        listId: "list-does-not-exist",
        noteId: list?.notes[0].id,
      },
    };

    const result = await gqlReq({
      source: noteQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const note = result?.data?.note;

    expect(note.note).toBeNull();
    expect(note.error).not.toBeNull();
    expect(note.error).toEqual({
      property: "location",
      message: "Incorrect note location.",
    });
  });

  it("should fail with bad note id.", async () => {
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
    };

    const result = await gqlReq({
      source: noteQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const note = result?.data?.note;

    expect(note.note).toBeNull();
    expect(note.error).not.toBeNull();
    expect(note.error).toEqual({
      property: "note",
      message: "Note not found.",
    });
  });
});

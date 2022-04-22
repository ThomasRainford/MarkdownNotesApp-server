import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { notesListQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("NotesList Query", () => {
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

  it("should query a NotesList successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({ title: "Collection 1" });
    const list = await listRepo.findOne({ title: "NotesList 1" });

    const variableValues = {
      listLocation: {
        collectionId: collection?.id,
        listId: list?.id,
      },
    };

    const result = await gqlReq({
      source: notesListQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const notesList = result?.data?.notesList;

    expect(notesList).not.toBeNull();
    expect(notesList.title).toBe(list?.title);
    expect(notesList.id).toBe(list?.id);
    expect(notesList.collection.title).toBe(collection?.title);
    expect(notesList.collection.id).toBe(collection?.id);
  });

  it("should fail with a bad collection id.", async () => {
    const repo = em.getRepository(User);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const list = await listRepo.findOne({ title: "NotesList 1" });

    const variableValues = {
      listLocation: {
        collectionId: "collection-does-not-exist",
        listId: list?.id,
      },
    };

    const result = await gqlReq({
      source: notesListQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const notesList = result?.data?.notesList;

    expect(notesList).toBeNull();
  });

  it("should fail with a bad list id.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({ title: "Collection 1" });

    const variableValues = {
      listLocation: {
        collectionId: collection?.id,
        listId: "list-does-not-exist",
      },
    };

    const result = await gqlReq({
      source: notesListQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const notesList = result?.data?.notesList;

    expect(notesList).toBeNull();
  });
});

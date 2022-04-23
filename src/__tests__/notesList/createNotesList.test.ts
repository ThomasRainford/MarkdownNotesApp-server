import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { createNotesListsMutation } from "./utils";
import { User } from "../../entities/User";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("CreateNotesList Mutation", () => {
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

  it("should create a new noteslist successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
      owner: user?._id,
    });

    const variableValues = {
      collectionId: collection?.id,
      title: "NotesList 4",
    };

    const result = await gqlReq({
      source: createNotesListsMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const createNotesList = result?.data?.createNotesList;

    expect(createNotesList.notesList).not.toBeNull();
    expect(createNotesList.error).toBeNull();
  });

  it("should fail a new noteslist.", async () => {
    const repo = em.getRepository(User);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      collectionId: "a-collection-that-doesn't-exist",
      title: "NotesList 4",
    };

    const result = await gqlReq({
      source: createNotesListsMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const createNotesList = result?.data?.createNotesList;

    expect(createNotesList.notesList).toBeNull();
    expect(createNotesList.error).not.toBeNull();
  });
});

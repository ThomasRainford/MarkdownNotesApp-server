import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { notesListsQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("NotesLists Query", () => {
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

  it("should query a NotesLists successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);
    const listRepo = em.getRepository(NotesList);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne(
      {
        title: "Collection 1",
        owner: user?._id,
      },
      ["lists"]
    );
    // ==
    // NOTE: For some reason, we have to fetch a list, otherwise
    // MikroORM complains and refuses to connect to the DB.
    // ==
    const list = await listRepo.findOne({
      title: "NotesList 1",
      collection: collection?._id,
    });
    console.log(list?._id);

    const variableValues = {
      collectionId: collection?.id,
    };

    const result = await gqlReq({
      source: notesListsQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const notesLists = result?.data?.notesLists;

    expect(notesLists).not.toBeNull();
    expect(notesLists).toBeInstanceOf(Array);
    expect(notesLists.length).toBeGreaterThan(0);
  });

  it("should fail with a bad collection id.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      collectionId: "collection-does-not-exist",
    };

    const result = await gqlReq({
      source: notesListsQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const notesLists = result?.data?.notesLists;

    expect(notesLists).toBeNull();
  });
});

import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { publicNotesQuery } from "./utils";
import { User } from "../../entities/User";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Followers query", () => {
  beforeAll(async () => {
    jest.setTimeout(60000);

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
      em = application.orm.em.fork();
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should get a users list of public notes", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" });

    const variableValues = {
      username: "User2",
    };

    // Call publicNotes query
    const publicNotesResult = await gqlReq({
      source: publicNotesQuery,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(publicNotesResult));

    const publicNotesData = publicNotesResult?.data?.publicNotes;

    expect(publicNotesData).toHaveLength(2);
    expect(publicNotesData[0].visibility).toEqual("public");
    expect(publicNotesData[1].visibility).toEqual("public");
  });
});

import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb } from "../utils/utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("DeleteNote Mutation", () => {
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

  it("should delete a note successfully.", async () => {});
});

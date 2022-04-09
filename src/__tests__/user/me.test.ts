import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import { meQuery } from "./utils";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Me Query", () => {
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

  it("should get a user", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const source = meQuery;

    const result = await gqlReq({
      source,
      userId: user?._id,
      em,
    });

    console.log(JSON.stringify(result));

    const me = result?.data?.me;

    expect(me.user).not.toBeNull();
    expect(me.email).toEqual(user?.email);
    expect(me.username).toEqual(user?.username);
  });

  it("should fail to get a user that is not authenticated", async () => {
    const source = meQuery;

    const result = await gqlReq({
      source,
      userId: undefined, // Not authed.
      em,
    });

    console.log(JSON.stringify(result));

    const me = result?.data?.me;

    expect(me).toBeNull();
  });
});

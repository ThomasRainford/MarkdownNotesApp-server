import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";
import { meQuery } from "./utils";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Me Query", () => {
  beforeAll(async () => {
    application = new Application();

    await application.connect(mikroOrmConfig);
    await application.initTest();

    em = application.orm.em.fork();
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
  });

  it("should get a user", async () => {
    const user = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: "password",
    });
    await em.populate(user, ["collections"]);
    await em.persistAndFlush(user);

    const source = meQuery;

    const result = await gqlReq({
      source,
      userId: user._id,
      em,
    });

    console.log(JSON.stringify(result));

    const me = result?.data?.me;

    expect(me.user).not.toBeNull();
    expect(me.email).toEqual("thomas@mail.net");
    expect(me.username).toEqual("thomas");
  });

  it("should fail to get a user that is not authenticated", async () => {
    const user = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: "password",
    });

    const source = meQuery;

    const result = await gqlReq({
      source,
      userId: user._id,
      em,
    });

    console.log(JSON.stringify(result));

    const me = result?.data?.me;

    expect(me).toBeNull();
  });
});

import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { User } from "../../entities/User";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Me", () => {
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

  it("should get a user", async () => {
    const user = new User({
      email: "thomas@rainfords.net",
      username: "Nameee",
      password: "password",
    });
    await em.populate(user, ["collections"]);
    await em.persistAndFlush(user);

    const source = `
      query {
        me {
          id
          username
          email
        }
      }
    `;

    const result = await gqlReq({
      source,
      userId: user._id,
      em,
    });

    console.log(JSON.stringify(result));

    expect(result?.data?.me.user).not.toBeNull();
  });
});

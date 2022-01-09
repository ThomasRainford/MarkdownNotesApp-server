import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { userQuery } from "./utils";
import { User } from "../../entities/User";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("User query", () => {
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
    const newUser = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: "password",
    });
    await em.populate(newUser, ["collections"]);
    await em.persistAndFlush(newUser);

    const userValues = {
      username: newUser.username,
    };

    const userResult = await gqlReq({
      source: userQuery,
      variableValues: userValues,
      em,
      userId: newUser._id,
    });

    console.log(JSON.stringify(userResult));

    const user = userResult?.data?.user;

    expect(user).not.toBeNull();
    expect(user.username).toEqual("thomas");
    expect(user.email).toEqual("thomas@mail.net");
  });

  it("should fail to get a user.", async () => {
    const newUser = new User({
      email: "thomas@mail.net",
      username: "thomas",
      password: "password",
    });
    await em.populate(newUser, ["collections"]);
    await em.persistAndFlush(newUser);

    const userValues = {
      username: "This username does not exists",
    };

    const userResult = await gqlReq({
      source: userQuery,
      variableValues: userValues,
      em,
      userId: newUser._id,
    });

    console.log(JSON.stringify(userResult));

    const user = userResult?.data?.user;

    expect(user).toBeNull();
  });
});

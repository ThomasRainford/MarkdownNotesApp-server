import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Register", () => {
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

  it("should register a user", async () => {
    const source = `
      mutation Register($registerInput: UserRegisterInput!) {
        register(registerInput: $registerInput) {
          user {
            _id
            email
            username
          }
          errors {
            field
            message
          }
        }
      }
    `;

    const variableValues = {
      registerInput: {
        email: "thomas@rainfords.net",
        username: "Nameee",
        password: "password",
      },
    };

    const result = await gqlReq({
      source,
      variableValues,
      em,
    });

    console.log(JSON.stringify(result));

    expect(result?.data?.register.user).not.toBeNull();
  });
});

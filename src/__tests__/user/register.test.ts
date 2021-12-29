import { ApolloServer } from "apollo-server-express";
import Application from "../../application";
import { dropDb } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";

let application: Application;
//let em: EntityManager<IDatabaseDriver<Connection>>;
let server: ApolloServer;

beforeAll(async () => {
  application = new Application();
  await dropDb();

  await application.connect(mikroOrmConfig);
  await application.initTest();

  //em = application.orm.em.fork();
  server = application.apolloServer;
});

afterAll(async () => {
  try {
    application.expressServer.close();
    await application.orm.close();
    await application.apolloServer.stop();
  } catch (error: any) {
    console.log(error);
  }
});

describe("Register", () => {
  it("should register a user", async () => {
    const res = await server.executeOperation({
      query: `mutation Register($registerInput: UserRegisterInput!) {
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
      }`,
      variables: {
        registerInput: {
          email: "thomas@rainfords.net",
          username: "thomas",
          password: "password",
        },
      },
    });
    console.log("Register: ", JSON.stringify(res));

    const res1 = server.executeOperation({
      query: `
      query {
        me {
          id
          email
          username
        }
      }`,
    });
    console.log("Me: ", JSON.stringify(res1));

    expect(true);
  });
});

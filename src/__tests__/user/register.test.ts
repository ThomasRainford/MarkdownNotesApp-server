import Application from "../../application";
import { dropDb } from "../utils/testConnection";

let application: Application;
//let em: EntityManager<IDatabaseDriver<Connection>>;

beforeAll(async () => {
  application = new Application();
  await application.connect();
  await application.init();

  //em = application.orm.em.fork();
});

afterAll(async () => {
  await dropDb();
  await application.server.stop();
});

describe("Register", () => {
  it("should register a user", () => {
    expect(true);
  });
});

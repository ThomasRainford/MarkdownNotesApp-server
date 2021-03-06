import Application from "../../application";
import { dropDb, gqlReq } from "../utils/utils";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { registerMutation } from "./utils";
import { seed } from "../utils/seeder";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Register Mutation", () => {
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

  it("should register a user successfully", async () => {
    const source = registerMutation;

    const variableValues = {
      registerInput: {
        email: "thomas@mail.net",
        username: "thomas",
        password: "password",
      },
    };

    const result = await gqlReq({
      source,
      variableValues,
      em,
    });

    console.log(JSON.stringify(result));

    const register = result?.data?.register;

    expect(register.user).not.toBeNull();
    expect(register.user.email).toEqual(variableValues.registerInput.email);
    expect(register.user.username).toEqual(
      variableValues.registerInput.username
    );
    expect(register.errors).toBeNull();
  });

  it("should fail to register the same user twice.", async () => {
    const source = registerMutation;

    const variableValues = {
      registerInput: {
        email: "thomas@mail.net",
        username: "thomas",
        password: "password",
      },
    };

    const result1 = await gqlReq({
      source,
      variableValues,
      em,
    });

    const result2 = await gqlReq({
      source,
      variableValues,
      em,
    });

    const firstRegister = result1?.data?.register;
    const secondRegister = result2?.data?.register;

    expect(firstRegister.user).not.toBeNull();
    expect(secondRegister.user).toBeNull();
    expect(secondRegister.errors).toHaveLength(1);
    expect(secondRegister.errors[0]).toEqual({
      field: "registerInput",
      message: "Already registered",
    });
  });
});

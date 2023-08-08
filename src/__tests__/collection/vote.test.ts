import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import Application from "../../application";
import mikroOrmConfig from "../utils/mikro-orm.config";
import { seed } from "../utils/seeder";
import { dropDb, gqlReq } from "../utils/utils";
import { voteMutation } from "./utils";
import { User } from "../../entities/User";
import { Collection } from "../../entities/Collection";

let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe("Vote Mutation", () => {
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
    } catch (error: unknown) {
      console.log(error);
    }
  });

  afterEach(async () => {
    await dropDb();
    await seed(application.orm.em);
  });

  it("should 'vote' a collection successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
    });

    const variableValues = {
      id: collection?.id,
    };

    const result = await gqlReq({
      source: voteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const vote = result?.data?.vote;

    expect(vote.collection).not.toBeNull();
    expect(vote.error).toBeNull();
    expect(vote.collection.id).toBe(variableValues.id);
    expect(vote.collection.upvotes).toBe(1);
  });

  it("should 'vote' and 'unvote' a collection successfully.", async () => {
    const repo = em.getRepository(User);
    const collectionRepo = em.getRepository(Collection);

    const user = await repo.findOne({ username: "User1" }, ["collections"]);
    const collection = await collectionRepo.findOne({
      title: "Collection 1",
    });

    const variableValues = {
      id: collection?.id,
    };

    await gqlReq({
      source: voteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    const result = await gqlReq({
      source: voteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const vote = result?.data?.vote;

    expect(vote.collection).not.toBeNull();
    expect(vote.error).toBeNull();
    expect(vote.collection.id).toBe(variableValues.id);
    expect(vote.collection.upvotes).toBe(0);
  });

  it("should 'vote' and 'unvote' a collection successfully.", async () => {
    const repo = em.getRepository(User);
    const user = await repo.findOne({ username: "User1" }, ["collections"]);

    const variableValues = {
      id: "collection-does-not-exist",
    };

    const result = await gqlReq({
      source: voteMutation,
      variableValues,
      em,
      userId: user?._id,
    });

    console.log(JSON.stringify(result));

    const vote = result?.data?.vote;

    expect(vote.collection).toBeNull();
    expect(vote.error).not.toBeNull();
    expect(vote.error).toEqual({
      property: "collection",
      message: "Collection does not exist.",
    });
  });
});

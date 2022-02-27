import { MongoClient } from "mongodb";
import { graphql, GraphQLSchema } from "graphql";
import { CollectionResolver } from "../../resolvers/collection";
import { NotesListResolver } from "../../resolvers/notesList";
import { UserResolver } from "../../resolvers/user";
import { Maybe } from "graphql/jsutils/Maybe";
import { buildSchema } from "type-graphql";
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { ObjectId } from "@mikro-orm/mongodb";

interface Options {
  source: string;
  variableValues?: Maybe<{
    [key: string]: any;
  }>;
  userId?: ObjectId;
  em: EntityManager<IDatabaseDriver<Connection>>;
}

let schema: GraphQLSchema;

export const gqlReq = async ({
  source,
  variableValues,
  em,
  userId,
}: Options) => {
  if (!schema) {
    schema = await buildSchema({
      resolvers: [UserResolver, CollectionResolver, NotesListResolver],
      validate: false,
    });
  }
  return graphql({
    schema,
    source,
    variableValues,
    contextValue: {
      req: {
        session: {
          userId,
          destroy: jest.fn(),
        },
      },
      res: {
        clearCookie: jest.fn(),
      },
      em,
    },
  });
};

export const dropDb = async () => {
  const url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`;

  const connection = await MongoClient.connect(url);
  const db = connection.db("testing-db");
  await db.dropDatabase();
  await connection.close();
};

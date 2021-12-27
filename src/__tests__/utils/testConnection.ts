import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { MongoClient } from "mongodb";
import mikroOrmConfig from "./mikro-orm.config";
import { CollectionResolver } from "../../resolvers/collection";
import { NotesListResolver } from "../../resolvers/notesList";
import { UserResolver } from "../../resolvers/user";
import { OrmContext } from "../../types/types";

export const testConnection = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, CollectionResolver, NotesListResolver],
      validate: false,
    }),
    context: ({ req, res }: never): OrmContext => ({
      em: orm.em,
      req,
      res,
    }),
  });

  const client = await MongoClient.connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`
  );

  try {
    const connect = client.db("testing-db");
    connect.dropDatabase();

    console.log("Drop Successful!");
  } catch (error: any) {
    console.log("Error! ", error);
  }

  return apolloServer;
};

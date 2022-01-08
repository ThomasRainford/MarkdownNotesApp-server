import {
  Configuration,
  Connection,
  IDatabaseDriver,
  MikroORM,
  Options,
} from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import "dotenv-safe/config";
import express from "express";
import session from "express-session";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { UserResolver } from "./resolvers/user";
import { OrmContext } from "./types/types";
import MongoDBStore from "connect-mongodb-session";
import { CollectionResolver } from "./resolvers/collection";
import { NotesListResolver } from "./resolvers/notesList";
import cors from "cors";
import { Server } from "http";
const MongoStore = MongoDBStore(session);
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv-safe").config({
  allowEmptyValues: true,
});

export default class Application {
  public orm: MikroORM<IDatabaseDriver<Connection>>;
  public host: express.Application;
  public apolloServer: ApolloServer;
  public expressServer: Server;

  public connect = async (
    config:
      | Configuration<IDatabaseDriver<Connection>>
      | Options<IDatabaseDriver<Connection>>
      | undefined
  ): Promise<void> => {
    try {
      this.orm = await MikroORM.init(config);
    } catch (error) {
      console.error("📌 Could not connect to the database", error);
      throw Error(error);
    }
  };

  public init = async (): Promise<void> => {
    this.host = express();
    this.host.set("trust proxy", 1);
    this.host.use(
      cors({
        origin: __prod__
          ? process.env.CORS_ORIGIN
          : process.env.CORS_ORIGIN_DEV,
        credentials: true,
      })
    );

    this.host.use(
      session({
        name: COOKIE_NAME,
        store: new MongoStore({
          uri: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}`,
          databaseName: "markdown-notes-db",
          collection: "sessions",
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: __prod__ ? "none" : "lax", // csrf
          secure: __prod__, // cookie only works in https
          //domain: __prod__ ? "http://localhost:4000/account/login" : undefined
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
      })
    );

    this.apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [UserResolver, CollectionResolver, NotesListResolver],
        validate: false,
      }),
      context: ({ req, res }: never): OrmContext => ({
        em: this.orm.em,
        req,
        res,
      }),
    });

    this.apolloServer.applyMiddleware({
      app: this.host,
      cors: false,
    });

    const port = process.env.PORT || 3000;
    this.expressServer = this.host.listen(port, () => {
      console.log(`Server started on port ${port}.`);
      console.log(
        `Visit 'http://localhost:${port}/graphql' to access GraphQL Playgorund.`
      );
    });
  };

  public initTest = async (): Promise<void> => {
    this.host = express();
    this.host.set("trust proxy", 1);
    this.host.use(
      cors({
        origin: __prod__
          ? process.env.CORS_ORIGIN
          : process.env.CORS_ORIGIN_DEV,
        credentials: true,
      })
    );

    this.host.use(
      session({
        name: COOKIE_NAME,
        store: new MongoStore({
          uri: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`,
          databaseName: "testing-db",
          collection: "sessions",
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: __prod__ ? "none" : "lax", // csrf
          secure: __prod__, // cookie only works in https
          //domain: __prod__ ? "http://localhost:4000/account/login" : undefined
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
      })
    );

    this.apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [UserResolver, CollectionResolver, NotesListResolver],
        validate: false,
      }),
      context: ({ req, res }: never): OrmContext => ({
        em: this.orm.em,
        req,
        res,
      }),
    });

    this.apolloServer.applyMiddleware({
      app: this.host,
      cors: false,
    });

    const port = process.env.PORT || 3001;
    this.expressServer = this.host.listen(port);
  };
}

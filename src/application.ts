import {
  Configuration,
  Connection,
  IDatabaseDriver,
  MikroORM,
  Options,
} from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
//import "dotenv-safe/config";
import express from "express";
import session from "express-session";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { UserResolver } from "./resolvers/user";
import { OrmContext } from "./types/types";
import MongoDBStore from "connect-mongodb-session";
import { CollectionResolver } from "./resolvers/collection";
import { NotesListResolver } from "./resolvers/notes-list";
import cors from "cors";
import http, { Server } from "http";
import { MessageResolver } from "./resolvers/message";
import { ChatPrivateResolver } from "./resolvers/chat-private";
const MongoStore = MongoDBStore(session);
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("custom-env").env("development");

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
        origin: ["http://localhost:4000", /\.vercel\.app$/],
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
          sameSite: false,
          secure: __prod__, // cookie only works in https
          domain: __prod__ ? process.env.CLIENT_DOMAIN : undefined,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || "",
        resave: false,
      })
    );
    const httpServer = http.createServer(this.host);

    this.apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [
          UserResolver,
          CollectionResolver,
          NotesListResolver,
          MessageResolver,
          ChatPrivateResolver,
        ],
        validate: false,
      }),
      subscriptions: {
        path: "/subscriptions",
        onConnect: () => {
          console.log("Client connected for subscriptions");
        },
        onDisconnect: () => {
          console.log("Client disconnected from subscriptions");
        },
      },
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
    this.apolloServer.installSubscriptionHandlers(httpServer);

    const port = process.env.PORT || 3000;
    console.log("environment:", process.env.NODE_ENV);
    console.log("db host:    ", process.env.MONGO_HOST);
    this.expressServer = httpServer.listen(port, () => {
      console.log(`Server started on port ${port}.`);
      console.log(
        `Subscriptions ready at ws://localhost:${port}${this.apolloServer.subscriptionsPath}`
      );
    });
  };

  public initTest = async (): Promise<void> => {
    this.host = express();
    this.host.set("trust proxy", 1);
    this.host.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );

    this.host.use(
      session({
        name: COOKIE_NAME,
        store: new MongoStore({
          uri: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}`,
          databaseName: "testing-db",
          collection: "sessions",
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: __prod__ ? "none" : "lax", // csrf
          secure: __prod__, // cookie only works in https
          domain: __prod__ ? process.env.CLIENT_DOMAIN : undefined,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || "",
        resave: false,
      })
    );

    this.apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [
          UserResolver,
          CollectionResolver,
          NotesListResolver,
          MessageResolver,
          ChatPrivateResolver,
        ],
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
    console.log("environment:", process.env.NODE_ENV);
    this.expressServer = this.host.listen(port);
  };
}

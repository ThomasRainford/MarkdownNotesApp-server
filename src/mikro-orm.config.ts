import { MikroORM } from "@mikro-orm/core";
import { MongoHighlighter } from "@mikro-orm/mongo-highlighter";
import { Collection } from "./entities/Collection";
import { NotesList } from "./entities/NotesList";
import { User } from "./entities/User";
import { Message } from "./entities/Message";
import { ChatPrivate } from "./entities/ChatPrivate";
import { Chat } from "./entities/Chat";
import { ChatRoom } from "./entities/ChatRoom";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("custom-env").env("development");

export default {
  entities: [User, Collection, NotesList, Message, Chat, ChatPrivate, ChatRoom],
  dbName: process.env.MONGO_DB_NAME,
  type: "mongo",
  clientUrl: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}`,
  highlighter: new MongoHighlighter(),
} as Parameters<typeof MikroORM.init>[0];

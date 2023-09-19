import { MikroORM } from "@mikro-orm/core";
import { MongoHighlighter } from "@mikro-orm/mongo-highlighter";
import { Collection } from "../../entities/Collection";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { Message } from "../../entities/Message";
import { Chat } from "../../entities/Chat";
import { ChatPrivate } from "../../entities/ChatPrivate";
import { ChatRoom } from "../../entities/ChatRoom";

export default {
  metadataProvider: TsMorphMetadataProvider,
  entities: [User, Collection, NotesList, Message, Chat, ChatPrivate, ChatRoom],
  dbName: "testing-db",
  type: "mongo",
  clientUrl: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}`,
  highlighter: new MongoHighlighter(),
} as Parameters<typeof MikroORM.init>[0];

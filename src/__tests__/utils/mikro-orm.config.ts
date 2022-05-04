import { MikroORM } from "@mikro-orm/core";
import { MongoHighlighter } from "@mikro-orm/mongo-highlighter";
import { Collection } from "../../entities/Collection";
import { NotesList } from "../../entities/NotesList";
import { User } from "../../entities/User";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

export default {
  metadataProvider: TsMorphMetadataProvider,
  entities: [User, Collection, NotesList],
  dbName: "testing-db",
  type: "mongo",
  clientUrl: `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`,
  highlighter: new MongoHighlighter(),
} as Parameters<typeof MikroORM.init>[0];

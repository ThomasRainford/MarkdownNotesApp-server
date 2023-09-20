import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from "express";
import { ObjectId } from "@mikro-orm/mongodb";

export type OrmContext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: { userId: ObjectId | undefined } };
  res: Response;
};

// A dev helper type for viewing typescript types.
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

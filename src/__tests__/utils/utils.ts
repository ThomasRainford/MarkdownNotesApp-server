import { MongoClient } from "mongodb";

export const dropDb = async () => {
  const url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`;
  try {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      const _db = db.db("testing-db");
      _db.dropDatabase(async function (err, _) {
        if (err) throw err;
        console.log("Drop successful");
        await db.close(true);
      });
    });
  } catch (error: any) {
    console.log(error);
  }
};

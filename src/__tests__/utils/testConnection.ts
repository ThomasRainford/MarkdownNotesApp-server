import { MongoClient } from "mongodb";

export const dropDb = async () => {
  MongoClient.connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`,
    (error, db) => {
      if (error) throw error;
      const _db = db.db("testing-db");
      //console.log("Connected to " + _db);
      _db.dropDatabase((error, _) => {
        if (error) throw error;
        //console.log("Drop successful!");
        db.close();
      });
    }
  );

  // try {
  //   const client = await MongoClient.connect(
  //     `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST_TEST}`
  //   );
  //   const connect = client.db("testing-db");
  //   connect.dropDatabase();

  //   console.log("Drop Successful!");
  // } catch (error: any) {
  //   console.log("Error! ", error);
  // }
};

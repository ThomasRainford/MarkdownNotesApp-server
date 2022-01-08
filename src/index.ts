import "dotenv/config";
import "reflect-metadata";
import mikroOrmConfig from "./mikro-orm.config";

import Application from "./application";
(async () => {
  const application = new Application();
  await application.connect(mikroOrmConfig);
  await application.init();
})();

import "reflect-metadata";
import mikroOrmConfig from "./mikro-orm.config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("custom-env").env("development");

import Application from "./application";
(async () => {
  console.log(process.env.NODE_ENV);
  const application = new Application();
  await application.connect(mikroOrmConfig);
  await application.init();
})();

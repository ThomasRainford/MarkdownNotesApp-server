import "dotenv-safe/config";
import { testConnection } from "./testConnection";

testConnection().then(() => process.exit());

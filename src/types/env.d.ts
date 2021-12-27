declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_USERNAME: string;
    MONGO_PASSWORD: string;
    MONGO_HOST: string;
    MONGO_HOST_TEST: string;
    CORS_ORIGIN: string;
    CORS_ORIGIN_DEV: string;
    SESSION_SECRET: string;
    JWT_SECRET: string;
    CLIENT_DOMAIN: string;
  }
}
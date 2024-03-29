declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_USERNAME: string;
      MONGO_PASSWORD: string;
      MONGO_HOST: string;
      CORS_ORIGIN: string;
      SESSION_SECRET: string;
      JWT_SECRET: string;
      CLIENT_DOMAIN: string;
    }
  }
}

export {}

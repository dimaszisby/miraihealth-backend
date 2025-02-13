// TODO: Load Redis based on env variables
interface Config {
  development: {
    url?: string;
    database: string;
    host: string;
    port: number;
    dialect: string;
    logging: boolean | ((...args: any[]) => void);
    dialectOptions: { options: string; ssl: boolean };
    redis: { host: string; port: number; password?: string };
  };
  test: {
    url?: string;
    database: string;
    host: string;
    port: number;
    dialect: string;
    logging: boolean;
    redis: { host: string; port: number; password?: string };
  };
  production: {
    url?: string;
    dialect: string;
    redis: { host: string; port: number; password?: string };
  };
}

const config: Config = {
  development: {
    url: process.env.DEVELOPMENT_DATABASE_URL,
    database: "miraihealth",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: console.log,
    dialectOptions: {
      options: "-c search_path=public",
      ssl: false,
    },
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
  test: {
    url: process.env.TEST_DATABASE_URL,
    database: "miraihealth_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
  production: {
    url: process.env.PRODUCTION_DATABASE_URL,
    dialect: "postgres",
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
};

export default config;

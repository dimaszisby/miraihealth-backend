import fs from "fs";
import path from "path";
import { Sequelize, DataTypes, Model, Options } from "sequelize";
import process from "process";
import { fileURLToPath } from "url";
import configData from "../config/config.js";

/**
 * * Sequelize Model Loader
 * Dynamically loads and initializes all models in the `models` directory.
 */

// 1. Get the current filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

// Ensure `env` is one of the known environments
type ConfigKey = keyof typeof configData;
const selectedConfig = configData[env as ConfigKey];

interface CustomSequelizeOptions extends Options {
  use_env_variable?: string;
}

const config = selectedConfig as CustomSequelizeOptions;

// Updated DB interface with explicit allowance for `typeof Sequelize`
interface DB {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  [key: string]: typeof Model | Sequelize | typeof Sequelize | undefined;
}

// 2. Initialize Sequelize
const db: DB = {} as DB;
const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable] as string, config)
  : new Sequelize(
      config.database as string,
      config.username as string,
      config.password as string,
      config
    );

// 3. Dynamically Load All Model Files
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.endsWith(".js") && // Only load compiled JavaScript files
      !file.endsWith(".test.js") // Ignore test files
    );
  })
  .forEach(async (file) => {
    const modelImport = await import(path.join(__dirname, file));
    const model = modelImport.default(sequelize, DataTypes);

    console.log(`Loaded model: ${model.name}`);
    db[model.name] = model;
  });

// 4. Setup Model Associations
Object.keys(db).forEach((modelName) => {
  const model = db[modelName];
  if (model && "associate" in model) {
    (model as any).associate(db);
  }
});

console.log("Registered Models:", Object.keys(db));

// 5. Export the Sequelize Instance and Models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

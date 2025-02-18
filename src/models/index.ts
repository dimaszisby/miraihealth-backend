// src/models/index.ts

import fs from "fs";
import path from "path";
import { Sequelize, DataTypes, Options } from "sequelize";
import process from "process";
import { fileURLToPath } from "url";
import configData from "../config/config.cjs";

/**
 * Prepare the Sequelize instance and models.
 */

// Get the current filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

// Ensure env is one of the known environments
type ConfigKey = keyof typeof configData;
const selectedConfig = configData[env as ConfigKey];

// Define a custom Sequelize options interface
interface CustomSequelizeOptions extends Options {
  use_env_variable?: string;
}
// Cast the selected config to our custom interface
const config = selectedConfig as CustomSequelizeOptions;

// Define the DB models
import type { User } from "./user.js";
import type { Metric } from "./metric.js";
import type { MetricSettings } from "./metric-settings.js";
import type { MetricLog } from "./metric-log.js";
import type { MetricCategory } from "./metric-category.js";

// Define the DB models interface
export interface DBModels {
  User: typeof User;
  Metric: typeof Metric;
  MetricSettings: typeof MetricSettings;
  MetricLog: typeof MetricLog;
  MetricCategory: typeof MetricCategory;
}

// Extend the interface to include Sequelize instance info.
export interface DB extends DBModels {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

/**
 * Dynamically load all models and associate them.
 */
const db = {} as DB;
const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable] as string, config)
  : new Sequelize(
      config.database as string,
      config.username as string,
      config.password as string,
      config
    );

/**
 * Load all models in the current directory.
 */
const fileExtensions = env === "production" ? [".js"] : [".js", ".ts"];
const files = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    fileExtensions.some((ext) => file.endsWith(ext)) &&
    !file.endsWith(".test.js") &&
    !file.endsWith(".test.ts")
  );
});

console.log("Found model files:", files);

// Load each model file dynamically
const modelImports = await Promise.all(
  files.map((file) => import(path.join(__dirname, file)))
);

// Initialize each model and associate them
modelImports.forEach((modelImport) => {
  // Each model file exports a function that initializes the model.
  const model = modelImport.default(sequelize, DataTypes);
  // Assume the model's name (set via Model.init) matches our DBModels keys.
  db[model.name as keyof DBModels] = model;
  console.log(`Loaded model: ${model.name}`);
});

// Associate each model if it has an associate method
Object.keys(db).forEach((modelName) => {
  // Skip non‑model properties
  if (modelName === "sequelize" || modelName === "Sequelize") return;
  const model = db[modelName as keyof DBModels];
  if (model && "associate" in model) {
    (model as any).associate(db);
    console.log(`Associated model: ${modelName}`);
  }
});

// Log the registered models for verification
console.log("Registered Models:", Object.keys(db));

// Export the DB instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

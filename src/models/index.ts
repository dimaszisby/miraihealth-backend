import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import { fileURLToPath } from "url";
import { env } from "../config/zodEnv.js";
import logger from "../utils/logger.js";

/**
 * Instead of "initializeDB()",
 * we directly set up & export the Sequelize instance and models.
 * We'll do it in a more dynamic, future-proof way:
 *  1) Dynamically pick the DB URL from environment
 *  2) Dynamically load model files
 *  3) Call .associate(...) automatically
 */

/**
 * 1. Dynamically pick the DB URL based on environment variables
 *    so you don't need to hardcode e.g. env.TEST_DATABASE_URL!
 */
function getDatabaseUrl(): string {
  switch (env.NODE_ENV) {
    case "production":
      if (!env.PRODUCTION_DATABASE_URL) {
        throw new Error("❌ Missing PRODUCTION_DATABASE_URL in environment");
      }
      return env.PRODUCTION_DATABASE_URL;
    case "staging":
      if (!env.STAGING_DATABASE_URL) {
        throw new Error("❌ Missing STAGING_DATABASE_URL in environment");
      }
      return env.STAGING_DATABASE_URL;
    case "test":
      if (!env.TEST_DATABASE_URL) {
        throw new Error("❌ Missing TEST_DATABASE_URL in environment");
      }
      return env.TEST_DATABASE_URL;
    default: // "development"
      if (!env.DEVELOPMENT_DATABASE_URL) {
        throw new Error("❌ Missing DEVELOPMENT_DATABASE_URL in environment");
      }
      return env.DEVELOPMENT_DATABASE_URL;
  }
}

// ✅ Create the Sequelize instance using whichever config you want:
const databaseUrl = getDatabaseUrl();
const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: env.DB_LOGGING === "true" ? console.log : false,
});

// 2. Dynamically load each model file from the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

// We'll store references to all imported models in this object
const db: Record<string, any> = {};

/**
 * Read .ts/.js model files from this folder.
 * This approach is basically what Sequelize "classic" used to do
 * in the default template, but we can replicate it in TypeScript.
 */
const modelFiles = fs.readdirSync(__dirname).filter((file) => {
  // Skip non-model files, index itself, and test files:
  if (file.indexOf(".") === 0) return false;
  if (file === basename) return false; // skip index.ts
  if (file.endsWith(".test.ts") || file.endsWith(".test.js")) return false;
  // Accept .ts or .js or .mjs:
  return file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".mjs");
});

// Import each model definition and initialize it:
const modelPromises = modelFiles.map(async (file) => {
  // Because we’re in ES modules, we can do a synchronous `require` or an import:
  // For brevity, using require() here is typical in older Sequelize setups:
  const modelImport = await import(path.join(__dirname, file));
  // If the model file uses `export default (sequelize) => { ... }`:
  const initModelFunc = modelImport.default;
  if (typeof initModelFunc !== "function") return;

  // Initialize the model
  const model = initModelFunc(sequelize, DataTypes);
  db[model.name] = model;
  logger.info(`✅ Loaded model: ${model.name}`);
});

await Promise.all(modelPromises);

/**
 * 3. Call .associate(...) on each model that has it.
 *    This way, any "belongsTo"/"hasMany" relationships are created automatically.
 */
Object.keys(db).forEach((modelName) => {
  if (modelName.toLowerCase() === "sequelize") return;
  if (db[modelName] && typeof db[modelName].associate === "function") {
    db[modelName].associate(db);
    logger.info(`🔗 Associated model: ${modelName}`);
  }
});

/**
 * Finally, export everything. We'll attach `sequelize` plus the models as named exports.
 */
db.sequelize = sequelize;

export default db;

// or export them individually as needed:

// export const {
//   sequelize: sequelizeInstance,
//   User,
//   Metric,
//   MetricCategory,
//   MetricSettings,
//   MetricLog
// } = db;

/**
 * If you prefer named exports for each Model, you can do:

export { 
  sequelizeInstance as sequelize,
  db.User as User,
  db.Metric as Metric,
  db.MetricCategory as MetricCategory,
  db.MetricSettings as MetricSettings,
  db.MetricLog as MetricLog
};

 * 
 * That’s it! 
 * Now the code is more dynamic for future expansions.
 */

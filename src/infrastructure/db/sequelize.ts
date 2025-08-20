import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import { fileURLToPath, pathToFileURL } from "url";
import { env } from "../../config/zodEnv.js";
import logger from "../../utils/logger.js";

// Helper function to recursively get all files in a directory
function getFilesRecursively(directory: string, fileList: string[] = []) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Dynamically pick the DB URL based on environment variables
 */
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
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
const modelFiles = getFilesRecursively(__dirname).filter((file) => {
  // Skip non-model files, index itself, and test files:
  if (file.indexOf(".") === 0) return false;
  if (file.endsWith(basename)) return false; // skip index.ts
  if (file.endsWith(".test.ts") || file.endsWith(".test.js")) return false;
  // Accept .ts or .js or .mjs and ensure it's a model file
  return (
    (file.endsWith(".model.ts") || file.endsWith(".sequelize.ts")) &&
    (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".mjs"))
  );
});

// Import each model definition and initialize it:
const modelPromises = modelFiles.map(async (file) => {
  // Because we’re in ES modules, we can do a synchronous `require` or an import:
  // For brevity, using require() here is typical in older Sequelize setups:
  const modelImport = await import(pathToFileURL(file).toString());
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
 * Call .associate(...) on each model that has it.
 * Any "belongsTo"/"hasMany" relationships are created automatically.
 */
Object.keys(db).forEach((modelName) => {
  if (modelName.toLowerCase() === "sequelize") return;
  if (db[modelName] && typeof db[modelName].associate === "function") {
    db[modelName].associate(db);
    logger.info(`🔗 Associated model: ${modelName}`);
  }
});

/**
 * Export everything.
 * Attach `sequelize` plus the models as named exports.
 */
db.sequelize = sequelize;

export default db;

// jest.setup.js
const sequelize = require("./config/db");
const { exec } = require("child_process");

// Optional: Extend Jest timeout if needed
jest.setTimeout(30000); // 30 seconds

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    // Optionally, run migrations if not already run via npm script
    // Comment out if using npm run migrate:test
    /*
    console.log('Running migrations...');
    await new Promise((resolve, reject) => {
      exec('NODE_ENV=test npx sequelize-cli db:migrate', (error, stdout, stderr) => {
        if (error) {
          console.error(`Migration error: ${stderr}`);
          return reject(error);
        }
        console.log(stdout);
        resolve();
      });
    });
    console.log('Migrations completed successfully.');
    */
  } catch (error) {
    console.error("Error during test setup:", error);
    throw error; // Prevent tests from running if setup fails
  }
});

beforeEach(async () => {
  try {
    console.log("Starting raw SQL table truncation...");

    // Fetch all table names in the public schema
    const tables = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`,
      { type: sequelize.QueryTypes.SELECT }
    );

    for (const table of tables) {
      const tableName = table.tablename;

      // Skip Sequelize's metadata tables if any
      if (
        tableName === "SequelizeMeta" ||
        tableName === "SequelizeData" ||
        tableName === "users"
        // to enable auth feature setup (beforeAll) on other test
      )
        continue;

      try {
        console.log(`Truncating table: ${tableName}`);
        await sequelize.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`
        );
        console.log(`Successfully truncated table: ${tableName}`);
      } catch (error) {
        console.error(`Error truncating table ${tableName}:`, error);
        throw error; // Fail the test setup if truncation fails
      }
    }

    console.log("Completed raw SQL table truncation.");
  } catch (error) {
    console.error("Error during table truncation:", error);
    throw error;
  }
});

/*
IF want to use transcation

afterEach(async () => {
  await transaction.rollback();
});

beforeEach(async () => {
  transaction = await sequelize.transaction();
});

*/

afterAll(async () => {
  try {
    await sequelize.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing the database connection:", error);
  }
});

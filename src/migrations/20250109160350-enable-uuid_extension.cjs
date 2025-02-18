"use strict";

/**
 * * Migration: Enable UUID Extension
 * Ensures the "uuid-ossp" extension is available for UUID generation.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.sequelize.query(
          'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
          { transaction }
        );
        console.log("✅ UUID-OSSP extension enabled.");
      } catch (error) {
        console.error("❌ Error enabling UUID-OSSP extension:", error);
        throw error; // Ensure rollback if an error occurs
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.sequelize.query(
          'DROP EXTENSION IF EXISTS "uuid-ossp";',
          { transaction }
        );
        console.log("✅ UUID-OSSP extension disabled.");
      } catch (error) {
        console.error("❌ Error disabling UUID-OSSP extension:", error);
        throw error; // Ensure rollback if an error occurs
      }
    });
  },
};

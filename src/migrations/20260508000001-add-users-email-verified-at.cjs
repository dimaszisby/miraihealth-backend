"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        console.log(
          "[DB PROCESS] Adding email_verified_at column to users table...",
        );
        await queryInterface.addColumn(
          { schema: "public", tableName: "users" },
          "email_verified_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
          },
          { transaction },
        );
        console.log("[DB PROCESS] email_verified_at column added to users.");
      } catch (error) {
        console.error(
          "[DB ERROR] adding email_verified_at to users:",
          error,
        );
        throw error;
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        console.log(
          "[DB PROCESS] Removing email_verified_at column from users table...",
        );
        await queryInterface.removeColumn(
          { schema: "public", tableName: "users" },
          "email_verified_at",
          { transaction },
        );
        console.log("[DB PROCESS] email_verified_at column removed from users.");
      } catch (error) {
        console.error(
          "[DB ERROR] removing email_verified_at from users:",
          error,
        );
        throw error;
      }
    });
  },
};

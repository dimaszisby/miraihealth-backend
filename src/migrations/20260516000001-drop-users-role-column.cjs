"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Dropping role column from users table...");
      await queryInterface.removeColumn("users", "role", { transaction });
      console.log("[DB PROCESS] Dropped users.role column.");
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Re-adding role column to users table...");
      await queryInterface.addColumn(
        "users",
        "role",
        {
          type: Sequelize.ENUM("user", "admin"),
          allowNull: false,
          defaultValue: "user",
        },
        { transaction },
      );
      console.log("[DB PROCESS] Re-added users.role column.");
    });
  },
};

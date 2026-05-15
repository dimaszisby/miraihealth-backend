"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable("memberships");
      if (columns.status) {
        console.log(
          "[DB PROCESS] memberships.status already exists — skipping.",
        );
        return;
      }

      console.log("[DB PROCESS] Adding status column to memberships...");

      await queryInterface.addColumn(
        "memberships",
        "status",
        {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: "active",
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        "ALTER TABLE \"memberships\" ADD CONSTRAINT \"chk_memberships_status\" CHECK (\"status\" IN ('active', 'invited', 'removed'))",
        { transaction },
      );

      console.log("[DB PROCESS] memberships.status column added.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Removing status column from memberships...");
      await queryInterface.sequelize.query(
        "ALTER TABLE \"memberships\" DROP CONSTRAINT IF EXISTS \"chk_memberships_status\"",
        { transaction },
      );
      await queryInterface.removeColumn("memberships", "status", {
        transaction,
      });
      console.log("[DB PROCESS] memberships.status column removed.");
    });
  },
};

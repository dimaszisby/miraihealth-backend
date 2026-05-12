"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Adding nullable organization_id to refresh_tokens...");

      await queryInterface.addColumn(
        "refresh_tokens",
        "organization_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: "organizations", key: "id" },
          onDelete: "SET NULL",
        },
        { transaction },
      );

      console.log("[DB PROCESS] Done.");
    });
  },
  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Removing organization_id from refresh_tokens...");
      await queryInterface.removeColumn("refresh_tokens", "organization_id", {
        transaction,
      });
    });
  },
};

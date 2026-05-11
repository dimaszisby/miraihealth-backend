"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const domainTables = [
        "metrics",
        "metric_categories",
        "metric_settings",
        "metric_logs",
      ];

      console.log("[DB PROCESS] Setting organization_id NOT NULL on domain tables...");

      for (const table of domainTables) {
        await queryInterface.changeColumn(
          table,
          "organization_id",
          {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "organizations", key: "id" },
            onDelete: "RESTRICT",
          },
          { transaction },
        );
      }

      console.log("[DB PROCESS] Adding indexes on organization_id...");

      for (const table of domainTables) {
        await queryInterface.addIndex(table, ["organization_id"], {
          name: `idx_${table}_organization_id`,
          transaction,
        });
      }

      // processed_messages stays nullable (ON DELETE SET NULL per ADR-001)
      await queryInterface.addIndex("processed_messages", ["organization_id"], {
        name: "idx_processed_messages_organization_id",
        transaction,
      });

      console.log("[DB PROCESS] organization_id constraints and indexes applied.");
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const domainTables = [
        "metrics",
        "metric_categories",
        "metric_settings",
        "metric_logs",
      ];

      console.log("[DB PROCESS] Reverting organization_id to nullable...");

      for (const table of domainTables) {
        await queryInterface.removeIndex(
          table,
          `idx_${table}_organization_id`,
          { transaction },
        );
      }

      await queryInterface.removeIndex(
        "processed_messages",
        "idx_processed_messages_organization_id",
        { transaction },
      );

      for (const table of domainTables) {
        await queryInterface.changeColumn(
          table,
          "organization_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "organizations", key: "id" },
            onDelete: "RESTRICT",
          },
          { transaction },
        );
      }

      console.log("[DB PROCESS] organization_id reverted to nullable.");
    });
  },
};

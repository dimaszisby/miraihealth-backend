"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Ensure schema exists before creating the table
        await queryInterface.sequelize.query(
          `CREATE SCHEMA IF NOT EXISTS "public";`,
          { transaction }
        );

        // Create metric_logs table
        await queryInterface.createTable(
          { schema: "public", tableName: "metric_logs" },
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("uuid_generate_v4()"),
              primaryKey: true,
              allowNull: false,
            },
            metric_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: { schema: "public", tableName: "metrics" },
                key: "id",
              },
              onDelete: "CASCADE",
            },
            log_value: {
              type: Sequelize.FLOAT,
              allowNull: false,
            },
            type: {
              type: Sequelize.ENUM("manual", "automatic"),
              allowNull: false,
              defaultValue: "manual",
            },
            logged_at: {
              type: "TIMESTAMP WITH TIME ZONE",
              allowNull: false,
              defaultValue: Sequelize.literal("NOW()"),
            },
            created_at: {
              type: "TIMESTAMP WITH TIME ZONE",
              allowNull: false,
              defaultValue: Sequelize.literal("NOW()"),
            },
            updated_at: {
              type: "TIMESTAMP WITH TIME ZONE",
              allowNull: false,
              defaultValue: Sequelize.literal("NOW()"),
            },
          },
          { transaction }
        );

        // Newly added unique constraint to prevent duplicate logs for the same metric at the same time
        await queryInterface.addConstraint(
          { schema: "public", tableName: "metric_logs" },
          {
            fields: ["metric_id", "logged_at"],
            type: "unique",
            name: "uq_metric_logs_metric_id_logged_at",
            transaction,
          }
        );

        // Newly added index for performance optimization
        await queryInterface.addIndex(
          { schema: "public", tableName: "metric_logs" },
          ["metric_id", "logged_at"],
          { name: "ix_metric_logs_metric_id_logged_at", transaction }
        );

        console.log("[DB PROCESS] Metric Logs table created successfully.");
      } catch (error) {
        console.error("[DB ERROR] creating Metric Logs table:", error);
        throw error;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable(
          { schema: "public", tableName: "metric_logs" },
          { transaction }
        );

        console.log("[DB PROCESS] Metric Logs table dropped successfully.");
      } catch (error) {
        console.error("[DB ERROR] dropping Metric Logs table:", error);
        throw error;
      }
    });
  },
};

//src/migrations/20250109160356-create-metric_logs.cjs
"use strict";

/**
 * * Migration: Create Metric Logs Table
 * Defines the structure of the "metric_logs" table.
 */
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
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: "manual",
            },
            logged_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal("NOW()"),
            },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal("NOW()"),
            },
            updated_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal("NOW()"),
            },
          },
          { transaction }
        );

        console.log("✅ Metric Logs table created successfully.");
      } catch (error) {
        console.error("❌ Error creating Metric Logs table:", error);
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

        console.log("✅ Metric Logs table dropped successfully.");
      } catch (error) {
        console.error("❌ Error dropping Metric Logs table:", error);
        throw error;
      }
    });
  },
};

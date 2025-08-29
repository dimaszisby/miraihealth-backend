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

        await queryInterface.createTable(
          { schema: "public", tableName: "metrics" },
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("uuid_generate_v4()"),
              primaryKey: true,
              allowNull: false,
            },
            user_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: { schema: "public", tableName: "users" },
                key: "id",
              },
              onDelete: "CASCADE",
            },
            category_id: {
              type: Sequelize.UUID,
              allowNull: true,
              references: {
                model: { schema: "public", tableName: "metric_categories" },
                key: "id",
              },
              onDelete: "SET NULL",
            },
            original_metric_id: {
              type: Sequelize.UUID,
              allowNull: true,
              references: {
                model: { schema: "public", tableName: "metrics" },
                key: "id",
              },
              onDelete: "SET NULL",
            },
            name: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            description: {
              type: Sequelize.STRING,
              allowNull: true,
            },
            default_unit: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            is_public: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
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
            deleted_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },
          },
          { transaction }
        );

        console.log("[DB PROCESS] Metrics table created successfully.");
      } catch (error) {
        console.error("[DB ERROR] creating Metrics table:", error);
        throw error;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable(
          { schema: "public", tableName: "metrics" },
          { transaction }
        );

        console.log("[DB PROCESS] Metrics table dropped successfully.");
      } catch (error) {
        console.error("[DB ERROR] dropping Metrics table:", error);
        throw error;
      }
    });
  },
};

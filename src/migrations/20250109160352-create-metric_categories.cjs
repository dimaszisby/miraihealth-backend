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
          { schema: "public", tableName: "metric_categories" },
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
            name: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            color: {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: "#E897A3",
            },
            icon: {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: "📁",
            },
            created_at: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.literal("NOW()"),
            },
            updated_at: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.literal("NOW()"),
            },
            deleted_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },
          },
          { transaction }
        );

        console.log(
          "[DB PROCESS] Metric Categories table created successfully."
        );
      } catch (error) {
        console.error("[DB ERROR] creating Metric Categories table:", error);
        throw error;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable(
          { schema: "public", tableName: "metric_categories" },
          { transaction }
        );

        console.log(
          "[DB PROCESS] Metric Categories table dropped successfully."
        );
      } catch (error) {
        console.error("[DB ERROR] dropping Metric Categories table:", error);
        throw error;
      }
    });
  },
};

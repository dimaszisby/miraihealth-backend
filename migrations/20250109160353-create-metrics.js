"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "metrics",
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
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
          },
          category_id: {
            type: Sequelize.UUID,
            references: { model: "metric_categories", key: "id" },
            onDelete: "SET NULL",
          },
          original_metric_id: {
            type: Sequelize.UUID,
            references: { model: "metrics", key: "id" },
            onDelete: "SET NULL",
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          unit: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          version: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
          },
          is_public: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
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
          },
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("metrics", { transaction });
    });
  },
};

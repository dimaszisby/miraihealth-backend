"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "metric_settings",
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
            references: { model: "metrics", key: "id" },
            onDelete: "CASCADE",
          },
          is_tracked: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          goal_value: {
            type: Sequelize.FLOAT,
            allowNull: true,
          },
          version_date: {
            type: Sequelize.DATE,
            allowNull: true,
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
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("metric_settings", { transaction });
    });
  },
};

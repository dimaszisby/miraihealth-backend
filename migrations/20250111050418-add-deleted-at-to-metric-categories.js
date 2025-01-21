"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "metric_categories",
        "deleted_at",
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("metric_categories", "deleted_at");
    });
  },
};

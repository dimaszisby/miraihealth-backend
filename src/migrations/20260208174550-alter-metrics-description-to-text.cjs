"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        { schema: "public", tableName: "metrics" },
        "description",
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction }
      );

      console.log(
        "[DB PROCESS] metrics.description altered to TEXT successfully."
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        { schema: "public", tableName: "metrics" },
        "description",
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      console.log(
        "[DB PROCESS] metrics.description reverted to STRING successfully."
      );
    });
  },
};

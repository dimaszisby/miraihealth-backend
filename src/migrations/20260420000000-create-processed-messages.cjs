"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Creating processed_messages table...");

      await queryInterface.createTable(
        "processed_messages",
        {
          message_id: {
            type: Sequelize.STRING(36),
            primaryKey: true,
            allowNull: false,
          },
          queue: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          processed_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("NOW()"),
          },
        },
        { transaction },
      );

      console.log(
        "[DB PROCESS] processed_messages table created successfully.",
      );
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("processed_messages", { transaction });
      console.log("[DB PROCESS] processed_messages table dropped.");
    });
  },
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Creating organizations table...");

      await queryInterface.createTable(
        "organizations",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          slug: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      console.log("[DB PROCESS] Adding index on organizations.slug...");
      await queryInterface.addIndex("organizations", ["slug"], {
        name: "idx_organizations_slug",
        transaction,
      });

      console.log("[DB PROCESS] organizations table created successfully.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Dropping organizations table...");
      await queryInterface.dropTable("organizations", { transaction });
      console.log("[DB PROCESS] organizations table dropped.");
    });
  },
};

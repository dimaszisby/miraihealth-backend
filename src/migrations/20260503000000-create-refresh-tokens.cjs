"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Creating refresh_tokens table...");
      await queryInterface.createTable(
        "refresh_tokens",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
          },
          family_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          token_hash: {
            type: Sequelize.STRING(64),
            allowNull: false,
            unique: true,
          },
          issued_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          revoked_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          replaced_by_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "refresh_tokens", key: "id" },
            onDelete: "SET NULL",
          },
          user_agent: {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
          ip: {
            type: Sequelize.STRING(45),
            allowNull: true,
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
        },
        { transaction },
      );

      console.log("[DB PROCESS] Adding index on (user_id, revoked_at)...");
      await queryInterface.addIndex(
        "refresh_tokens",
        ["user_id", "revoked_at"],
        { name: "idx_refresh_tokens_user_revoked", transaction },
      );

      console.log("[DB PROCESS] Adding index on family_id...");
      await queryInterface.addIndex("refresh_tokens", ["family_id"], {
        name: "idx_refresh_tokens_family",
        transaction,
      });

      console.log("[DB PROCESS] refresh_tokens table created successfully.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Dropping refresh_tokens table...");
      await queryInterface.dropTable("refresh_tokens", { transaction });
      console.log("[DB PROCESS] refresh_tokens table dropped.");
    });
  },
};

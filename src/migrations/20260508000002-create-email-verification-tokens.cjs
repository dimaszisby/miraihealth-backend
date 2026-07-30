"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        console.log(
          "[DB PROCESS] Creating email_verification_tokens table...",
        );

        await queryInterface.createTable(
          { schema: "public", tableName: "email_verification_tokens" },
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
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            token_hash: {
              type: Sequelize.CHAR(64),
              allowNull: false,
              unique: true,
            },
            expires_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },
            used_at: {
              type: Sequelize.DATE,
              allowNull: true,
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
          { transaction },
        );

        await queryInterface.addIndex(
          { schema: "public", tableName: "email_verification_tokens" },
          ["user_id", "used_at"],
          {
            name: "email_verification_tokens_user_id_used_at_idx",
            transaction,
          },
        );

        console.log(
          "[DB PROCESS] email_verification_tokens table created successfully.",
        );
      } catch (error) {
        console.error(
          "[DB ERROR] creating email_verification_tokens table:",
          error,
        );
        throw error;
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable(
          { schema: "public", tableName: "email_verification_tokens" },
          { transaction },
        );
        console.log(
          "[DB PROCESS] email_verification_tokens table dropped.",
        );
      } catch (error) {
        console.error(
          "[DB ERROR] dropping email_verification_tokens table:",
          error,
        );
        throw error;
      }
    });
  },
};

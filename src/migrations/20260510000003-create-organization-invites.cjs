"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Creating organization_invites table...");

      await queryInterface.createTable(
        "organization_invites",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
          },
          organization_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "organizations", key: "id" },
            onDelete: "CASCADE",
          },
          email: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          role: {
            type: Sequelize.STRING(20),
            allowNull: false,
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
          accepted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
        },
        { transaction },
      );

      console.log("[DB PROCESS] Adding CHECK constraint on organization_invites.role...");
      await queryInterface.sequelize.query(
        `ALTER TABLE "organization_invites" ADD CONSTRAINT "chk_organization_invites_role" CHECK ("role" IN ('admin', 'member'))`,
        { transaction },
      );

      console.log("[DB PROCESS] Adding index on organization_invites.organization_id...");
      await queryInterface.addIndex("organization_invites", ["organization_id"], {
        name: "idx_organization_invites_org_id",
        transaction,
      });

      console.log("[DB PROCESS] organization_invites table created successfully.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Dropping organization_invites table...");
      await queryInterface.dropTable("organization_invites", { transaction });
      console.log("[DB PROCESS] organization_invites table dropped.");
    });
  },
};

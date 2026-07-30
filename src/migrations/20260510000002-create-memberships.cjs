"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Creating memberships table...");

      await queryInterface.createTable(
        "memberships",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
          },
          organization_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "organizations", key: "id" },
            onDelete: "CASCADE",
          },
          role: {
            type: Sequelize.STRING(20),
            allowNull: false,
          },
          status: {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: "active",
          },
          joined_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
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

      console.log(
        "[DB PROCESS] Adding CHECK constraint on memberships.role...",
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE \"memberships\" ADD CONSTRAINT \"chk_memberships_role\" CHECK (\"role\" IN ('owner', 'admin', 'member'))",
        { transaction },
      );

      console.log(
        "[DB PROCESS] Adding CHECK constraint on memberships.status...",
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE \"memberships\" ADD CONSTRAINT \"chk_memberships_status\" CHECK (\"status\" IN ('active', 'invited', 'removed'))",
        { transaction },
      );

      console.log(
        "[DB PROCESS] Adding UNIQUE constraint on (user_id, organization_id)...",
      );
      await queryInterface.addConstraint("memberships", {
        fields: ["user_id", "organization_id"],
        type: "unique",
        name: "uq_memberships_user_organization",
        transaction,
      });

      console.log(
        "[DB PROCESS] Adding index on memberships.organization_id...",
      );
      await queryInterface.addIndex("memberships", ["organization_id"], {
        name: "idx_memberships_organization_id",
        transaction,
      });

      console.log("[DB PROCESS] memberships table created successfully.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Dropping memberships table...");
      await queryInterface.dropTable("memberships", { transaction });
      console.log("[DB PROCESS] memberships table dropped.");
    });
  },
};

"use strict";

/**
 * * Migration: Create Users Table
 * Defines the structure of the "users" table.
 */
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Ensure schema exists before creating the table
        await queryInterface.sequelize.query(
          `CREATE SCHEMA IF NOT EXISTS "public";`,
          { transaction }
        );

        await queryInterface.createTable(
          { schema: "public", tableName: "users" },
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("uuid_generate_v4()"),
              primaryKey: true,
              allowNull: false,
            },
            username: {
              type: Sequelize.STRING,
              allowNull: false,
              unique: true,
            },
            email: {
              type: Sequelize.STRING,
              allowNull: false,
              unique: true,
            },
            password: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            age: {
              type: Sequelize.INTEGER,
              allowNull: true,
            },
            sex: {
              type: Sequelize.ENUM(
                "male",
                "female",
                "other",
                "prefer not to specify"
              ),
              allowNull: false,
              defaultValue: "prefer not to specify",
            },
            is_public_profile: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
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
            deleted_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },
          },
          { transaction }
        );

        console.log("✅ Users table created successfully.");
      } catch (error) {
        console.error("❌ Error creating Users table:", error);
        throw error; // Ensure rollback if an error occurs
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable(
          { schema: "public", tableName: "users" },
          { transaction }
        );
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_users_sex";',
          { transaction }
        );

        console.log("✅ Users table dropped successfully.");
      } catch (error) {
        console.error("❌ Error dropping Users table:", error);
        throw error; // Ensure rollback if an error occurs
      }
    });
  },
};

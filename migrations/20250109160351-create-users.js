"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'users',
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
          },
          sex: {
            type: Sequelize.ENUM(
              "male",
              "female",
              "other",
              "prefer not specify"
            ),
            allowNull: false,
          },
          is_public_profile: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("NOW()"),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("NOW()"),
          },
          deleted_at: {
            type: Sequelize.DATE,
          },
        },
        { transaction, schema: 'public'}
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("users", { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_users_sex";',
        { transaction }
      );
    });
  },
};

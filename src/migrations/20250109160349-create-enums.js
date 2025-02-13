"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use a transaction to ensure atomicity
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Create ENUM for "users.sex"
      await queryInterface.sequelize.query(
        `
        DO $$
        BEGIN
          CREATE TYPE "public"."enum_users_sex" AS ENUM ('male', 'female', 'other', 'prefer not to specify');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
        $$;
        `,
        { transaction }
      );

      // Create ENUM for "metric_settings.goal_type"
      await queryInterface.sequelize.query(
        `
        DO $$
        BEGIN
          CREATE TYPE "public"."enum_metric_settings_goal_type" AS ENUM ('cumulative', 'incremental');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
        $$;
        `,
        { transaction }
      );

      // Add additional ENUM definitions here if needed
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Use a transaction to ensure atomicity
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Drop ENUM for "users.sex"
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "public"."enum_users_sex";',
        { transaction }
      );

      // Drop ENUM for "metric_settings.goal_type"
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "public"."enum_metric_settings_goal_type";',
        { transaction }
      );

      // Add additional ENUM cleanup here if needed
    });
  },
};

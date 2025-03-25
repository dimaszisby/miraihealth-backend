"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create ENUM for users.role
      await queryInterface.sequelize.query(
        `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
            CREATE TYPE enum_users_role AS ENUM (
              'user', 'admin'
            );
          END IF;
        END
        $$;
      `,
        { transaction }
      );

      // Create ENUM for metric_settings.goal_type
      await queryInterface.sequelize.query(
        `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_metric_settings_goal_type') THEN
            CREATE TYPE enum_metric_settings_goal_type AS ENUM (
              'cumulative', 'incremental'
            );
          END IF;
        END
        $$;
      `,
        { transaction }
      );

      // Create ENUM for metric_log.type
      await queryInterface.sequelize.query(
        `
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_metric_log_type') THEN
              CREATE TYPE enum_metric_log_type AS ENUM (
                'manual', 'automatic'
              );
            END IF;
          END
          $$;
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      // Type guard to check if error is an object with message property
      if (
        error instanceof Error &&
        !error.message.includes('type "enum_users_role" already exists') &&
        !error.message.includes(
          'type "enum_metric_settings_goal_type" already exists'
        ) &&
        !error.message.includes('type "enum_metric_log_type" already exists')
      ) {
        throw error;
      }
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        DROP TYPE IF EXISTS enum_users_sex CASCADE;
        DROP TYPE IF EXISTS enum_users_role CASCADE;
        DROP TYPE IF EXISTS enum_metric_settings_goal_type CASCADE;
        DROP TYPE IF EXISTS enum_metric_log_type CASCADE;
      `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred during migration rollback");
    }
  },
};

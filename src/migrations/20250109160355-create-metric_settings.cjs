// src/migrations/20250109160355-create-metric_settings.cjs

"use strict";

/**
 * * Migration: Create Metric Settings Table
 * Defines the structure of the "metric_settings" table.
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

        // Create ENUM type for goal_type if not exists
        await queryInterface.sequelize.query(
          `
          DO $$ 
          BEGIN 
            CREATE TYPE "public"."enum_metric_settings_goal_type" AS ENUM ('cumulative', 'incremental');
          EXCEPTION 
            WHEN duplicate_object THEN NULL;
          END $$;
          `,
          { transaction }
        );

        // Create metric_settings table
        await queryInterface.createTable(
          { schema: "public", tableName: "metric_settings" },
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("uuid_generate_v4()"),
              primaryKey: true,
              allowNull: false,
            },
            metric_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: { schema: "public", tableName: "metrics" },
                key: "id",
              },
              onDelete: "CASCADE",
            },
            goal_enabled: {
              type: Sequelize.BOOLEAN,
              defaultValue: false,
              allowNull: false,
            },
            goal_type: {
              type: Sequelize.ENUM("cumulative", "incremental"),
              allowNull: true,
            },
            goal_value: {
              type: Sequelize.FLOAT,
              allowNull: true,
            },
            time_frame_enabled: {
              type: Sequelize.BOOLEAN,
              defaultValue: false,
              allowNull: false,
            },
            start_date: {
              type: Sequelize.DATEONLY,
              allowNull: true,
            },
            deadline_date: {
              type: Sequelize.DATEONLY,
              allowNull: true,
            },
            alert_enabled: {
              type: Sequelize.BOOLEAN,
              defaultValue: false,
              allowNull: false,
            },
            alert_thresholds: {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: 80,
              validate: {
                min: 0,
                max: 100,
              },
            },
            is_achieved: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            is_active: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
            },
            display_options: {
              type: Sequelize.JSONB,
              allowNull: false,
              defaultValue: Sequelize.literal(
                `'{"showOnDashboard": true, "priority": 1, "chartType": "line", "color": "#E897A3"}'::jsonb`
              ),
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
          { transaction }
        );

        console.log("✅ Metric Settings table created successfully.");
      } catch (error) {
        console.error("❌ Error creating Metric Settings table:", error);
        throw error;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable(
          { schema: "public", tableName: "metric_settings" },
          { transaction }
        );

        // Drop ENUM type if exists
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "public"."enum_metric_settings_goal_type";`,
          { transaction }
        );

        console.log("✅ Metric Settings table dropped successfully.");
      } catch (error) {
        console.error("❌ Error dropping Metric Settings table:", error);
        throw error;
      }
    });
  },
};

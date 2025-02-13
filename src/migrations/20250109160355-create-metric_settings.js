// migrations/20250124001000-create-metricsettings.js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("metric_settings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      metric_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "metrics", key: "id" },
        onDelete: "CASCADE",
      },
      goal_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      goal_type: {
        type: Sequelize.ENUM("cumulative", "incremental"),
        allowNull: true,
      },
      goal_value: {
        type: Sequelize.FLOAT,
        allowNull: true,
        validate: {
          isPositive(value) {
            if (value !== null && value <= 0) {
              throw new Error("Goal value must be greater than 0.");
            }
          },
        },
      },
      time_frame_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      deadline_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      alerts_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("metric_settings");
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_metric_settings_goalType";`
    );
  },
};

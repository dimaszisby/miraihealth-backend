"use strict";

/** @type {import('sequelize-cli').Migration} */

const upStatements = [
  `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_metric_settings_metric
     ON public.metric_settings (metric_id);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_settings_active_metric
     ON public.metric_settings (metric_id)
     WHERE is_active;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_settings_dashboard_flag
     ON public.metric_settings (
       (COALESCE((display_options->>'showOnDashboard')::boolean, false))
     )
     WHERE is_active;`,
];

const downStatements = [
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metric_settings_dashboard_flag;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metric_settings_active_metric;`,
  `DROP INDEX CONCURRENTLY IF EXISTS uq_metric_settings_metric;`,
];

async function runStatements(queryInterface, statements) {
  for (const statement of statements) {
    await queryInterface.sequelize.query(statement);
  }
}

module.exports = {
  async up(queryInterface) {
    await runStatements(queryInterface, upStatements);
  },
  async down(queryInterface) {
    await runStatements(queryInterface, downStatements);
  },
  options: {
    useTransaction: false,
  },
};

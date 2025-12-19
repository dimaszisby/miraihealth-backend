"use strict";

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

/**
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {string[]} statements
 */
async function runStatements(queryInterface, statements) {
  for (const statement of statements) {
    await queryInterface.sequelize.query(statement);
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   */
  async up(queryInterface) {
    await runStatements(queryInterface, upStatements);
  },
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   */
  async down(queryInterface) {
    await runStatements(queryInterface, downStatements);
  },
  options: {
    useTransaction: false,
  },
};

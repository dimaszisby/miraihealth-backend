"use strict";

const upStatements = [
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_logs_metric_created
     ON public.metric_logs (metric_id, created_at DESC);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_logs_metric_logged
     ON public.metric_logs (metric_id, logged_at DESC);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_logs_metric_log_value
     ON public.metric_logs (metric_id, log_value);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS brin_metric_logs_logged
     ON public.metric_logs USING brin (logged_at);`,
  `DROP INDEX CONCURRENTLY IF EXISTS ix_metric_logs_metric_id_logged_at;`,
];

const downStatements = [
  `DROP INDEX CONCURRENTLY IF EXISTS brin_metric_logs_logged;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metric_logs_metric_log_value;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metric_logs_metric_logged;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metric_logs_metric_created;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_metric_logs_metric_id_logged_at
     ON public.metric_logs (metric_id, logged_at);`,
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

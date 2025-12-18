"use strict";

/** @type {import('sequelize-cli').Migration} */

const upStatements = [
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_user_created
     ON public.metrics (user_id, created_at DESC)
     WHERE deleted_at IS NULL;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_user_updated
     ON public.metrics (user_id, updated_at DESC)
     WHERE deleted_at IS NULL;`,
  `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_metrics_user_name
     ON public.metrics (user_id, lower(name))
     WHERE deleted_at IS NULL;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_category_active
     ON public.metrics (category_id)
     WHERE deleted_at IS NULL;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_original_metric_active
     ON public.metrics (original_metric_id)
     WHERE deleted_at IS NULL;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_id_user_active
     ON public.metrics (id, user_id)
     WHERE deleted_at IS NULL;`,
];

const downStatements = [
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metrics_id_user_active;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metrics_original_metric_active;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metrics_category_active;`,
  `DROP INDEX CONCURRENTLY IF EXISTS uq_metrics_user_name;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metrics_user_updated;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metrics_user_created;`,
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

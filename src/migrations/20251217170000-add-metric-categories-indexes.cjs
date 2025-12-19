"use strict";

const upStatements = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_categories_user_active
     ON public.metric_categories (user_id, created_at DESC)
     WHERE deleted_at IS NULL;`,
  `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_metric_categories_user_name
     ON public.metric_categories (user_id, lower(name))
     WHERE deleted_at IS NULL;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS gin_metric_categories_name_trgm
     ON public.metric_categories
     USING gin (lower(name) gin_trgm_ops);`,
];

const downStatements = [
  `DROP INDEX CONCURRENTLY IF EXISTS gin_metric_categories_name_trgm;`,
  `DROP INDEX CONCURRENTLY IF EXISTS uq_metric_categories_user_name;`,
  `DROP INDEX CONCURRENTLY IF EXISTS idx_metric_categories_user_active;`,
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

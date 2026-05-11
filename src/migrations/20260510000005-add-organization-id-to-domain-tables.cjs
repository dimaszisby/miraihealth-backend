"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const domainTables = [
        "metrics",
        "metric_categories",
        "metric_settings",
        "metric_logs",
      ];
      const systemTables = ["processed_messages"];

      console.log("[DB PROCESS] Adding nullable organization_id to domain tables...");

      for (const table of domainTables) {
        await queryInterface.addColumn(
          table,
          "organization_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "organizations", key: "id" },
            onDelete: "RESTRICT",
          },
          { transaction },
        );
      }

      for (const table of systemTables) {
        await queryInterface.addColumn(
          table,
          "organization_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "organizations", key: "id" },
            onDelete: "SET NULL",
          },
          { transaction },
        );
      }

      console.log("[DB PROCESS] Backfilling organization_id from owner memberships...");

      for (const table of ["metrics", "metric_categories"]) {
        await queryInterface.sequelize.query(
          `
          UPDATE "${table}" t
          SET "organization_id" = (
            SELECT m."organization_id"
            FROM "memberships" m
            WHERE m."user_id" = t."user_id" AND m."role" = 'owner'
            LIMIT 1
          )
          WHERE t."organization_id" IS NULL
          `,
          { transaction },
        );
      }

      // metric_settings joins through metrics to get user_id
      await queryInterface.sequelize.query(
        `
        UPDATE "metric_settings" ms
        SET "organization_id" = (
          SELECT m."organization_id"
          FROM "metrics" met
          INNER JOIN "memberships" m ON m."user_id" = met."user_id" AND m."role" = 'owner'
          WHERE met."id" = ms."metric_id"
          LIMIT 1
        )
        WHERE ms."organization_id" IS NULL
        `,
        { transaction },
      );

      // metric_logs joins through metrics to get user_id
      await queryInterface.sequelize.query(
        `
        UPDATE "metric_logs" ml
        SET "organization_id" = (
          SELECT m."organization_id"
          FROM "metrics" met
          INNER JOIN "memberships" m ON m."user_id" = met."user_id" AND m."role" = 'owner'
          WHERE met."id" = ml."metric_id"
          LIMIT 1
        )
        WHERE ml."organization_id" IS NULL
        `,
        { transaction },
      );

      // processed_messages has no user_id — backfill as NULL is acceptable
      // (it's system bookkeeping with ON DELETE SET NULL per ADR-001)

      console.log("[DB PROCESS] organization_id backfill complete.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const allTables = [
        "metrics",
        "metric_categories",
        "metric_settings",
        "metric_logs",
        "processed_messages",
      ];

      console.log("[DB PROCESS] Removing organization_id from domain tables...");

      for (const table of allTables) {
        await queryInterface.removeColumn(table, "organization_id", {
          transaction,
        });
      }

      console.log("[DB PROCESS] organization_id columns removed.");
    });
  },
};

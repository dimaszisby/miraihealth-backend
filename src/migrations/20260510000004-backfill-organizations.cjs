"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log(
        "[DB PROCESS] Backfilling organizations for existing users...",
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO "organizations" ("id", "name", "slug", "created_at", "updated_at")
        SELECT
          gen_random_uuid(),
          LEFT(COALESCE(NULLIF(u."username", ''), split_part(u."email", '@', 1)), 100),
          LEFT(
            LOWER(REGEXP_REPLACE(
              COALESCE(NULLIF(u."username", ''), split_part(u."email", '@', 1)),
              '[^a-zA-Z0-9]+', '-', 'g'
            )),
            91
          ) || '-' || SUBSTR(u."id"::text, 1, 8),
          NOW(),
          NOW()
        FROM "users" u
        WHERE NOT EXISTS (
          SELECT 1 FROM "memberships" m WHERE m."user_id" = u."id"
        )
        `,
        { transaction },
      );

      console.log("[DB PROCESS] Backfilling owner memberships...");

      await queryInterface.sequelize.query(
        `
        INSERT INTO "memberships" ("id", "user_id", "organization_id", "role", "status", "joined_at", "created_at", "updated_at")
        SELECT
          gen_random_uuid(),
          u."id",
          o."id",
          'owner',
          'active',
          NOW(),
          NOW(),
          NOW()
        FROM "users" u
        INNER JOIN "organizations" o
          ON o."slug" = LEFT(
            LOWER(REGEXP_REPLACE(
              COALESCE(NULLIF(u."username", ''), split_part(u."email", '@', 1)),
              '[^a-zA-Z0-9]+', '-', 'g'
            )),
            91
          ) || '-' || SUBSTR(u."id"::text, 1, 8)
        WHERE NOT EXISTS (
          SELECT 1 FROM "memberships" m WHERE m."user_id" = u."id" AND m."organization_id" = o."id"
        )
        `,
        { transaction },
      );

      console.log("[DB PROCESS] Backfill complete.");
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      console.log("[DB PROCESS] Reverting organization backfill...");
      await queryInterface.sequelize.query(
        `DELETE FROM "memberships"
         WHERE "role" = 'owner'
           AND NOT EXISTS (
             SELECT 1 FROM "memberships" m2
             WHERE m2."user_id" = "memberships"."user_id"
               AND m2."organization_id" = "memberships"."organization_id"
               AND m2."id" != "memberships"."id"
           )`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `DELETE FROM "organizations"
         WHERE NOT EXISTS (
           SELECT 1 FROM "memberships" m
           WHERE m."organization_id" = "organizations"."id"
         )`,
        { transaction },
      );
      console.log("[DB PROCESS] Organization backfill reverted.");
    });
  },
};

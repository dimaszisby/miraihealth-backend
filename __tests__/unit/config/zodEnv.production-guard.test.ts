import { describe, it, expect } from "@jest/globals";
import { withTestEnv } from "@/tests/env-test-utils.js";

/**
 * ADR-0036 — environment switches whose value would weaken a production security
 * control are refused at the Zod schema layer, so the process fails fast at startup
 * rather than serving traffic with the control silently disabled.
 *
 * `withTestEnv` applies the overrides and calls `loadEnvOrExit()` itself, before it
 * invokes the callback — so a refusal rejects the `withTestEnv` promise rather than
 * throwing inside the callback. Hence `.rejects` / `.resolves` on the whole call.
 */
const noop = () => undefined;

// A *clean* production env. The ambient .env.test sets DISABLE_RATE_LIMITING=true and
// start:test sets ALLOW_TEST_HTTP_SERVER=true, so both are neutralised here — otherwise
// every case would trip on the ambient value instead of the one under test.
const PRODUCTION_BASE: Record<string, string> = {
  NODE_ENV: "production",
  SWAGGER_REQUIRE_AUTH: "true",
  DISABLE_RATE_LIMITING: "false",
  ALLOW_TEST_HTTP_SERVER: "false",
};

const inProduction = (overrides: Record<string, string>) =>
  withTestEnv(noop, { overrides: { ...PRODUCTION_BASE, ...overrides } });

/**
 * envManager wraps the ZodError in an EnvValidationError whose message is the
 * generic "Environment validation failed"; the offending variable is carried in
 * `issues[].path`. Asserting on the path pins the exact rule that fired.
 */
const refusalFor = (name: string) => ({
  issues: expect.arrayContaining([expect.objectContaining({ path: [name] })]),
});

describe("zodEnv production-unsafe switch refusal (ADR-0036)", () => {
  it.each([
    ["DISABLE_RATE_LIMITING", { DISABLE_RATE_LIMITING: "true" }],
    ["ALLOW_TEST_HTTP_SERVER", { ALLOW_TEST_HTTP_SERVER: "true" }],
    ["SWAGGER_REQUIRE_AUTH", { SWAGGER_REQUIRE_AUTH: "false" }],
  ])("refuses %s in production", async (name, overrides) => {
    await expect(inProduction(overrides)).rejects.toMatchObject(
      refusalFor(name),
    );
  });

  it.each([
    ["RABBITMQ_USER", { RABBITMQ_USER: "guest", RABBITMQ_PASSWORD: "secret" }],
    ["RABBITMQ_PASSWORD", { RABBITMQ_USER: "svc", RABBITMQ_PASSWORD: "guest" }],
  ])(
    "refuses default %s when RabbitMQ is enabled in production",
    async (name, overrides) => {
      await expect(
        inProduction({ RABBITMQ_ENABLED: "true", ...overrides }),
      ).rejects.toMatchObject(refusalFor(name));
    },
  );

  it("allows guest RabbitMQ credentials when RabbitMQ is disabled", async () => {
    await expect(
      inProduction({
        RABBITMQ_ENABLED: "false",
        RABBITMQ_USER: "guest",
        RABBITMQ_PASSWORD: "guest",
      }),
    ).resolves.toBeUndefined();
  });

  it("leaves non-production environments untouched", async () => {
    // This is the exact combination `npm run start:test` uses.
    await expect(
      withTestEnv(noop, {
        overrides: {
          NODE_ENV: "test",
          DISABLE_RATE_LIMITING: "true",
          ALLOW_TEST_HTTP_SERVER: "true",
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("catches a capitalized NODE_ENV, which a raw process.env check would miss", async () => {
    await expect(
      withTestEnv(noop, {
        overrides: { NODE_ENV: "Production", DISABLE_RATE_LIMITING: "true" },
      }),
    ).rejects.toMatchObject(refusalFor("DISABLE_RATE_LIMITING"));
  });
});

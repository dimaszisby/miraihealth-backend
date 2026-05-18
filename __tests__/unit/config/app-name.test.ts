import { describe, expect, it, jest } from "@jest/globals";
import { withTestEnv } from "@/tests/env-test-utils.js";

// app-name.ts reads process.env.APP_NAME at module-load time and derives
// APP_SHORT_NAME / APP_DISPLAY_NAME from it. Each case here uses withTestEnv
// to set the override, then jest.isolateModulesAsync re-imports the module so
// the derivation runs against the case-specific value.

const loadAppName = async () => {
  let mod!: typeof import("@/config/app-name.js");
  await jest.isolateModulesAsync(async () => {
    mod = await import("@/config/app-name.js");
  });
  return mod;
};

describe("app-name", () => {
  it("derives 'lakira' / 'Lakira' from APP_NAME='lakira-backend' (upstream default)", async () => {
    await withTestEnv(
      async () => {
        const { APP_NAME, APP_SHORT_NAME, APP_DISPLAY_NAME } =
          await loadAppName();
        expect(APP_NAME).toBe("lakira-backend");
        expect(APP_SHORT_NAME).toBe("lakira");
        expect(APP_DISPLAY_NAME).toBe("Lakira");
      },
      { overrides: { APP_NAME: "lakira-backend" } },
    );
  });

  it("strips a trailing '-backend' suffix from APP_SHORT_NAME", async () => {
    await withTestEnv(
      async () => {
        const { APP_NAME, APP_SHORT_NAME, APP_DISPLAY_NAME } =
          await loadAppName();
        expect(APP_NAME).toBe("my-cool-app-backend");
        expect(APP_SHORT_NAME).toBe("my-cool-app");
        expect(APP_DISPLAY_NAME).toBe("My Cool App");
      },
      { overrides: { APP_NAME: "my-cool-app-backend" } },
    );
  });

  it("keeps the name as-is when there is no '-backend' suffix", async () => {
    await withTestEnv(
      async () => {
        const { APP_SHORT_NAME, APP_DISPLAY_NAME } = await loadAppName();
        expect(APP_SHORT_NAME).toBe("my-app");
        expect(APP_DISPLAY_NAME).toBe("My App");
      },
      { overrides: { APP_NAME: "my-app" } },
    );
  });

  it("handles single-word names without a hyphen", async () => {
    await withTestEnv(
      async () => {
        const { APP_SHORT_NAME, APP_DISPLAY_NAME } = await loadAppName();
        expect(APP_SHORT_NAME).toBe("foo");
        expect(APP_DISPLAY_NAME).toBe("Foo");
      },
      { overrides: { APP_NAME: "foo" } },
    );
  });
});

// Reads process.env directly — intentional bypass of envManager.
// logger.ts imports this module at load time, before envManager is initialised,
// so going through the Zod-validated env object would cause a circular init failure.
export const APP_NAME = process.env.APP_NAME ?? "lakira-backend";
export const APP_SHORT_NAME = APP_NAME.replace(/-backend$/, "");

const toTitleCase = (s: string): string =>
  s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const APP_DISPLAY_NAME = toTitleCase(APP_SHORT_NAME);

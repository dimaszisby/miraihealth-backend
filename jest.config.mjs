// jest.config.mjs

export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "mjs"],
  verbose: true,
  testTimeout: 30000,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@/(.*)$": "<rootDir>/src/$1", // Keep the original for non-.js imports
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  reporters: [
    "default",
    [
      "jest-summary-reporter",
      {
        failuresOnly: false,
        showPassed: false,
      },
    ],
  ],
};

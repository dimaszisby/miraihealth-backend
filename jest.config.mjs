// jest.config.mjs

const projectBase = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
};

export default {
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,tsx}",
    "!<rootDir>/src/main.ts",
    "!<rootDir>/src/server.ts",
    "!<rootDir>/**/index.ts",
    "!<rootDir>/src/infrastructure/db/migrations/**",
    "!<rootDir>/src/tests/**",
  ],
  coverageDirectory: "<rootDir>/coverage/jest",
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
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
  projects: [
    {
      ...projectBase,
      displayName: "unit",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.unit.ts"],
    },
    {
      ...projectBase,
      displayName: "integration",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    },
  ],
};

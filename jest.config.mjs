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

const summaryReporter = [
  "jest-summary-reporter",
  {
    failuresOnly: false,
    showPassed: false,
  },
];

const junitReporter = [
  "jest-junit",
  {
    outputDirectory: "<rootDir>/coverage/junit",
    outputName: process.env.JEST_JUNIT_OUTPUT_NAME ?? "junit.xml",
    ancestorSeparator: " > ",
    classNameTemplate: "{filepath}",
    titleTemplate: "{classname} {title}",
  },
];

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
  reporters: ["default", summaryReporter, junitReporter],
  projects: [
    {
      ...projectBase,
      displayName: "unit",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.unit.ts"],
      coverageThreshold: {
        global: {
          statements: 60,
          branches: 40,
          functions: 55,
          lines: 60,
        },
      },
    },
    {
      ...projectBase,
      displayName: "integration",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      coverageThreshold: {
        global: {
          statements: 70,
          branches: 45,
          functions: 70,
          lines: 70,
        },
      },
    },
  ],
};

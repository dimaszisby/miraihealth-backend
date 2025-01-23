module.exports = {
  setupFilesAfterEnv: ["./jest.setup.js"], // Path to your setup file
  testEnvironment: "node", // Use Node.js environment
  testMatch: ["**/__tests__/**/*.test.js"], // Pattern to locate test files
  verbose: true, // Enable verbose logging
  moduleNameMapper: {
    "^@controllers/(.*)$": ["<rootDir>/controllers/$1"],
    "^@services/(.*)$": ["<rootDir>/services/$1"],
    "^@models/(.*)$": ["<rootDir>/models/$1"],
    "^@middleware/(.*)$": ["<rootDir>/middleware/$1"],
    "^@routes/(.*)$": ["<rootDir>/routes/$1"],
    "^@config/(.*)$": ["<rootDir>/config/$1"],
    "^@utils/(.*)$": ["<rootDir>/utils/$1"],
    "^@tests/(.*)$": ["<rootDir>/tests/$1"],
  },
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    // Add other transformers if needed
  },
};

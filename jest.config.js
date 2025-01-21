module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'], // Path to your setup file
  testEnvironment: 'node', // Use Node.js environment
  testMatch: ['**/__tests__/**/*.test.js'], // Pattern to locate test files
  verbose: true, // Enable verbose logging
};
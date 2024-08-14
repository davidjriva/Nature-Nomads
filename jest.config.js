module.exports = {
  verbose: true,
  setupFiles: ['dotenv/config'],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
};

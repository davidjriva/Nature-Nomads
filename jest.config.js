module.exports = {
  verbose: true,
  setupFiles: ['dotenv/config'],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
};

module.exports = {
  verbose: true,
  setupFiles: ["dotenv/config"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};

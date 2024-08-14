const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const { startServer, closeServer } = require(path.join(__dirname, '../server'));
const app = require(path.join(__dirname, '../app'));
const request = require('supertest');

// LOGGING: TO SEE A PRINT IN GITHUB ACTIONS USE THE ERROR FUNCTION
const { error } = require('console');

let mongoServer;

beforeAll(async () => {
  error("Hello from Github Actions using --> { error } = require('console')");
  let uri;
  if (process.env.MONGODB_CONNECTION_STRING) {
    // Github actions is running and will provide connection string
    uri = process.env.MONGODB_CONNECTION_STRING;
  } else {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  // Connect to MongoDB
  await mongoose.connect(uri);

  const isConnected = mongoose.connection.readyState === 1; // 1 means connected
  expect(isConnected).toBe(true);

  // Start Express Server
  await startServer();
});

afterAll(async () => {
  await closeServer();
  await mongoose.disconnect();
  // MongoServer is not instantiated in Github Actions
  if (mongoServer) {
    await mongoServer.stop();
  }
});

module.exports = { mongoServer, mongoose };

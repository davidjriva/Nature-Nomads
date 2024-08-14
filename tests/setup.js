const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const { startServer, closeServer } = require(path.join(__dirname, '../server'));
const app = require(path.join(__dirname, '../app'));
const request = require('supertest');

// LOGGING: TO SEE A PRINT IN GITHUB ACTIONS USE THE ERROR FUNCTION
const { error } = require('console');

let mongoServer;

const adminUser = {
  email: 'admin@gmail.com',
  name: 'The Admin',
  password: 'this_is_my_password',
  passwordConfirm: 'this_is_my_password',
  role: 'admin',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(async () => {
  error("hello from actions using -> {error} = require('console') ☝️😎☝️");

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

  // Start Express Server
  await startServer();

  // Ping server
  await request(app).get('/ping-route').expect(200);

  // Sleep
  await sleep(2 * 1000);

  // Setup Admin User [Wait for MongoDB to Fully Initialize]
  const adminRes = await request(app).post('/api/v1/users/signup').send(adminUser);

  await sleep(2 * 1000);
  expect(adminRes.statusCode).toBe(201);

  // error('STATUS-CODE= ', adminRes.statusCode);
  // error('adminRes= ', adminRes);

  adminUser._id = adminRes.body.data.newUser._id;
  adminUser.token = adminRes.body.data.token;
}, 10 * 1000);

afterAll(async () => {
  await closeServer();
  await mongoose.disconnect();
  // MongoServer is not instantiated in Github Actions
  if (mongoServer) {
    await mongoServer.stop();
  }
});

module.exports = { mongoServer, mongoose, adminUser };

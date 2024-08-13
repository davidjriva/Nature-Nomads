const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const { startServer, closeServer } = require('../server');
const app = require(path.join(__dirname, '../app'));
const request = require('supertest');

let mongoServer;

const adminUser = {
  email: 'admin@gmail.com',
  name: 'The Admin',
  password: 'this_is_my_password',
  passwordConfirm: 'this_is_my_password',
  role: 'admin',
};

beforeAll(async () => {
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

  // Setup Admin User
  try {
    const adminRes = await request(app).post('/api/v1/users/signup').send(adminUser);
    console.log('Admin Response:', adminRes.body); // Log the entire response for debugging

    if (adminRes.body && adminRes.body.data) {
      adminUser._id = adminRes.body.data.newUser._id;
      adminUser.token = adminRes.body.data.token;
    } else {
      throw new Error('Invalid response structure from signup endpoint');
    }
  } catch (error) {
    console.error('Error setting up admin user:', error);
    throw error; // Rethrow the error to fail the test setup
  }
});

afterAll(async () => {
  await closeServer();
  await mongoose.disconnect();
  // MongoServer is not instantiated in Github Actions
  if (mongoServer) {
    await mongoServer.stop();
  }
});

module.exports = { mongoServer, mongoose, adminUser };

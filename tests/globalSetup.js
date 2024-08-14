const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const dotenv = require('dotenv');
const request = require('supertest');
const app = require(path.join(__dirname, '../app'));

const adminUser = {
  email: 'admin-users-routes@gmail.com',
  name: 'The Admin',
  password: 'this_is_my_password',
  passwordConfirm: 'this_is_my_password',
  role: 'admin',
};

module.exports = async function (globalConfig, projectConfig) {
  // Configure environment variable
  dotenv.config({ path: path.join(__dirname, '../config.env') });

  let uri;
  if (process.env.MONGODB_CONNECTION_STRING) {
    // Github actions is running and will provide connection string
    uri = process.env.MONGODB_CONNECTION_STRING;
  } else {
    globalThis.MONGO_SERVER = await MongoMemoryServer.create();
    uri = MONGO_SERVER.getUri();
  }

  process.env.MONGO_URI = uri;

  // Connect to MongoDB
  await mongoose.connect(uri);

  // Setup an admin account
  const adminRes = await request(app).post('/api/v1/users/signup').send(adminUser).expect(201);

  adminUser._id = adminRes.body.data.newUser._id;
  adminUser.token = adminRes.body.data.token;

  process.env.ADMIN_USER = JSON.stringify(adminUser);
};

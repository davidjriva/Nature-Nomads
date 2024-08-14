const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const dotenv = require('dotenv');

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
};

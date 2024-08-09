const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { startServer, closeServer } = require('../server');

let mongoServer;

beforeAll(async () => {
  let uri;
  if (process.env.MONGODB_CONNECTION_STRING) {
    // Github actions is running and will provide connection string
    uri = process.env.MONGODB_CONNECTION_STRING;
  } else {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

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

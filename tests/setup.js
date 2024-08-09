const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { startServer, closeServer } = require("../server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await startServer();
});

afterAll(async () => {
  await closeServer();
  await mongoose.disconnect();
  await mongoServer.stop();
});

module.exports = { mongoServer, mongoose };
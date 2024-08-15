const mongoose = require('mongoose');

module.exports = async function (globalConfig, projectConfig) {
  await mongoose.disconnect();
  // MongoServer is not instantiated in Github Actions
  if (globalThis.MONGO_SERVER) {
    await globalThis.MONGO_SERVER.stop();
  }
};
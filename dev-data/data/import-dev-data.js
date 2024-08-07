/*
    Script to ingest the user & tour data into MongoDB
    Has two options:
        --import: Ingests all data from the tour.json file into the MongoDB
        --delete: Clears all data from MongoDB
*/

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Tour = require(path.join(__dirname, '.', '..', '..', 'models', 'tourModel'));
const Review = require(path.join(__dirname, '.', '..', '..', 'models', 'reviewModel'));
const User = require(path.join(__dirname, '.', '..', '..', 'models', 'userModel'));

dotenv.config({ path: './config.env' });

// Connection with MongoDB via Mongoose driver
const DBConnectionStr = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DBConnectionStr, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// Import data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

// Delete all data from the DB
const deleteAllData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    console.log('All data has been deleted...');
    process.exit();
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

if (process.argv[2] == '--import') {
  importData();
} else if (process.argv[2] == '--delete') {
  deleteAllData();
} else {
  console.log('Improper arguments passed. Please pass --import or --delete as options.');
}

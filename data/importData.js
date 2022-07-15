const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Shoe = require('../models/shoeModel');

dotenv.config({ path: `./config.env` });

// LINKING THE MONGODB

const DB = process.env.MONGOOSE_DB.replace(
  '<password>',
  process.env.MONGOOSE_PASSWORD
);

const launchMongoose = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });

    console.log(`CONNECTED TO DB SUCCESSFULLY`);
  } catch (err) {
    console.log(`FAILED TO CONNECT TO DB! ${err.message}`);
  }
};
launchMongoose();

// READ File
const shoes = JSON.parse(fs.readFileSync(`${__dirname}/shoes.json`, `utf-8`));

// IMPORT DATA INTO DB

const importData = async () => {
  try {
    await Shoe.create(shoes);
    console.log(`Data successfully loaded. `);
  } catch (err) {
    console.error(err);
  }
  process.exit();
};

// DELETE EXISTING DATA FROM DATABASE

const deleteData = async () => {
  try {
    await Shoe.deleteMany();
    console.log(`Data successfully deleted. `);
  } catch (err) {
    console.error(err);
  }
  process.exit();
};

process.argv[2] === '--import' && importData();

process.argv[2] === '--delete' && deleteData();

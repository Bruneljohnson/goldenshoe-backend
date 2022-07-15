const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHTEXCEPTION');
  process.exit(1);
});

const app = require('./app');

//----------CONNECT TO DATABASE-------------//
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

//----------START SERVER-------------//
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`EXPRESS SERVER RUNNING AT ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLEDREJECTION');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', (err) => {
  console.log('SIGTERM RECIEVED, SHUTTING DOWN NOW.');
  server.close(() => console.log('PROCESS TERMINATED!'));
});

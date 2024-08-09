const mongoose = require('mongoose');
const path = require('path');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION. Shutting down...');
  console.error(`Name: ${err.name}`);

  if (process.env.NODE_ENV == 'development') {
    console.error(`Message: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
  }

  console.error(`Timestamp: ${new Date().toISOString()}`);

  process.exit(1);
});

// Reading in environment variables
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, 'config.env') });

// Connection with MongoDB via Mongoose driver
const connectDB = async () => {
  try {
    const DBConnectionStr = process.env.DATABASE.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD
    );

    await mongoose
      .connect(DBConnectionStr, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('DB connection successful');
        }
      });
  } catch (err) {
    console.error(err);
  }
};

// Express app logic
const app = require('./app');

let server;
const startServer = async (customPort) => {
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();
  }

  const port = customPort || 0;
  server = app.listen(port, () => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`App running on port ${port}...`);
    }
  });

  // Shutdown gracefully
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION. Shutting down...');
    console.error(err.name, err.message);

    server.close(() => {
      process.exit(1);
    });
  });

  // SIGTERM from Heroku [shutdown gracefully]
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');

    server.close(() => {
      console.log('Process terminated');
    });
  });
};

const closeServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (process.env.NODE_ENV !== 'test') {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  startServer(process.env.PORT);
}

module.exports = { startServer, closeServer };

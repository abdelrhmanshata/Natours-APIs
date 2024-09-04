const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle any uncaught exceptions (e.g., programming errors or bugs not caught by try/catch)
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Load environment variables from the config.env file into process.env
dotenv.config({ path: './config.env' });
const app = require('./app');

// Replace the placeholder in the database connection string with the actual password
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// Connect to the MongoDB database
mongoose.connect(DB, {}).then(() => console.log('DB connection successful!')); // Log a success message if the connection is successful

// Start the server on the specified port, or default to port 3000
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle unhandled promise rejections (e.g., failed asynchronous operations)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // Close the server and exit the process to avoid running in an unstable state
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal sent by the hosting environment (e.g., Heroku, AWS) for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  // Close the server to stop accepting new requests
  server.close(() => {
    console.log('💥 Process terminated!'); // Log a message once the server has closed
  });
});

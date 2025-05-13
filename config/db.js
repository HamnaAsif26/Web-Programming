const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables or use default
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/arte_gallery"

    console.log("Connecting to MongoDB:", mongoURI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, "mongodb://*****:*****@"))

    // Set mongoose options with latest recommended settings
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options)

    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`)
      // Attempt to reconnect
      setTimeout(() => {
        mongoose.connect(mongoURI, options);
      }, 5000);
    })

    // Handle disconnection
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected")
      // Attempt to reconnect
      setTimeout(() => {
        mongoose.connect(mongoURI, options);
      }, 5000);
    })

    // Handle process termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close()
      console.log("MongoDB connection closed due to app termination")
      process.exit(0)
    })

    return conn
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    // Retry connection after delay
    console.log("Retrying connection in 5 seconds...")
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
}

module.exports = connectDB

import mongoose from "mongoose";

let connectionPromise = null;

const connectToDatabase = async () => {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in server environment.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri);
  }

  await connectionPromise;
  return mongoose.connection;
};

export default connectToDatabase;

import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["2400:1a00:8000:4::73"]);

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
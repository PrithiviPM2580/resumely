import mongoose from "mongoose";
import { ENV } from "./env.config";

mongoose.set("strictQuery", true);

export const connectDB = async () => {
  const conn = await mongoose.connect(ENV.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000, // Set a timeout for server selection
  });
  console.log(
    `MongoDB connected: ${conn.connection.host}/${conn.connection.name} [${ENV.NODE_ENV}]`,
  );

  mongoose.connection.on("error", (err) => {
    console.error(`MongoDB connection error: ${err?.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
};

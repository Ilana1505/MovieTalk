import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import createApp from "./app";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    if (!process.env.DB_URI) {
      throw new Error("DB_URI is not defined");
    }

    await mongoose.connect(process.env.DB_URI);

    console.log(" Connected to MongoDB");

    const app = createApp();

    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
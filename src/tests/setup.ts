import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || "testsecret";
  process.env.TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || "10m";
  process.env.REFRESH_TOKEN_EXPIRATION =
    process.env.REFRESH_TOKEN_EXPIRATION || "7d";
  process.env.GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID || "test-google-client-id";
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
import express, { Express } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import PostRoute from "./routes/post.route";
import CommentRoute from "./routes/comment.route";
import AuthRoute from "./routes/auth.route";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import cors from "cors";

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

// Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("🎬 MovieTalk Backend API is running!");
});
app.use("/posts", PostRoute);
app.use("/comments", CommentRoute);
app.use("/auth", AuthRoute);

// Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MovieTalk API",
      version: "1.0.0",
      description: "Movie review app with JWT",
    },
    servers: [{ url: `http://localhost:${process.env.PORT}` }],
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

// DB Init
const initApp = (): Promise<Express> => {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "❌ MongoDB error:"));
    db.once("open", () => {
      console.log("✅ Connected to MongoDB");
    });

    if (!process.env.DB_URI) {
      reject("DB_URI is not defined");
    } else {
      mongoose
        .connect(process.env.DB_URI)
        .then(() => resolve(app))
        .catch((err) => reject(err));
    }
  });
};

export default initApp;

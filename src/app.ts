import express, { Express } from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import cors from "cors";
import PostRoute from "./routes/post.route";
import CommentRoute from "./routes/comment.route";
import AuthRoute from "./routes/auth.route";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import path from "path";
import userRouter from "./routes/user.route";

const app = express();

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/posts", express.static(path.join(__dirname, "../uploads/posts")));
app.use("/uploads/profile-pictures", express.static(path.join(__dirname, "../uploads/profile-pictures")));

app.get("/", (req, res) => {
  res.send("🎬 MovieTalk Backend API is running!");
});
app.use("/posts", PostRoute);
app.use("/comments", CommentRoute);
app.use("/auth", AuthRoute);
app.use("/users", userRouter);

// ✅ הגדרת Swagger
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
  apis: ["./src/routes/*.ts"], // ודאי שהנתיב נכון לפרויקט שלך
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

// ✅ התחברות למסד הנתונים
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
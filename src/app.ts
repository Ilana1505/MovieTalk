import express, { Express } from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import path from "path";

import PostRoute from "./routes/post.route";
import CommentRoute from "./routes/comment.route";
import AuthRoute from "./routes/auth.route";
import userRouter from "./routes/user.route";
import aiRoute from "./routes/ai.route";

const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3001",
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    "/uploads/posts",
    express.static(path.join(__dirname, "../uploads/posts"))
  );

  app.use(
    "/uploads/profile-pictures",
    express.static(path.join(__dirname, "../uploads/profile-pictures"))
  );

  app.get("/", (_req, res) => {
    res.send("🎬 MovieTalk Backend API is running!");
  });

  app.use("/posts", PostRoute);
  app.use("/comments", CommentRoute);
  app.use("/auth", AuthRoute);
  app.use("/users", userRouter);
  app.use("/ai", aiRoute);

  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "MovieTalk API",
        version: "1.0.0",
        description: "Movie review app with JWT",
      },
      servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    },
    apis: ["./src/routes/*.ts"],
  };

  const specs = swaggerJsDoc(options);
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

  return app;
};

export default createApp;
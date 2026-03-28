import request from "supertest";
import createApp from "../app";
import { Express } from "express";

let app: Express;
let token = "";
let postId = "";
let commentId = "";

const userInfo = {
  fullName: "Ilana Barkin",
  email: "ilana@gmail.com",
  password: "123456",
};

beforeAll(async () => {
  app = createApp();

  await request(app).post("/auth/register").send(userInfo);
  const loginResponse = await request(app).post("/auth/login").send({
    email: userInfo.email,
    password: userInfo.password,
  });

  token = loginResponse.body.accessToken;

  const postResponse = await request(app)
    .post("/posts")
    .set("Authorization", `Bearer ${token}`)
    .field("title", "Test title")
    .field("description", "Test description")
    .field("review", "Test review");

  postId = postResponse.body._id;
});

describe("Comment test", () => {
  test("create comment success", async () => {
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        comment: "Great movie!",
        postId,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.comment).toBe("Great movie!");
    expect(response.body.postId).toBe(postId);
    expect(response.body.sender).toBe(userInfo.fullName);

    commentId = response.body._id;
  });

  test("create comment fail without token", async () => {
    const response = await request(app).post("/comments").send({
      comment: "No auth comment",
      postId,
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("No valid token provided");
  });

  test("get all comments", async () => {
    const response = await request(app).get("/comments");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("get comments by post id", async () => {
    const response = await request(app).get(`/comments/post/${postId}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].postId).toBe(postId);
  });

  test("get comment by id", async () => {
    const response = await request(app).get(`/comments/${commentId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(commentId);
  });

  test("get comment by invalid id", async () => {
    const response = await request(app).get("/comments/123");

    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Invalid ID");
  });

  test("update comment", async () => {
    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ comment: "Updated comment" });

    expect(response.statusCode).toBe(200);
    expect(response.body.comment).toBe("Updated comment");
  });

  test("delete comment", async () => {
    const response = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Item deleted");
  });
});
import request from "supertest";
import createApp from "../app";
import { Express } from "express";

let app: Express;
let token = "";
let postId = "";

const userInfo = {
  fullName: "Ilana Barkin",
  email: "ilana@gmail.com",
  password: "123456",
};

const testPost = {
  title: "Test title",
  description: "Test description",
  review: "Test review",
};

beforeAll(async () => {
  app = createApp();

  await request(app).post("/auth/register").send(userInfo);
  const loginResponse = await request(app).post("/auth/login").send({
    email: userInfo.email,
    password: userInfo.password,
  });

  token = loginResponse.body.accessToken;
});

describe("Post test", () => {
  test("get all posts empty", async () => {
    const response = await request(app).get("/posts");

    expect(response.statusCode).toBe(200);
    expect(response.body.posts).toHaveLength(0);
  });

  test("create post success", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("title", testPost.title)
      .field("description", testPost.description)
      .field("review", testPost.review);

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(testPost.title);
    expect(response.body.description).toBe(testPost.description);
    expect(response.body.review).toBe(testPost.review);

    postId = response.body._id;
  });

  test("create post fail without token", async () => {
    const response = await request(app).post("/posts").send(testPost);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("No valid token provided");
  });

  test("get all posts after adding", async () => {
    const response = await request(app).get("/posts");

    expect(response.statusCode).toBe(200);
    expect(response.body.posts).toHaveLength(1);
  });

  test("get post by id", async () => {
    const response = await request(app).get(`/posts/${postId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(postId);
  });

  test("get post by id fail", async () => {
    const response = await request(app).get(
      "/posts/6779946864cff57e00fb4694"
    );

    expect(response.statusCode).toBe(404);
  });

  test("update own post", async () => {
    const response = await request(app)
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Updated Title")
      .field("description", "Updated Description")
      .field("review", "Updated Review");

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Updated Title");
    expect(response.body.description).toBe("Updated Description");
    expect(response.body.review).toBe("Updated Review");
  });

  test("toggle like success", async () => {
    const response = await request(app)
      .post(`/posts/${postId}/like`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Post liked");
    expect(response.body.likes).toBe(1);
  });

test("toggle unlike success", async () => {
  const response = await request(app)
    .post(`/posts/${postId}/like`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe("Like removed");
});

  test("get my posts", async () => {
    const response = await request(app)
      .get("/posts/my-posts")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("delete own post", async () => {
    const response = await request(app)
      .delete(`/posts/${postId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Post deleted successfully");
  });
});
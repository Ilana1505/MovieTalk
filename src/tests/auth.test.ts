import request from "supertest";
import createApp from "../app";
import { Express } from "express";
import UserModel from "../models/User.model";

let app: Express;

const userInfo = {
  fullName: "Ilana Barkin",
  email: "ilana@gmail.com",
  password: "123456",
};

beforeAll(async () => {
  app = createApp();
});

describe("Auth test", () => {
  test("register success", async () => {
    const response = await request(app).post("/auth/register").send(userInfo);

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(userInfo.email);
    expect(response.body.fullName).toBe(userInfo.fullName);
  });

  test("register fail with same email", async () => {
    await request(app).post("/auth/register").send(userInfo);
    const response = await request(app).post("/auth/register").send(userInfo);

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Email already registered");
  });

  test("register fail without password", async () => {
    const response = await request(app).post("/auth/register").send({
      fullName: "Test User",
      email: "test@gmail.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Missing full name, email, or password");
  });

  test("login success", async () => {
    await request(app).post("/auth/register").send(userInfo);

    const response = await request(app).post("/auth/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body._id).toBeDefined();
  });

  test("login fail wrong password", async () => {
    await request(app).post("/auth/register").send(userInfo);

    const response = await request(app).post("/auth/login").send({
      email: userInfo.email,
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Wrong email or password");
  });

  test("refresh success", async () => {
    await request(app).post("/auth/register").send(userInfo);

    const loginResponse = await request(app).post("/auth/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });

    const response = await request(app).post("/auth/refresh").send({
      refreshToken: loginResponse.body.refreshToken,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  test("refresh fail without token", async () => {
    const response = await request(app).post("/auth/refresh").send({});

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("invalid token");
  });

  test("logout success", async () => {
    await request(app).post("/auth/register").send(userInfo);

    const loginResponse = await request(app).post("/auth/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });

    const response = await request(app).post("/auth/logout").send({
      refreshToken: loginResponse.body.refreshToken,
    });

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Logged out");
  });

  test("logout fail without refresh token", async () => {
    const response = await request(app).post("/auth/logout").send({});

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Missing refresh token or configuration");
  });

  test("get profile success", async () => {
    await request(app).post("/auth/register").send(userInfo);

    const loginResponse = await request(app).post("/auth/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });

    const response = await request(app)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(userInfo.email);
  });

  test("change password success", async () => {
    await request(app).post("/auth/register").send(userInfo);

    const loginResponse = await request(app).post("/auth/login").send({
      email: userInfo.email,
      password: userInfo.password,
    });

    const response = await request(app)
      .put("/auth/change-password")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({ password: "654321" });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Password updated successfully");

    const user = await UserModel.findOne({ email: userInfo.email });
    expect(user).toBeTruthy();
  });
});
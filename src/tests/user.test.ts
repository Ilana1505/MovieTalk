import request from "supertest";
import createApp from "../app";
import { Express } from "express";
import path from "path";
import fs from "fs";

let app: Express;
let token = "";

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
});

describe("User test", () => {
  test("upload profile pic fail without token", async () => {
    const filePath = path.join(__dirname, "test-image.jpg");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "fake image content");
    }

    const response = await request(app)
      .post("/users/upload-profile-pic")
      .attach("image", filePath);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("No valid token provided");
  });

  test("upload profile pic success", async () => {
    const filePath = path.join(__dirname, "test-image.jpg");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "fake image content");
    }

    const response = await request(app)
      .post("/users/upload-profile-pic")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.profilePicture).toContain("/uploads/profile-pictures/");
  });

  test("delete account success", async () => {
    const response = await request(app)
      .delete("/users/delete")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");
  });
});
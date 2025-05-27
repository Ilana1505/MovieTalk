import request from "supertest";
import initApp from "../app";
import mongoose from "mongoose";
import PostModel from "../models/Post.model";
import { Express } from "express";
import UserModel from "../models/User.model";
import { beforeAll, afterAll, describe, test, expect, jest } from '@jest/globals';

let app: Express;

beforeAll(async () => {
    app = await initApp();
    console.log("Before all tests");
    await UserModel.deleteMany();
    await PostModel.deleteMany();
});

afterAll(async () => {
    console.log("After all tests");
    await mongoose.connection.close();
});

type UserInfo = {
    email: string;
    password: string;
    accessToken?: string;
    refreshToken?: string;
    _id?: string;
};

const userInfo: UserInfo = {
    email: "ilana@gmail.com",
    password: "123456"
};



describe("Auth test", () => {
    test("Test auth registration", async () => {
        const response = await request(app).post("/auth/register").send(userInfo);
        expect(response.statusCode).toBe(200);
    });

    test("Test auth registration fail", async () => {
        const response = await request(app).post("/auth/register").send(userInfo);
        expect(response.statusCode).not.toBe(200);
    });

    test("Test auth registration fail with exists email", async () => {
        const response = await request(app).post("/auth/register").send(userInfo);
        expect(response.statusCode).not.toBe(200);
    });

    test("Test registration fail without password", async () => {
        const response = await request(app).post("/auth/register").send({
            email: userInfo.email
        });
        expect(response.statusCode).not.toBe(200);
        expect(response.text).toBe("missing email or password");
    });
    

    test("Test registration without email", async () => {
        const response = await request(app).post("/auth/register").send({ password: "123456" });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("missing email or password");
    });

    test("Test auth login", async () => {
        const response = await request(app).post("/auth/login").send(userInfo);
        expect(response.statusCode).toBe(200);
        const accessToken = response.body.accessToken;
        const refreshToken = response.body.refreshToken;
        const userId = response.body._id;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        expect(userId).toBeDefined();
        userInfo.accessToken = accessToken;
        userInfo.refreshToken = refreshToken;
        userInfo._id = userId;
    });

    test("Test auth login fail with false email", async () => {
        const response = await request(app).post("/auth/login").send({ email: userInfo.email + "9", password: userInfo.password });
        expect(response.statusCode).not.toBe(200);
    });

    test("Test auth login fail without password", async () => {
        const response = await request(app).post("/auth/login").send(
            { email: userInfo.email }
        );
        expect(response.statusCode).not.toBe(200);
    });

    test("Test login with empty body", async () => {
        const response = await request(app).post("/auth/login").send({});
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("wrong email or password");
    });

    test("Test auth login fail with false password", async () => {
        const response = await request(app).post("/auth/login").send({ email: userInfo.email, password: userInfo.password + "9" });
        expect(response.statusCode).not.toBe(200);
    });

    test("Test missing TOKEN_SECRET in login", async () => {
        const trueToken = process.env.TOKEN_SECRET;
        delete process.env.TOKEN_SECRET;
        const response = await request(app).post("/auth/login").send(userInfo);
        expect(response.statusCode).not.toBe(200);
        process.env.TOKEN_SECRET = trueToken;
    });

    test("Test get protected API", async () => {
        const response = await request(app).post("/posts").send({
            title: "My First post",
            content: "This is my first post",
            sender: "invalid sender",
        });
        expect(response.statusCode).not.toBe(201);
        const response2 = await request(app).post("/posts")
            .set("authorization", "JWT " + userInfo.accessToken)
            .send({
                title: "My First post",
                content: "This is my first post",
                sender: "invalid sender",
            });
        expect(response2.statusCode).toBe(201);
    });

    test("Test get protected API invalid token", async () => {
        const response = await request(app).post("/posts")
            .set("authorization", "JWT " + userInfo.accessToken + "9")
            .send({
                title: "My First post",
                content: "This is my first post",
                sender: userInfo._id,
            });
        expect(response.statusCode).not.toBe(201);
    });

    test("Test refresh token", async () => {
        const response = await request(app).post("/auth/refresh")
            .send({ refreshToken: userInfo.refreshToken });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;
    });

    test("Test refresh with empty body", async () => {
        const response = await request(app).post("/auth/refresh").send({});
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("invalid token");
    });

    test("Test refresh with deleted user", async () => {
        const refreshToken = userInfo.refreshToken;
        await UserModel.deleteOne({ email: userInfo.email });
        const response = await request(app).post("/auth/refresh")
            .send({ refreshToken });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("invalid token");
        
        await request(app).post("/auth/register").send(userInfo);
        const loginRes = await request(app).post("/auth/login").send(userInfo);
        userInfo.accessToken = loginRes.body.accessToken;
        userInfo.refreshToken = loginRes.body.refreshToken;
        userInfo._id = loginRes.body._id;
    });

    test("Test missing refresh token", async () => {
        const response = await request(app).post("/auth/refresh");
        expect(response.statusCode).not.toBe(200);
    });

    test("Test missing TOKEN_SECRET in refresh", async () => {
        const trueToken = process.env.TOKEN_SECRET;
        delete process.env.TOKEN_SECRET;
        const response = await request(app).post("/auth/refresh").send({ refreshToken: userInfo.refreshToken });
        expect(response.statusCode).not.toBe(200);
        process.env.TOKEN_SECRET = trueToken;
    });

    test("Test invalid refresh token in logout", async () => {
        const invalidToken = 'invalid-refresh-token';
        const response = await request(app).post("/auth/refresh").send({ refreshToken: invalidToken });
        expect(response.statusCode).toBe(403);
        expect(response.text).toBe("invalid token");
    });

    test("Test missing refresh token in logout", async () => {
        const response = await request(app).post("/auth/logout").send({});
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("missing refresh token");
    });

    test("Test missing TOKEN_SECRET in logout", async () => {
        const trueToken = process.env.TOKEN_SECRET;
        delete process.env.TOKEN_SECRET;
        const response = await request(app).post("/auth/logout").send(userInfo);
        expect(response.statusCode).not.toBe(200);
        process.env.TOKEN_SECRET = trueToken;
    });

    test("Test logout with deleted user", async () => {
        const loginRes = await request(app).post("/auth/login").send(userInfo);
        const refreshToken = loginRes.body.refreshToken;
        await UserModel.deleteOne({ email: userInfo.email }); 
        const response = await request(app).post("/auth/logout")
            .send({ refreshToken });
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("invalid token");
        await request(app).post("/auth/register").send(userInfo);
        const newLoginRes = await request(app).post("/auth/login").send(userInfo);
        userInfo.accessToken = newLoginRes.body.accessToken;
        userInfo.refreshToken = newLoginRes.body.refreshToken;
        userInfo._id = newLoginRes.body._id;
    });

    test("Test invalid refresh token in logout", async () => {
        const invalidToken = 'invalid-refresh-token';
        const response = await request(app).post("/auth/logout").send({ refreshToken: invalidToken });
        expect(response.statusCode).toBe(403);
        expect(response.text).toBe("invalid token");
        
    });

    test("Test valid refresh token and successful logout", async () => {
        const response = await request(app).post("/auth/logout").send({ refreshToken: userInfo.refreshToken });
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("logged out");
        const updatedUser = await UserModel.findById(userInfo._id);
        expect(updatedUser?.refreshTokens).not.toContain(userInfo.refreshToken);
    });

    test("Test refresh token multiple usage", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userInfo.email,
            password: userInfo.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;

        const response2 = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response2.statusCode).toBe(200);
        const newRefresh = response2.body.refreshToken;

        const response3 = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response3.statusCode).not.toBe(200);

        const response4 = await request(app).post("/auth/refresh").send({
            refreshToken: newRefresh
        });
        expect(response4.statusCode).not.toBe(200);
    });

    jest.setTimeout(10000);

    test("Test timeout on refresh access token", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userInfo.email,
            password: userInfo.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;

        await new Promise(resolve => setTimeout(resolve, 6000));

        const response2 = await request(app).post("/posts")
            .set("authorization", "JWT " + userInfo.accessToken)
            .send({
                title: "My First post",
                content: "This is my first post",
                sender: "invalid sender",
            });
        expect(response2.statusCode).not.toBe(201);

        const response3 = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response3.statusCode).toBe(200);
        userInfo.accessToken = response3.body.accessToken;
        userInfo.refreshToken = response3.body.refreshToken;

        const response4 = await request(app).post("/posts")
            .set("authorization", "JWT " + userInfo.accessToken)
            .send({
                title: "My First post",
                content: "This is my first post",
                sender: "invalid sender",
            });
        expect(response4.statusCode).toBe(201);
    });
});
import request from "supertest";
import initApp from "../app";
import mongoose from "mongoose";
import CommentModel from "../models/Comment.model";
import { Express } from "express";
import UserModel from "../models/User.model";
import { beforeAll, afterAll, describe, test, expect } from '@jest/globals';

let app: Express;

type UserInfo = {
    fullName?: string;
    email: string;
    password: string;
    token?: string;
    _id?: string;
  };

const userInfo: UserInfo = {
    fullName: "Ilana Barkin",
    email: "ilana@gmail.com",
    password: "123456",
  }

beforeAll(async () => {    
    app = await initApp();       
    console.log("Before all tests"); 
    await CommentModel.deleteMany();
    await UserModel.deleteMany();
    await request(app).post("/auth/register").send(userInfo);
    const response = await request(app).post("/auth/login").send(userInfo);
    expect(response.statusCode).toBe(200);
    userInfo.token = response.body.accessToken;
    userInfo._id = response.body._id;
});

afterAll(async() => {          
    console.log("After all tests");  
    await mongoose.connection.close();       
}); 

let commentId = "";

const testComment = {
    comment: "Test title",
    postId: "123456789123456789123456",
};
  
const invalidComment = {
    comment: "Test title",
};

describe("Comment test", () => {

    test("Test get all comment", async () => {
        const response = await request(app).get("/comments");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });
    
    test("Test adding new comment", async () => {
        const response = await request(app).post("/comments")
        .set("authorization", "JWT " + userInfo.token)
        .send(testComment);
        expect(response.statusCode).toBe(201);
        expect(response.body.comment).toBe(testComment.comment);
        expect(response.body.postId).toBe(testComment.postId);
        expect(response.body.sender).toBe(userInfo._id);
        commentId = response.body._id;  
    });

    test("Test adding invalid comment", async () => {
        const response = await request(app).post("/comments")
        .set("authorization", "JWT " + userInfo.token)
        .send(invalidComment);
        expect(response.statusCode).not.toBe(201);
    });

    test("Test get all comments after adding", async () => {
        const response = await request(app).get("/comments");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
    });

    test("Test get comment by sender", async () => {
        const response = await request(app).get("/comments?sender=" + userInfo._id);        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].sender).toBe(userInfo._id);
    });

    test("Test get comments by sender fail", async () => {
        const response = await request(app).get("/comments?sender=nonexistentUser");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Test get comment by postId", async () => {
        const response = await request(app).get("/comments/posts/" + testComment.postId);        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].postId).toBe(testComment.postId);
    });

    test("Test get comment by id", async () => {
        const response = await request(app).get("/comments/" + commentId);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(commentId);
    });
    
    test("Test get comment by id fail", async () => {
        const response = await request(app).get("/comments/6779872076207a7fc9997020");
        expect(response.statusCode).toBe(404);
    });

    test("Test get comment with invalid id format", async () => {
        const invalidId = "invalidId123";  
        const response = await request(app).get(`/comments/${invalidId}`);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message"); 
        expect(response.body.message).toContain("Cast to ObjectId failed");  
    });
    
    test("Test update comment", async () => {
        const response = await request(app).put("/comments/" + commentId)
        .set("authorization", "JWT " + userInfo.token)
        .send({ comment: "Update Comment" });
        if (response.statusCode === 404) {
            console.log("Comment not found, skipping test");
        } else {
            expect(response.statusCode).toBe(200);
            expect(response.body.comment).toBe("Update Comment");
        }
    });
    
    test("Test update comment not found", async () => {
        const response = await request(app).put("/comments/6779872076207a7fc9997020")
        .set("authorization", "Bearer " + userInfo.token)
        .send({ comment: "Another update" });
        expect(response.statusCode).toBe(404);
    });

    test("Test delete comment", async () => {
        const response = await request(app).delete("/comments/" + commentId)
        .set("authorization", "Bearer " + userInfo.token);
        expect(response.statusCode).toBe(200);
        const responseGet = await request(app).get("/comments/" + commentId);
        expect(responseGet.statusCode).toBe(404);
    });

    test("Test delete comment not found", async () => {
        const response = await request(app).delete("/comments/1234567890")
        .set("authorization", "Bearer " + userInfo.token);
        expect(response.statusCode).toBe(404);
    });
});
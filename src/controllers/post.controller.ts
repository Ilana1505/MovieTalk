import PostModel, { iPost } from "../models/Post.model";
import { Request, Response } from "express";
import BaseController from "./base.controller";

class PostController extends BaseController<iPost> {
    constructor() {
        super(PostModel);
    }

    async CreateItem(req: Request, res: Response) {
        try {
            const user = (req as any).user;

            if (!user || !user._id) {
                res.status(403).json({ message: "Unauthorized: missing user ID" });
                return;
            }

            console.log("USER FROM TOKEN:", user);

            const post: iPost = {
                title: req.body.title,
                content: req.body.content,
                sender: user._id
            };
            const created = await this.model.create(post);
            res.status(201).send(created);
            return;
        } catch (error) {
            console.error("Failed to create post:", error);
            res.status(400).json({ message: "Failed to create post", error });
            return;
        }
    }
}

export default new PostController();

import PostModel, { iPost } from "../models/Post.model";
import { Request, Response } from "express";
import BaseController from "./base.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";

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

            const imagePath = req.file ? `/uploads/posts/${req.file.filename}` : undefined;

            
            const post: Partial<iPost> = {
              title: req.body.title,
              description: req.body.description,
              review: req.body.review,
              image: imagePath,
              sender: new mongoose.Types.ObjectId(user._id),
              likes: [],
              comments: []
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

    // הוספת לייק
async toggleLike(req: Request, res: Response) {
  const userId = (req as any).user._id;
  const postId = req.params.id;

  try {
    const post = await this.model.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!Array.isArray(post.likes)) post.likes = [];

    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();
      return res.status(200).json({ message: "Like removed", likes: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();
      return res.status(200).json({ message: "Post liked", likes: post.likes.length });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}


}

export const getUserPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const posts = await PostModel.find({
      sender: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};


export default new PostController();

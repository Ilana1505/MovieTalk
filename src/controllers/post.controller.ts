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

            const imagePath = req.file ? `/uploads/posts/${req.file.filename}` : undefined;

            
            const post: iPost = {
              title: req.body.title,
             description: req.body.description,
             review: req.body.review,
             image: imagePath,
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

    // הוספת לייק
async toggleLike(req: Request, res: Response) {
  const userId = (req as any).user._id;
  const postId = req.params.id;

  const post = await this.model.findById(postId);
  if (!post) return res.status(404).json({ message: "Post not found" });

  // Ensure likes is always an array
  if (!Array.isArray(post.likes)) {
    post.likes = [];
  }

  const alreadyLiked = post.likes.includes(userId);
  post.likes = alreadyLiked
    ? post.likes.filter((id: string) => id !== userId)
    : [...post.likes, userId];

  await post.save();
  res.status(200).json(post);
}

}

export default new PostController();

import PostModel, { iPost } from "../models/Post.model";
import { Request, Response } from "express";
import BaseController from "./base.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";

class PostController extends BaseController<iPost> {
  constructor() {
    super(PostModel);
  }

  async GetAll(req: Request, res: Response) {
    try {
      const sender = req.query.sender;
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit as string) || 5, 1);
      const skip = (page - 1) * limit;

      const filter: Record<string, string | undefined> = {};

      if (typeof sender === "string" && sender.trim()) {
        filter.sender = sender;
      }

      const [posts, total] = await Promise.all([
        this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        this.model.countDocuments(filter),
      ]);

      res.status(200).json({
        posts,
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
      });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      res.status(400).json({ message: "Failed to fetch posts", error });
    }
  }

  async CreateItem(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;

      if (!user || !user._id) {
        res.status(401).json({ message: "No valid token provided" });
        return;
      }

      const { title, description, review } = req.body;

      if (!title || !description || !review) {
        res.status(400).json({
          message: "Missing required fields: title, description, review",
        });
        return;
      }

      const imagePath = req.file
        ? `/uploads/posts/${req.file.filename}`
        : undefined;

      const post: Partial<iPost> = {
        title,
        description,
        review,
        image: imagePath,
        sender: new mongoose.Types.ObjectId(user._id),
        likes: [],
        comments: [],
      };

      const created = await this.model.create(post);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create post:", error);
      res.status(400).json({ message: "Failed to create post", error });
    }
  }

  async GetById(req: Request, res: Response) {
    try {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).send("Invalid ID");
      }

      const post = await this.model.findById(id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json(post);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      return res.status(500).json({ message: "Failed to fetch post" });
    }
  }

  async toggleLike(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?._id;
      const postId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "No valid token provided" });
      }

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(404).json({ message: "Post not found" });
      }

      const post = await this.model.findById(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const alreadyLiked = await this.model.findOne({
        _id: postId,
        likes: userId,
      });

      if (alreadyLiked) {
        await this.model.findByIdAndUpdate(postId, {
          $pull: { likes: userId },
        });

        const updated = await this.model.findById(postId);

        return res.status(200).json({
          message: "Like removed",
          likes: updated?.likes.length || 0,
        });
      }

      await this.model.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId },
      });

      const updated = await this.model.findById(postId);

      return res.status(200).json({
        message: "Post liked",
        likes: updated?.likes.length || 0,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      return res.status(500).json({ message: "Server error", error });
    }
  }

  async updateOwnPost(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const userId = String(req.user._id);

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(404).json({ message: "Post not found" });
      }

      const post = await this.model.findById(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (String(post.sender) !== userId) {
        return res
          .status(403)
          .json({ message: "You can edit only your own posts" });
      }

      const removeImage = req.body.removeImage === "true";
      const newImagePath = req.file
        ? `/uploads/posts/${req.file.filename}`
        : null;

      if (req.body.title !== undefined) post.title = req.body.title;
      if (req.body.description !== undefined) post.description = req.body.description;
      if (req.body.review !== undefined) post.review = req.body.review;

      if (removeImage) post.image = "";
      if (newImagePath) post.image = newImagePath;

      await post.save();
      return res.status(200).json(post);
    } catch (error) {
      console.error("Failed to update post:", error);
      return res.status(500).json({ message: "Failed to update post" });
    }
  }

  async deleteOwnPost(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;
      const userId = String(req.user._id);

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(404).json({ message: "Post not found" });
      }

      const post = await this.model.findById(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (String(post.sender) !== userId) {
        return res
          .status(403)
          .json({ message: "You can delete only your own posts" });
      }

      await this.model.findByIdAndDelete(postId);

      return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Failed to delete post:", error);
      return res.status(500).json({ message: "Failed to delete post" });
    }
  }
}

export const getUserPosts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = String(req.user._id);

    const posts = await PostModel.find({
      sender: userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (err) {
    console.error("Failed to fetch user posts:", err);
    return res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

export default new PostController();
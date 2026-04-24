import CommentModel, { iComment } from "../models/Comment.model";
import UserModel from "../models/User.model";
import { Request, Response } from "express";
import BaseController from "./base.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";

class CommentController extends BaseController<iComment> {
  constructor() {
    super(CommentModel);
  }

  async CreateItem(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user || {};
      const userId = (user && '_id' in user ? user._id : null) || (user && 'id' in user ? user.id : null);

      if (!userId) {
        res.status(401).json({ message: "No valid token provided" });
        return;
      }

      const postId = req.body.postId;
      const commentText = req.body.comment;

      if (!postId || !commentText) {
        res.status(400).json({ message: "Missing comment or postId" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({ message: "Invalid postId" });
        return;
      }

      const userHasDetails = user && 'fullName' in user && 'profilePicture' in user;
      const fromDb = !userHasDetails
          ? await UserModel.findById(userId)
              .select("fullName profilePicture")
              .lean() as { fullName?: string; profilePicture?: string } | null
          : null;

      const senderName = (user && 'fullName' in user ? user.fullName : null) || fromDb?.fullName || "Anonymous";
      const senderAvatar = (user && 'profilePicture' in user ? user.profilePicture : null) || fromDb?.profilePicture || "";

      const createdComment = await CommentModel.create({
        comment: commentText,
        postId,
        sender: senderName,
        senderAvatar,
        senderId: String(userId),
      });

      res.status(201).json(createdComment);
    } catch (e) {
      console.error("Failed to add comment:", e);
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
}

export default new CommentController();
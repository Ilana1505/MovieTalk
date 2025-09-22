import CommentModel, { iComment } from "../models/Comment.model";
import UserModel from "../models/User.model";
import { Request, Response } from "express";
import BaseController from "./base.controller";

class CommentController extends BaseController<iComment> {
  constructor() {
    super(CommentModel);
  }

  async CreateItem(req: Request, res: Response): Promise<void> {
    try {
      const u = (req as any).user || {};
      const userId = u._id || u.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const fromDb =
        !u.fullName || !u.profilePicture
          ? await UserModel.findById(userId)
              .select("fullName profilePicture")
              .lean()
          : null;

      const senderName =
        u.fullName || fromDb?.fullName || "Anonymous";

      const senderAvatar =
        u.profilePicture || fromDb?.profilePicture || undefined;

      req.body = {
        ...req.body,
        sender: senderName,          
        senderAvatar,                 
        senderId: String(userId),     
      };

      await super.CreateItem(req, res);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
}

export default new CommentController();

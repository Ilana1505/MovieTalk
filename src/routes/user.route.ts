import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";
import UserModel from "../models/User.model";

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads/profile-pictures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadProfilePictureResponse:
 *       type: object
 *       properties:
 *         profilePicture:
 *           type: string
 *           example: "/uploads/profile-pictures/profile-1742820000000.jpg"
 *
 *     DeleteUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User deleted successfully"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Server error"
 *         error:
 *           type: string
 *           example: "Failed to upload profile picture"
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /users/upload-profile-pic:
 *   post:
 *     summary: Upload profile picture
 *     description: Uploads a new profile picture for the logged-in user
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: No image uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to upload profile picture
 */
router.post(
  "/upload-profile-pic",
  upload.single("image"),
  authMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user._id;

      if (!req.file) {
        res.status(400).json({ error: "No image uploaded" });
        return;
      }

      const imageUrl = `/uploads/profile-pictures/${req.file.filename}`;

      await UserModel.findByIdAndUpdate(userId, {
        profilePicture: imageUrl,
      });

      res.status(200).json({ profilePicture: imageUrl });
    } catch {
      res
        .status(500)
        .json({ error: "Failed to upload profile picture" });
    }
  }
);

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Delete user account
 *     description: Deletes the logged-in user's account
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete account
 */
router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user._id;

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
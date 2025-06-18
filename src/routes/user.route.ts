import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth.middleware";
import UserModel from "../models/User.model"; // ודא שזה הנתיב הנכון

const router = express.Router();

// יצירת התיקייה אם לא קיימת
const uploadDir = path.join(__dirname, "../../uploads/profile-pictures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// הנתיב להעלאת התמונה
router.post(
  "/upload-profile-pic",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = (req as any).user._id;
      const imageUrl = `/uploads/profile-pictures/${req.file?.filename}`;
      await UserModel.findByIdAndUpdate(userId, { profilePicture: imageUrl });
      res.status(200).json({ profilePicture: imageUrl });
    } catch (err) {
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

export default router;

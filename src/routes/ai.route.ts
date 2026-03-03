import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { generateDescription, freeSearchPosts } from "../controllers/ai.controller";

console.log("✅ AI ROUTE FILE LOADED (TS)");

const router = express.Router();

router.post("/generate-description", authMiddleware, generateDescription);
router.post("/free-search", authMiddleware, freeSearchPosts);

export default router;
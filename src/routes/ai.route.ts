import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  generateDescription,
  freeSearchPosts,
} from "../controllers/ai.controller";

console.log(" AI ROUTE FILE LOADED (TS)");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered endpoints for movie descriptions and smart search
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateDescriptionRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           example: "Inception"
 *
 *     GenerateDescriptionResponse:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           example: "A skilled thief enters people's dreams to steal secrets, but his latest mission may change everything. A mind-bending sci-fi thriller with high stakes and emotional depth."
 *
 *     FreeSearchRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           example: "dreams and mind bending thriller"
 *
 *     AISearchInfo:
 *       type: object
 *       properties:
 *         mode:
 *           type: string
 *           example: "combined"
 *         regexCount:
 *           type: integer
 *           example: 2
 *         pickedIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["67d123abc456def789000111", "67d123abc456def789000222"]
 *
 *     FreeSearchResponse:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Post'
 *         ai:
 *           $ref: '#/components/schemas/AISearchInfo'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "AI service failed"
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
 * /ai/generate-description:
 *   post:
 *     summary: Generate a movie description using AI
 *     description: Generates a short spoiler-free movie description based on a movie title.
 *     security:
 *       - bearerAuth: []
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateDescriptionRequest'
 *     responses:
 *       200:
 *         description: Description generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateDescriptionResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: AI quota or rate limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Missing API key or AI service failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: AI service temporarily unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/generate-description", authMiddleware, generateDescription);

/**
 * @swagger
 * /ai/free-search:
 *   post:
 *     summary: Search posts using AI and keyword matching
 *     description: Returns posts matching the user's query using both regular regex matching and AI semantic matching.
 *     security:
 *       - bearerAuth: []
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FreeSearchRequest'
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FreeSearchResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: AI quota or rate limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Missing API key or AI search failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: AI service temporarily unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/free-search", authMiddleware, freeSearchPosts);

export default router;
import express from "express";
import PostController from "../controllers/post.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getUserPosts } from "../controllers/post.controller";

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads/posts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Posts API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         review:
 *           type: string
 *         image:
 *           type: string
 *         sender:
 *           type: string
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *
 *     PaginatedPostsResponse:
 *       type: object
 *       properties:
 *         posts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Post'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         hasMore:
 *           type: boolean
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
 * /posts:
 *   post:
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               review:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Failed to create post
 */
router.post("/", authMiddleware, upload.single("image"),
  PostController.CreateItem.bind(PostController)
);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get posts with pagination
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPostsResponse'
 */
router.get("/", async (req, res) => {
  await PostController.GetAll(req, res);
});

/**
 * @swagger
 * /posts/my-posts:
 *   get:
 *     summary: Get current user's posts
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of user's posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 */
router.get("/my-posts", authMiddleware, (req, res) => {
  getUserPosts(req as any, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: Post found
 *       404:
 *         description: Post not found
 */
router.get("/:id", (req, res) => {
  PostController.GetById(req, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update post
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 */
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  await PostController.updateOwnPost(req as any, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete post
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  await PostController.deleteOwnPost(req as any, res);
});

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Toggle like on post
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: integer
 *       404:
 *         description: Post not found
 */
router.post("/:id/like", authMiddleware, (req, res) => {
  PostController.toggleLike(req, res);
});

export default router;
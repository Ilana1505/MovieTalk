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
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
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
 *   description: The Posts API
 */

/**
 * @swagger
 * components:
 *   schemas:
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
 *       example:
 *         _id: "987654321987654321987654"
 *         title: "Inception"
 *         description: "A sci-fi thriller about dream invasion"
 *         review: "Amazing movie with a brilliant concept"
 *         image: "/uploads/posts/post-123.jpg"
 *         sender: "987654321987654321987650"
 *         likes: []
 */

/**
 * @swagger
 * components:
 *   schemas:
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
 *       example:
 *         posts: []
 *         page: 1
 *         limit: 5
 *         total: 12
 *         hasMore: true
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
 *     summary: Creates a new movie post
 *     description: Creates a new post with a title, description, review, and optional image.
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
 *                 example: "Inception"
 *               description:
 *                 type: string
 *                 example: "A sci-fi thriller about dream invasion"
 *               review:
 *                 type: string
 *                 example: "Brilliant direction and concept"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created post
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  PostController.CreateItem.bind(PostController)
);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get posts with paging
 *     description: Get posts in a paginated way. Supports optional sender filter.
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: sender
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter posts by sender
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 5
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Paginated posts response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPostsResponse'
 *       400:
 *         description: Invalid query parameters
 */
router.get("/", async (req, res) => {
  await PostController.GetAll(req, res);
});

router.get("/my-posts", authMiddleware, (req, res) => {
  return getUserPosts(req as any, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     description: Get a specific post by its unique ID.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The post data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       400:
 *         description: Invalid ID format
 */
router.get("/:id", (req, res) => {
  PostController.GetById(req, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     description: Updates the content of an existing post only if it belongs to the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post to update
 *         schema:
 *           type: string
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
 *               removeImage:
 *                 type: string
 *                 example: "true"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: The updated post
 *       403:
 *         description: You can edit only your own posts
 *       404:
 *         description: Post not found
 *       400:
 *         description: Invalid input
 */
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  await PostController.updateOwnPost(req as any, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     description: Deletes a post only if it belongs to the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: You can delete only your own posts
 *       404:
 *         description: Post not found
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  await PostController.deleteOwnPost(req as any, res);
});

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Adds or removes a like from the logged-in user on a post.
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
 *         description: Like toggled successfully
 *       404:
 *         description: Post not found
 */
router.post("/:id/like", authMiddleware, (req, res) => {
  PostController.toggleLike(req, res);
});

export default router;
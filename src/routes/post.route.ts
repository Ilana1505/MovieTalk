import express from 'express';
import PostController from '../controllers/post.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

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
 *           description: The unique identifier of the post
 *         title:
 *           type: string
 *           description: The title of the post
 *         content:
 *           type: string
 *           description: The content of the post
 *         sender:
 *           type: string
 *           description: The sender's identifier
 *       example:
 *         _id: "987654321987654321987654"
 *         title: "Test Post"
 *         content: "This is a test post content"
 *         sender: "DANA"
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
 *     summary: Creates a new post
 *     description: Creates a new post with a title and content.
 *     security:
 *       - bearerAuth: []  
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string  
 *                 description: The post title
 *                 example: "My first post"         
 *               content:
 *                 type: string
 *                 description: The post content
 *                 example: "This is my first post ....."
 *     responses:
 *       201:
 *         description: The created post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Missing or incorrect input
 */
router.post('/', authMiddleware, PostController.CreateItem.bind(PostController));

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     description: Get a list of all posts. Optionally, filter by sender.
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: sender
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter posts by sender
 *     responses:
 *       200:
 *         description: A list of posts matching the filter (if provided)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', PostController.GetAll.bind(PostController));

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
router.get('/:id', (req, res) => {
  PostController.GetById(req, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     description: Updates the content of an existing post.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The updated title of the post
 *               content:
 *                 type: string
 *                 description: The updated content of the post
 *             required:
 *               - title
 *               - content
 *     responses:
 *       200:
 *         description: The updated post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    await PostController.UpdateItem(req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     description: Deletes a post from the system by its unique ID.
 *     security:
 *       - bearerAuth: []  
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted the post
 *       404:
 *         description: Post not found
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await PostController.DeleteItem(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
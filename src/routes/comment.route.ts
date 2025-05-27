import express from 'express';
import CommentController from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the comment
 *         comment:
 *           type: string
 *           description: The text of the comment
 *         postId:
 *           type: string
 *           description: The ID of the post the comment belongs to
 *         sender:
 *           type: string
 *           description: The sender's identifier
 *       example:
 *         _id: "123456789123456789123456"
 *         comment: "This is a test comment on the post"
 *         postId: "987654321987654321987654"
 *         sender: "DANA123"
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
 * /comments:
 *   post:
 *     summary: Creates a new comment
 *     description: Creates a new comment for a post.
 *     security:
 *       - bearerAuth: []  
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *               postId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing or incorrect input
 */
router.post('/', authMiddleware, CommentController.CreateItem.bind(CommentController));

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     description: Get a list of all comments. Optionally, filter by sender.
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: sender
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter comments by sender
 *     responses:
 *       200:
 *         description: A list of comments matching the filter (if provided)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', CommentController.GetAll.bind(CommentController));

/**
 * @swagger
 * /comments/posts/{postId}:
 *   get:
 *     summary: Get all comments for a specific post
 *     description: Get a list of all comments associated with a specific post identified by its postId.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post for which comments are to be retrieved
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of comments for the specified post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid postId format
 */
router.get('/posts/:postId', CommentController.GetAll.bind(CommentController));

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     description: Get a specific comment by its unique ID.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the comment to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The comment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       400:
 *         description: Invalid ID format
 */
router.get('/:id', CommentController.GetById.bind(CommentController));

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment by ID
 *     description: Updates the content of an existing comment.
 *     security:
 *       - bearerAuth: []  
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the comment to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: The updated content of the comment
 *             required:
 *               - comment
 *     responses:
 *       200:
 *         description: The updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', authMiddleware, CommentController.UpdateItem.bind(CommentController));

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment by ID
 *     description: Deletes a comment from the system by its unique ID.
 *     security:
 *       - bearerAuth: []  
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the comment to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted the comment
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', authMiddleware, CommentController.DeleteItem.bind(CommentController));

export default router;
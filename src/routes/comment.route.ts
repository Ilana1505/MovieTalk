import express from "express";
import CommentController from "../controllers/comment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import CommentModel from "../models/Comment.model";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments API
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
 *           example: "67d123abc456def789000111"
 *         comment:
 *           type: string
 *           example: "Amazing movie!"
 *         postId:
 *           type: string
 *           example: "67d123abc456def789000222"
 *         sender:
 *           type: string
 *           example: "Ilana Barkin"
 *         senderAvatar:
 *           type: string
 *           example: "/uploads/profile-pictures/profile-123.jpg"
 *         senderId:
 *           type: string
 *           example: "67d123abc456def789000333"
 *         createdAt:
 *           type: string
 *           example: "2026-03-24T12:30:00.000Z"
 *
 *     CreateCommentRequest:
 *       type: object
 *       required:
 *         - comment
 *         - postId
 *       properties:
 *         comment:
 *           type: string
 *           example: "This review made me want to watch it"
 *         postId:
 *           type: string
 *           example: "67d123abc456def789000222"
 *
 *     UpdateCommentRequest:
 *       type: object
 *       required:
 *         - comment
 *       properties:
 *         comment:
 *           type: string
 *           example: "Updated comment text"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Failed to fetch comments"
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
 *     summary: Create a new comment
 *     description: Creates a new comment on a post by the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing or invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to add comment
 */
router.post("/", authMiddleware, CommentController.CreateItem.bind(CommentController));

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     description: Returns all comments. Can optionally be filtered by sender.
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: sender
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter comments by sender name
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid query parameters
 */
router.get("/", CommentController.GetAll.bind(CommentController));

/**
 * @swagger
 * /comments/post/{postId}:
 *   get:
 *     summary: Get comments for a specific post
 *     description: Retrieves all comments associated with a specific post.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments for the given post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Failed to fetch comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await CommentModel.find({ postId: req.params.postId });
    res.status(200).json(comments);
  } catch {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     description: Retrieves a specific comment by its unique ID.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the comment
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       400:
 *         description: Invalid ID format
 */
router.get("/:id", async (req, res, next) => {
  try {
    await CommentController.GetById.call(CommentController, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment by ID
 *     description: Updates an existing comment.
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
 *             $ref: '#/components/schemas/UpdateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    await CommentController.UpdateItem.call(CommentController, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment by ID
 *     description: Deletes a comment from the system.
 *     security:
 *       - bearerAuth: []
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the comment to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await CommentController.DeleteItem.call(CommentController, req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
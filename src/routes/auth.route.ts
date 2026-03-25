import express, { Request, Response } from "express";
import AuthController from "../controllers/auth.controller";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";
import {
  updateUserProfile,
  getUserProfile,
} from "../controllers/user.controller";
import bcrypt from "bcryptjs";
import UserModel from "../models/User.model";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         email:
 *           type: string
 *           example: "user@gmail.com"
 *         password:
 *           type: string
 *           example: "123456"
 *         fullName:
 *           type: string
 *           example: "Ilana Barkin"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "user@gmail.com"
 *         password:
 *           type: string
 *           example: "123456"
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "67d123abc456def789000111"
 *         email:
 *           type: string
 *           example: "user@gmail.com"
 *         fullName:
 *           type: string
 *           example: "Ilana Barkin"
 *         profilePicture:
 *           type: string
 *           example: "/uploads/profile-pictures/profile-123.jpg"
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     RefreshRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     GoogleLoginRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           example: "google-id-token"
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           example: "Ilana Barkin"
 *         email:
 *           type: string
 *           example: "user@gmail.com"
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           example: "123456"
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Password updated successfully"
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
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Invalid input or email already exists
 */
router.post("/register", (req: Request, res: Response, next) => {
  AuthController.Register(req, res).catch(next);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Wrong email or password
 */
router.post("/login", (req: Request, res: Response, next) => {
  AuthController.Login(req, res).catch(next);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Missing refresh token
 *       403:
 *         description: Invalid token
 */
router.post("/logout", (req: Request, res: Response, next) => {
  AuthController.Logout(req, res).catch(next);
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid token
 *       403:
 *         description: Invalid token
 */
router.post("/refresh", (req: Request, res: Response, next) => {
  AuthController.Refresh(req, res).catch(next);
});

/**
 * @swagger
 * /auth/login-with-google:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing or invalid Google token
 *       500:
 *         description: Google login failed
 */
router.post("/login-with-google", (req: Request, res: Response) => {
  AuthController.LoginWithGoogle(req, res);
});

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/update-profile", authMiddleware, (req: Request, res: Response, next) => {
  updateUserProfile(req, res).catch(next);
});

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/check", authMiddleware, (req: Request, res: Response, next) => {
  getUserProfile(req as AuthenticatedRequest, res).catch(next);
});

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Password too short or invalid
 *       401:
 *         description: Unauthorized
 */
router.put("/change-password", authMiddleware, (req: Request, res: Response, next) => {
  (async () => {
    try {
      const { password } = req.body;
      const userId = (req as any).user._id;

      if (!password || password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });

      res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("Change password error", err);
      next(err);
    }
  })();
});

export default router;
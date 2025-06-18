import express, { Request, Response } from 'express';
import AuthController from '../controllers/auth.controller';
import { authMiddleware } from "../middleware/auth.middleware";
import { updateUserProfile } from "../controllers/user.controller";
import { getUserProfile } from "../controllers/user.controller"; // כבר הוספת updateUserProfile
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import bcrypt from "bcryptjs";
import UserModel from "../models/User.model"; // ודא שיש לך מודל משתמש

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The Authentication API
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
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *       example:
 *         email: "user@gmail.com"
 *         password: "123456"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Registration success, return the new user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post("/register", (req: Request, res: Response, next) => {
  AuthController.Register(req, res).catch(next);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user and return access and refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Successfully login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                   example: "60d0fe4f5311236168a109ca"
 *       '400':
 *         description: Invalid email or password
 */
router.post("/login", (req: Request, res: Response, next) => {
  AuthController.Login(req, res).catch(next);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       400:
 *         description: Missing refresh token
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post("/logout", (req: Request, res: Response, next) => {
  AuthController.Logout(req, res).catch(next);
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refresh the access token using the refresh token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Successfully refreshed access and refresh tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired refresh token
 *       403:
 *         description: Missing or invalid refresh token
 */
router.post("/refresh", (req: Request, res: Response, next) => {
  AuthController.Refresh(req, res).catch(next);
});

/**
 * @swagger
 * /auth/login-with-google:
 *   post:
 *     summary: Login or register a user with Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google OAuth ID token
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjJh..."
 *     responses:
 *       200:
 *         description: Successfully authenticated with Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
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
 *     summary: Update user profile (name/email)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
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

router.get("/check", authMiddleware, (req: Request, res: Response, next) => {
  getUserProfile(req as AuthenticatedRequest, res).catch(next);
});

router.put("/change-password", authMiddleware, (req: Request, res: Response, next) => {
  (async () => {
    try {
      const { password } = req.body;
      const userId = (req as any).user._id;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
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
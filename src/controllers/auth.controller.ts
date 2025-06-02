import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import UserModel from '../models/User.model';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

type TokenPayload = {
    _id: string;
};

const GenerateTokens = (_id: string): { accessToken: string; refreshToken: string } => {
  const random = Math.floor(Math.random() * 1000000);

  const secret = process.env.TOKEN_SECRET;
  const accessExpiration = process.env.TOKEN_EXPIRATION;
  const refreshExpiration = process.env.REFRESH_TOKEN_EXPIRATION;

  console.log("GENERATING token with secret:", secret);

  if (!secret || !accessExpiration || !refreshExpiration) {
    throw new Error("Missing auth configuration in environment variables");
  }

  const accessToken = jwt.sign({ _id, random }, secret, {
    expiresIn: accessExpiration,
  } as SignOptions);

  const refreshToken = jwt.sign({ _id, random }, secret, {
    expiresIn: refreshExpiration,
  } as SignOptions);

  return { accessToken, refreshToken };
};

const Register = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).send("Missing full name, email, or password");
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      fullName,
      email,
      password: hashedPassword,
    });

    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Missing email or password");
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send("Wrong email or password");
    }

    if (user.password === "google_oauth") {
      return res
        .status(400)
        .send("This account is registered with Google. Please sign in with Google.");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).send("Wrong email or password");
    }

    const tokens = GenerateTokens(user._id.toString());

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).send({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(400).send(error);
  }
};

const Logout = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send("missing refresh token");
        return;
    }

    if (!process.env.TOKEN_SECRET) {
        res.status(400).send("missing auth configuration");
        return;
    }
    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (error: unknown, data: unknown) => {
        if (error) {
            res.status(403).send("invalid token");
            return;
        }
        const payload = data as TokenPayload;
        try {
            const user = await UserModel.findOne({ _id: payload._id });
            if (!user) {
                res.status(400).send("invalid token");
                return;
            }
            if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                res.status(400).send("invalid token");
                user.refreshTokens = [];
                await user.save();
                return;
            }
            const tokens = user.refreshTokens.filter((token) => token !== refreshToken);
            user.refreshTokens = tokens;
            await user.save();
            res.status(200).send("logged out");
        } catch (error) {
            res.status(400).send(error);
        }
    });
};

const Refresh = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send("invalid token");
        return;
    }
    if (!process.env.TOKEN_SECRET) {
        res.status(400).send("missing auth configuration");
        return;
    }
    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (error: unknown, data: unknown) => {
        if (error) {
            res.status(403).send("invalid token");
            return;
        }

        const payload = data as TokenPayload;
        try {
            const user = await UserModel.findOne({ _id: payload._id });
            if (!user) {
                res.status(400).send("invalid token");
                return;
            }

            if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                user.refreshTokens = [];
                await user.save();
                res.status(400).send("invalid token");
                return;
            }

            const newTokens = GenerateTokens(user._id.toString());
            if (!newTokens) {
                user.refreshTokens = [];
                await user.save();
                res.status(400).send("missing auth configuration");
                return;
            }

            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
            user.refreshTokens.push(newTokens.refreshToken);
            await user.save();

            res.status(200).send({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            });
        } catch (error) {
            res.status(400).send(error);
        }
    });
};

const LoginWithGoogle = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token || !process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).send("Missing Google token or client ID");
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      return res.status(400).send("Invalid Google token");
    }

    let user = await UserModel.findOne({ email: payload.email });
    if (!user) {
      user = await UserModel.create({
        email: payload.email,
        fullName: payload.name,
        password: "google_oauth",
        refreshTokens: [],
      });
    }

    const tokens = GenerateTokens(user._id.toString());

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).send({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).send("Google login failed");
  }
};


export default {
  Register,
  Login,
  Logout,
  Refresh,
  LoginWithGoogle,
};
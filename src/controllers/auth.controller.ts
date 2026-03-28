import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import UserModel from "../models/User.model";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

type TokenPayload = {
  _id: string;
  random?: number;
  iat?: number;
  exp?: number;
};

const GenerateTokens = (
  _id: string
): { accessToken: string; refreshToken: string } => {
  const random = Math.floor(Math.random() * 1000000);

  const secret = process.env.TOKEN_SECRET;
  const accessExpiration = process.env.TOKEN_EXPIRATION;
  const refreshExpiration = process.env.REFRESH_TOKEN_EXPIRATION;

  console.log(" GenerateTokens -> _id:", _id);
  console.log(" TOKEN_SECRET exists?", !!secret);
  console.log(" TOKEN_EXPIRATION:", accessExpiration);
  console.log(" REFRESH_TOKEN_EXPIRATION:", refreshExpiration);

  if (!secret || !accessExpiration || !refreshExpiration) {
    throw new Error("Missing auth configuration in environment variables");
  }

  const accessToken = jwt.sign({ _id, random }, secret, {
    expiresIn: accessExpiration,
  } as SignOptions);

  const refreshToken = jwt.sign({ _id, random }, secret, {
    expiresIn: refreshExpiration,
  } as SignOptions);

  console.log(" accessToken length:", accessToken?.length);
  console.log(" refreshToken length:", refreshToken?.length);

  return { accessToken, refreshToken };
};

const Register = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;

  console.log(" /auth/register called:", {
    email,
    fullName,
    hasPassword: !!password,
  });

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

    console.log(" Registered user id:", user._id);
    return res.status(200).send(user);
  } catch (error) {
    console.error(" Register error:", error);
    return res.status(400).send(error);
  }
};

const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log(" /auth/login called:", { email, hasPassword: !!password });

  if (!email || !password) {
    return res.status(400).send("Missing email or password");
  }

  try {
    const user = await UserModel.findOne({ email });
    console.log(" user found?", !!user);

    if (!user) {
      return res.status(400).send("Wrong email or password");
    }

    if (user.password === "google_oauth") {
      return res
        .status(400)
        .send("This account is registered with Google. Please sign in with Google.");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log(" password valid?", validPassword);

    if (!validPassword) {
      return res.status(400).send("Wrong email or password");
    }

    const tokens = GenerateTokens(user._id.toString());

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokens.refreshToken);
    user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    console.log(
      " Login OK -> returning tokens. refreshTokens count:",
      user.refreshTokens.length
    );

    return res.status(200).send({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error(" Login error:", error);
    return res.status(400).send(error);
  }
};

const Logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  console.log(" /auth/logout called");
  console.log(" refreshToken exists?", !!refreshToken);

  if (!refreshToken || !process.env.TOKEN_SECRET) {
    return res.status(400).send("Missing refresh token or configuration");
  }

  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: Error | null, data: unknown) => {
      console.log("VERIFY RESULT:", { err: err?.message, hasData: !!data });

      if (err) {
        return res.status(403).send("Invalid token");
      }

      const payload = data as TokenPayload;
      console.log(" logout verified payload:", payload);

      const user = await UserModel.findById(payload._id);
      console.log(" logout user found?", !!user);

      if (!user) {
        return res.status(400).send("Invalid token");
      }

      user.refreshTokens = (user.refreshTokens || []).filter(
        (t) => t !== refreshToken
      );
      await user.save();

      console.log(" logout OK. refreshTokens count:", user.refreshTokens.length);

      return res.status(200).send("Logged out");
    }
  );
};

const Refresh = async (req: Request, res: Response) => {
  console.log(" /auth/refresh called");
  console.log(" refreshToken exists?", !!req.body.refreshToken);
  console.log(" refreshToken value:", req.body.refreshToken);

  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(400).send("invalid token");
  }

  if (!process.env.TOKEN_SECRET) {
    return res.status(500).send("missing auth configuration");
  }

  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (error: unknown, data: unknown) => {
      if (error) {
        console.log(" refresh verify FAILED:", error);
        return res.status(403).send("invalid token");
      }

      const payload = data as TokenPayload;
      console.log(" refresh verified payload:", payload);

      try {
        const user = await UserModel.findOne({ _id: payload._id });
        console.log(" refresh user found?", !!user);

        if (!user) {
          return res.status(400).send("invalid token");
        }

        const existsInList = (user.refreshTokens || []).includes(refreshToken);
        console.log(" refreshToken exists in user.refreshTokens?", existsInList);
        console.log(" refreshTokens count:", user.refreshTokens?.length || 0);

        if (!existsInList) {
          user.refreshTokens = [];
          await user.save();
          return res.status(400).send("invalid token");
        }

        const newTokens = GenerateTokens(user._id.toString());

        user.refreshTokens = (user.refreshTokens || []).filter(
          (t) => t !== refreshToken
        );
        user.refreshTokens.push(newTokens.refreshToken);
        user.refreshTokens = user.refreshTokens.slice(-5);
        await user.save();

        console.log(" refresh OK -> returning new tokens");

        return res.status(200).send({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        });
      } catch (err) {
        console.error(" refresh catch error:", err);
        return res.status(500).send("refresh failed");
      }
    }
  );
};

const LoginWithGoogle = async (req: Request, res: Response) => {
  const { token } = req.body;

  console.log(" /auth/login-with-google called");
  console.log(" google token exists?", !!token);

  if (!token || !process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).send("Missing Google token or client ID");
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log(" google payload exists?", !!payload);

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).send("Invalid Google token");
    }

    const email = payload.email;
    const googleId = payload.sub;
    const fullName = payload.name || "";
    const profilePicture = payload.picture || "";

    console.log(" google login -> email:", email);

    let user = await UserModel.findOne({ email });
    console.log("existing user found?", !!user);

    if (!user) {
      user = await UserModel.create({
        email,
        fullName,
        profilePicture,
        googleId,
        password: "google_oauth",
        refreshTokens: [],
      });

      console.log(" created new google user:", user._id);
    } else {
      if (user.password !== "google_oauth" && user.password) {
        return res
          .status(400)
          .send(
            "This email is registered with password. Please login with email & password."
          );
      }

      if (user.googleId && user.googleId !== googleId) {
        return res
          .status(400)
          .send("This email is linked to a different Google account");
      }

      user.googleId = googleId;

      if (fullName) {
        user.fullName = fullName;
      }

      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
      }

      await user.save();
      console.log(" updated existing google user:", user._id);
    }

    const tokens = GenerateTokens(user._id.toString());

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokens.refreshToken);
    user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    console.log(
      " google login OK -> returning tokens. refreshTokens count:",
      user.refreshTokens.length
    );

    return res.status(200).send({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error(" Google login error:", error);
    return res.status(500).send("Google login failed");
  }
};

export default {
  Register,
  Login,
  Logout,
  Refresh,
  LoginWithGoogle,
};
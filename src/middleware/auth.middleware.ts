import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = {
  _id: string;
};

export interface AuthenticatedRequest extends Request {
  user: { _id: string };
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("🔐 authMiddleware:", req.method, req.originalUrl);

  const authHeader = req.headers["authorization"];
  console.log("🔐 authorization raw:", authHeader);

  const token = authHeader?.split(" ")[1];
  console.log("🔐 extracted token:", token);
  console.log("🔐 token length:", token?.length);

  // ✅ מונע Bearer null / Bearer undefined
  if (!token || token === "null" || token === "undefined") {
    res.status(401).json({ message: "No valid token provided" });
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).json({ message: "Missing TOKEN_SECRET" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET) as TokenPayload;
    console.log("✅ DECODED TOKEN:", decoded);

    (req as any).user = { _id: decoded._id };
    next();
  } catch (err) {
    console.error("❌ JWT VERIFY FAILED:", err);
    res.status(403).json({ message: "Invalid token" });
    return;
  }
};
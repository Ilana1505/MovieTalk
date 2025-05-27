import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type TokenPayload = {
  _id: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).json({ message: 'Missing TOKEN_SECRET' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET) as TokenPayload;
    (req as any).user = { _id: decoded._id };
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
    return;
  }
};

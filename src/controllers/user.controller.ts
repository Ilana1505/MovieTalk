import { AuthenticatedRequest } from "../middleware/auth.middleware"; // ודאי שיש
import { Request, Response } from "express";
import UserModel from "../models/User.model";

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user._id).select("-password -refreshToken"); // אל תשלחי סיסמה
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Failed to fetch user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { fullName, email } = req.body;

    // @ts-ignore
    const updated = await UserModel.findByIdAndUpdate(
      // @ts-ignore
      req.user._id,
      { fullName, email },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Failed to update user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

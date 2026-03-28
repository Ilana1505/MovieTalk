import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import UserModel from "../models/User.model";

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "-password -refreshTokens"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { fullName, email } = req.body;

    const updated = await UserModel.findByIdAndUpdate(
      req.user._id,
      { fullName, email },
      { new: true }
    ).select("-password -refreshTokens");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
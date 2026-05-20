import { Response } from "express";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: "client" }).select("-password");
    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "client",
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ message: "Failed to fetch customer" });
  }
};

import { Request, Response } from "express";
import argon2 from "argon2";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth.middleware";

const COOKIE_NAME = "token";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 1000,
};

const signToken = (user: { _id: unknown; role: string }) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" },
  );

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please complete the survey first.",
      });
    }

    if (user.password) {
      return res.status(409).json({
        message: "Password has already been created for this user",
      });
    }

    const hashedPassword = await argon2.hash(password);

    user.password = hashedPassword;
    user.status = "active";

    await user.save();

    res.cookie(COOKIE_NAME, signToken(user), cookieOptions);

    return res.status(200).json({
      message: "Password created successfully. User is now active.",
      user: {
        id: user._id,
        email: user.email,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Signup failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.cookie(COOKIE_NAME, signToken(user), cookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Protected route accessed successfully",
      user: {
        id: user._id,
        email: user.email,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Failed to load user" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ message: "Logged out" });
};

import { Request, Response } from "express";
import argon2 from "argon2";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth.middleware";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Password validation
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      });
    }

    // Find the user that was already created by the survey flow
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please complete the survey first.",
      });
    }

    // Prevent overwriting an existing password
    if (user.password) {
      return res.status(409).json({
        message: "Password has already been created for this user",
      });
    }

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);

    // Add password and activate user
    user.password = hashedPassword;
    user.status = "active";

    await user.save();

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

    // check if user exists
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // verify password
    const isPasswordValid = await argon2.verify(
      user.password,
      password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    // Log the error for debugging/monitoring and return a generic message
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
};

export const logout = async (req: Request, res: Response) => {
  res.json({
    message: "Logout controller works",
  });
};
import { Request, Response } from "express";
import argon2 from "argon2";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth.middleware";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, companyName, contactPerson, phone, password } = req.body;

    // Check required fields
    if (!email || !companyName || !contactPerson || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Password validation
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);

    // Create user
    const user = await User.create({
      email,
      companyName,
      contactPerson,
      phone,
      password: hashedPassword,
      role: "client",
      status: "pending_survey",
    });

    return res.status(201).json({
      message: "User created successfully",
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
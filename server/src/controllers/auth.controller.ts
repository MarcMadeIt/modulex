import { Request, Response } from "express";

export const signup = async (req: Request, res: Response) => {
  res.json({
    message: "Signup controller works",
  });
};

export const login = async (req: Request, res: Response) => {
  res.json({
    message: "Login controller works",
  });
};

export const getMe = async (req: Request, res: Response) => {
  res.json({
    message: "GetMe controller works",
  });
};

export const logout = async (req: Request, res: Response) => {
  res.json({
    message: "Logout controller works",
  });
};
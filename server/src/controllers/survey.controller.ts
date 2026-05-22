import { Request, Response } from "express";
import { User } from "../models/User";
import { SurveyResponse } from "../models/SurveyResponse";

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const { email, companyName, contactPerson, phone, answers } = req.body;
import { SurveyResponse, IAnswer } from "../models/SurveyResponse";

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const { email, phone, answers } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: { message: "Email is already registered" },
      });
    }

    const user = await User.create({
      email,
      companyName,
      contactPerson,
      phone,
      status: "pending_approval",
    });

    await SurveyResponse.create({
      userId: user._id,
      userEmail: user.email,
      answers,
    });
    // The client sends answers as a map { questionId: answer }, but the
    // SurveyResponse schema stores an array of { questionId, answer }.
    const answerList: IAnswer[] = Object.entries(answers ?? {}).map(
      ([questionId, answer]) => ({
        questionId,
        answer: answer as string | string[],
      }),
    );

    try {
      await SurveyResponse.create({
        userId: user._id,
        userEmail: user.email,
        answers: answerList,
      });
    } catch (err) {
      // Don't leave an orphaned user that permanently blocks this email.
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    return res.status(201).json({
      message: "Survey submitted - awaiting approval",
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Survey submit error:", err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
};

export const getResponseByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const response = await SurveyResponse.findOne({ userId });
    if (!response) {
      return res.status(404).json({ error: { message: "Response not found" } });
    }
    return res.json({ response });
  } catch (err) {
    console.error("Get response error:", err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
};

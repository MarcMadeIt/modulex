import { Request, Response } from "express";
import { User } from "../models/User";
import { SurveyResponse, IAnswer } from "../models/SurveyResponse";

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const { companyName, contactPerson, phone, answers } = req.body;
    const email = String(req.body.email ?? "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: { message: "Email is required" } });
    }

    if (!companyName || !contactPerson || !phone) {
      return res
        .status(400)
        .json({ error: { message: "Missing required fields" } });
    }

    const existing = await User.findOne({ email });

    // Allerede registreret (har udfyldt survey før / er aktiv) -> afvis.
    // En forhåndsoprettet lead (pending_survey) må derimod gerne udfylde nu.
    if (existing && existing.status !== "pending_survey") {
      return res.status(409).json({
        error: { message: "Email is already registered" },
      });
    }

    let user;
    if (existing) {
      // Lead udfylder spørgeskemaet -> ryk fra "Igangværende" til "Klar til kursus".
      existing.companyName = companyName;
      existing.contactPerson = contactPerson;
      existing.phone = phone;
      existing.status = "pending_approval";
      user = await existing.save();
    } else {
      user = await User.create({
        email,
        companyName,
        contactPerson,
        phone,
        status: "pending_approval",
      });
    }

    // Convert answers map to array format expected by the schema.
    const answerList: IAnswer[] = Object.entries(answers ?? {}).map(
      ([questionId, answer]) => ({
        questionId,
        answer: answer as string | string[],
      }),
    );

    try {
      // Upsert så en lead kan gen-indsende uden at ramme unikt userId-index.
      await SurveyResponse.findOneAndUpdate(
        { userId: user._id },
        { userEmail: user.email, answers: answerList },
        { upsert: true, setDefaultsOnInsert: true, new: true },
      );
    } catch (err) {
      // Kun ryd op hvis vi lige har oprettet brugeren her.
      if (!existing) {
        await User.deleteOne({ _id: user._id });
      }
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

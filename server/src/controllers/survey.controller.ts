import { Request, Response } from "express";
import { User } from "../models/User";
import { SurveyResponse, IAnswer } from "../models/SurveyResponse";

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const { email, companyName, contactPerson, phone, answers } = req.body;

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ error: { message: "Email is required" } });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });

    // Hvis kunden allerede er aktiveret (har valgt password) skal de ikke
    // kunne overskrive deres profil via survey-formularen.
    if (
      existing &&
      existing.status !== "pending_survey" &&
      existing.status !== "pending_approval"
    ) {
      return res.status(409).json({
        error: { message: "Email is already registered" },
      });
    }

    // Lead-flow: admin har sendt survey-mail -> bruger findes med pending_survey.
    // Vi opdaterer det eksisterende record i stedet for at oprette en duplikat.
    // pending_approval = bruger besvarer surveyen igen før admin har tildelt
    // kurser -> tillad opdatering så de kan rette deres svar.
    const user =
      existing ??
      (await User.create({
        email: cleanEmail,
        companyName,
        contactPerson,
        phone,
        status: "pending_approval",
      }));

    if (existing) {
      user.companyName = companyName ?? user.companyName;
      user.contactPerson = contactPerson ?? user.contactPerson;
      user.phone = phone ?? user.phone;
      user.status = "pending_approval";
      await user.save();
    }

    // Convert answers map to array format expected by the schema.
    const answerList: IAnswer[] = Object.entries(answers ?? {}).map(
      ([questionId, answer]) => ({
        questionId,
        answer: answer as string | string[],
      }),
    );

    try {
      // Upsert: hvis brugeren genindsender surveyen erstattes svarene.
      await SurveyResponse.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userEmail: user.email,
            answers: answerList,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (err) {
      // Hvis brugeren ikke fandtes i forvejen og survey-write fejler,
      // ryd det halve user-record op igen så vi ikke efterlader skrald.
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

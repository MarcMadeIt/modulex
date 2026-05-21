import { Schema, model, Document, Types } from "mongoose";

export interface IAnswer {
  questionId: string;
  answer: string | string[];
}

export interface ISurveyResponse extends Document {
  userId: Types.ObjectId;
  userEmail: string;
  answers: IAnswer[];
  submittedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const surveyResponseSchema = new Schema<ISurveyResponse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    userEmail: { type: String, required: true, lowercase: true },
    answers: [answerSchema],
  },
  { timestamps: { createdAt: "submittedAt", updatedAt: false } },
);

export const SurveyResponse = model<ISurveyResponse>(
  "SurveyResponse",
  surveyResponseSchema,
);

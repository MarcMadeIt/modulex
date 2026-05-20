import { Schema, model, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const Course = model<ICourse>("Course", courseSchema);

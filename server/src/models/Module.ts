import { Schema, model, Document, Types } from "mongoose";

export interface IMaterial {
  type: "youtube" | "pdf" | "text";
  title: string;
  url?: string;
  content?: string;
  expectedDuration?: number; // in minutes
  // Reference til Content-dokumentet hvis materialet er valgt "fra biblioteket".
  // Når CourseView læser modulet, opdaterer vi title/url ud fra Content,
  // så ændringer i biblioteket automatisk slår igennem på alle kurser.
  contentId?: Types.ObjectId;
}

export interface IModule extends Document {
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  duration?: number; // in minutes — module-level fallback when materials have no expectedDuration
  materials: IMaterial[];
}

const materialSchema = new Schema<IMaterial>(
  {
    type: { type: String, enum: ["youtube", "pdf", "text"], required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String },
    content: { type: String },
    expectedDuration: { type: Number }, // in minutes
    contentId: { type: Schema.Types.ObjectId, ref: "Content" },
  },
  { _id: false },
);

const moduleSchema = new Schema<IModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true },
    duration: { type: Number }, // in minutes
    materials: [materialSchema],
  },
  { timestamps: true },
);

moduleSchema.index({ courseId: 1, order: 1 });

export const Module = model<IModule>("Module", moduleSchema);

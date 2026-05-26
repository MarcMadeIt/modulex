import { Schema, model, Document, Types } from "mongoose";

export interface IMaterial {
  type: "video" | "pdf" | "text";
  title: string;
  url?: string;
  content?: string;
  expectedDuration?: number; // in minutes
}

export interface IModule extends Document {
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  duration?: string;
  order: number;
  materials: IMaterial[];
}

const materialSchema = new Schema<IMaterial>(
  {
    type: { type: String, enum: ["video", "pdf", "text"], required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String },
    content: { type: String },
    expectedDuration: { type: Number }, // in minutes
  },
  { _id: false },
);

const moduleSchema = new Schema<IModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    duration: { type: String, trim: true },
    order: { type: Number, required: true },
    materials: [materialSchema],
  },
  { timestamps: true },
);

moduleSchema.index({ courseId: 1, order: 1 });

export const Module = model<IModule>("Module", moduleSchema);

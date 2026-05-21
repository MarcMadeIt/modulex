import { Schema, model, Document, Types } from "mongoose";

export const CONTENT_TYPES = ["pdf", "youtube"] as const;
export const CONTENT_CATEGORIES = [
  "product",
  "production",
  "company",
  "design",
  "technology",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export interface IContent extends Document {
  type: ContentType;
  title: string;
  url: string;
  description?: string;
  category?: ContentCategory;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    type: { type: String, enum: CONTENT_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: CONTENT_CATEGORIES },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

contentSchema.index({ type: 1, category: 1 });

export const Content = model<IContent>("Content", contentSchema);

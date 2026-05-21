import { Schema, model, Document, Types } from "mongoose";

export interface IUserProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedModuleIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completedModuleIds: [{ type: Schema.Types.ObjectId, ref: "Module" }],
  },
  { timestamps: true },
);

userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserProgress = model<IUserProgress>(
  "UserProgress",
  userProgressSchema,
);

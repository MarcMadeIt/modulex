import { Schema, model, Document, Types } from "mongoose";

export interface IUserCourse extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  grantedBy: Types.ObjectId;
  grantedAt: Date;
}

const userCourseSchema = new Schema<IUserCourse>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  grantedAt: { type: Date, default: Date.now },
});

userCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserCourse = model<IUserCourse>("UserCourse", userCourseSchema);

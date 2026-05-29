import { Schema, model, Document } from "mongoose";

export type UserStatus =
  | "pending_survey"
  | "pending_approval"
  | "pending_activation"
  | "active";

export interface IUser extends Document {
  email: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  password?: string;
  role: "admin" | "client";
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    companyName: { type: String, default: "", trim: true },
    contactPerson: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "client"], default: "client" },
    status: {
      type: String,
      enum: [
        "pending_survey",
        "pending_approval",
        "pending_activation",
        "active",
      ],
      default: "pending_survey",
    },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);

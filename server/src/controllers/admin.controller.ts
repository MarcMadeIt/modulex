import { Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { UserCourse } from "../models/UserCourse";
import { UserProgress } from "../models/UserProgress";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSurveyEmail } from "../utils/email";

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: "client" }).select("-password");
    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const getAdminCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    return res.status(200).json({ courses });
  } catch {
    return res.status(500).json({ message: "Failed to fetch courses" });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    const course = await Course.create({ title, description });
    return res.status(201).json({ course });
  } catch {
    return res.status(500).json({ message: "Failed to create course" });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }
    const { title, description } = req.body;
    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { title, description } },
      { new: true, runValidators: true },
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({ course });
  } catch {
    return res.status(500).json({ message: "Failed to update course" });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    await Promise.all([
      Module.deleteMany({ courseId: id }),
      UserCourse.deleteMany({ courseId: id }),
      UserProgress.deleteMany({ courseId: id }),
    ]);
    return res.status(200).json({ message: "Course deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete course" });
  }
};

export const createModule = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }
    const course = await Course.exists({ _id: id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const { title, description, order, materials } = req.body;
    if (!title || order === undefined) {
      return res.status(400).json({ message: "Title and order are required" });
    }
    const mod = await Module.create({ courseId: id, title, description, order, materials });
    return res.status(201).json({ module: mod });
  } catch {
    return res.status(500).json({ message: "Failed to create module" });
  }
};

export const updateModule = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const moduleId = req.params.moduleId as string;
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(moduleId)) {
      return res.status(404).json({ message: "Not found" });
    }
    const mod = await Module.findOneAndUpdate(
      { _id: moduleId, courseId: id },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }
    return res.status(200).json({ module: mod });
  } catch {
    return res.status(500).json({ message: "Failed to update module" });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const moduleId = req.params.moduleId as string;
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(moduleId)) {
      return res.status(404).json({ message: "Not found" });
    }
    const mod = await Module.findOneAndDelete({ _id: moduleId, courseId: id });
    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }
    return res.status(200).json({ message: "Module deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete module" });
  }
};

export const assignCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ message: "userId and courseId are required" });
    }
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid userId or courseId" });
    }
    const [user, course] = await Promise.all([
      User.exists({ _id: userId, role: "client" }),
      Course.exists({ _id: courseId }),
    ]);
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const grant = await UserCourse.create({
      userId,
      courseId,
      grantedBy: req.user!.userId,
    });
    return res.status(201).json({ grant });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "User already has access to this course" });
    }
    return res.status(500).json({ message: "Failed to assign course" });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "client",
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ message: "Failed to fetch customer" });
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { emails } = req.body as { emails?: unknown };

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "emails must be a non-empty array" });
    }

    // Normalisér, valider og fjern dubletter.
    const normalized = [
      ...new Set(
        emails
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => EMAIL_REGEX.test(e)),
      ),
    ];

    if (normalized.length === 0) {
      return res.status(400).json({ message: "No valid emails provided" });
    }

    const results = await Promise.allSettled(
      normalized.map(async (email) => {
        // Upsert som lead. $setOnInsert sikrer at en eksisterende bruger
        // (fx en allerede aktiv kunde) ikke nedgraderes ved gen-afsendelse.
        await User.findOneAndUpdate(
          { email },
          { $setOnInsert: { email, role: "client", status: "pending_survey" } },
          { upsert: true, setDefaultsOnInsert: true },
        );
        await sendSurveyEmail(email);
      }),
    );

    const failed: string[] = [];
    let lastError = "";
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        lastError = result.reason?.message || String(result.reason);
        console.error(`Failed to send survey to ${normalized[i]}:`, result.reason);
        failed.push(normalized[i]);
      }
    });

    const sent = normalized.length - failed.length;

    // Hvis intet kunne sendes (typisk forkerte SMTP-credentials) -> fejl tydeligt,
    // så frontenden ikke fejlagtigt viser succes.
    if (sent === 0) {
      return res.status(502).json({
        message: `Kunne ikke sende mail. Tjek SMTP-opsætningen i .env. (${lastError})`,
        sent,
        failed,
      });
    }

    return res.status(200).json({ sent, failed });
  } catch (err) {
    console.error("Send survey error:", err);
    return res.status(500).json({ message: "Failed to send survey" });
  }
};

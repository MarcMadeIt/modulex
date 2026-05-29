import { Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { UserCourse } from "../models/UserCourse";
import { UserProgress } from "../models/UserProgress";
import { SurveyResponse } from "../models/SurveyResponse";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSurveyEmail, sendRegistrationEmail } from "../utils/email";

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: "client" })
      .select("-password")
      .lean();

    const counts = await UserCourse.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countByUserId = new Map(
      counts.map((entry) => [String(entry._id), entry.count]),
    );

    const enriched = users.map((user) => ({
      ...user,
      courseCount: countByUserId.get(String(user._id)) ?? 0,
    }));

    return res.status(200).json({ users: enriched });
  } catch {
    return res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const getAdminCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();

    const moduleCounts = await Module.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([{ $group: { _id: "$courseId", count: { $sum: 1 } } }]);

    const countByCourseId = new Map(
      moduleCounts.map((entry) => [String(entry._id), entry.count]),
    );

    const enriched = courses.map((course) => ({
      ...course,
      moduleCount: countByCourseId.get(String(course._id)) ?? 0,
    }));

    return res.status(200).json({ courses: enriched });
  } catch {
    return res.status(500).json({ message: "Failed to fetch courses" });
  }
};
// Nina - Admin-kontroller for håndtering af kunder, kurser og moduler. Indeholder CRUD-operationer og logik for at tildele kurser til kunder. --- IGNORE ---

export const getCourseCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }

    const grants = await UserCourse.find({ courseId: id })
      .populate("userId", "-password")
      .sort({ grantedAt: -1 });

    const customers = grants
      .map((grant) => {
        const user = grant.userId as any;
        if (!user) return null;
        return {
          _id: user._id,
          email: user.email,
          companyName: user.companyName,
          contactPerson: user.contactPerson,
          status: user.status,
          grantedAt: grant.grantedAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ customers });
  } catch {
    return res
      .status(500)
      .json({ message: "Failed to fetch course customers" });
  }
};

const ALLOWED_MATERIAL_TYPES = ["youtube", "pdf", "text"] as const;

type IncomingMaterial = {
  type?: string;
  title?: string;
  url?: string;
  content?: string;
  expectedDuration?: number;
  contentId?: string;
};

type IncomingModule = {
  title?: string;
  description?: string;
  order?: number;
  duration?: number;
  materials?: IncomingMaterial[];
};

function normalizeMaterial(raw: IncomingMaterial) {
  const rawType = (raw?.type || "").toLowerCase();
  const type = rawType === "video" ? "youtube" : rawType;

  if (
    !ALLOWED_MATERIAL_TYPES.includes(
      type as (typeof ALLOWED_MATERIAL_TYPES)[number],
    )
  ) {
    return null;
  }

  const contentId =
    typeof raw.contentId === "string" && Types.ObjectId.isValid(raw.contentId)
      ? new Types.ObjectId(raw.contentId)
      : undefined;

  return {
    type,
    title: typeof raw.title === "string" ? raw.title.trim() : "",
    url: typeof raw.url === "string" ? raw.url.trim() : undefined,
    content: typeof raw.content === "string" ? raw.content : undefined,
    expectedDuration:
      typeof raw.expectedDuration === "number" &&
      Number.isFinite(raw.expectedDuration)
        ? raw.expectedDuration
        : undefined,
    contentId,
  };
}

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, modules } = req.body as {
      title?: string;
      description?: string;
      modules?: IncomingModule[];
    };

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    const course = await Course.create({ title, description });

    if (Array.isArray(modules) && modules.length > 0) {
      try {
        const docs = modules.map((mod, index) => {
          const materials = Array.isArray(mod.materials)
            ? mod.materials.map(normalizeMaterial).filter(Boolean)
            : [];

          return {
            courseId: course._id,
            title: typeof mod.title === "string" ? mod.title.trim() : "",
            description:
              typeof mod.description === "string" ? mod.description.trim() : "",
            order: typeof mod.order === "number" ? mod.order : index + 1,
            duration:
              typeof mod.duration === "number" && Number.isFinite(mod.duration)
                ? mod.duration
                : undefined,
            materials,
          };
        });

        await Module.insertMany(docs, { ordered: true });
      } catch (err) {
        await Course.findByIdAndDelete(course._id);
        return res.status(400).json({
          message: "Invalid module data — kurset blev ikke oprettet.",
        });
      }
    }

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
      { returnDocument: "after", runValidators: true },
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

export const getAdminModules = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }
    const course = await Course.exists({ _id: id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const modules = await Module.find({ courseId: id }).sort({ order: 1 });
    return res.status(200).json({ modules });
  } catch {
    return res.status(500).json({ message: "Failed to get modules" });
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
    const { title, description, order, duration, materials } = req.body;
    if (!title || order === undefined) {
      return res.status(400).json({ message: "Title and order are required" });
    }
    const mod = await Module.create({
      courseId: id,
      title,
      description,
      order,
      duration,
      materials,
    });
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
      { returnDocument: "after", runValidators: true },
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
      return res
        .status(400)
        .json({ message: "userId and courseId are required" });
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
      return res
        .status(409)
        .json({ message: "User already has access to this course" });
    }
    return res.status(500).json({ message: "Failed to assign course" });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const user = await User.findOneAndDelete({ _id: id, role: "client" });
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await Promise.all([
      UserCourse.deleteMany({ userId: id }),
      UserProgress.deleteMany({ userId: id }),
      SurveyResponse.deleteMany({ userId: id }),
    ]);

    return res.status(200).json({ message: "Customer deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete customer" });
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

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing && existing.status !== "pending_survey") {
      return res.status(409).json({ message: "Email is already registered" });
    }
    // Marc - Sender survey-mail uanset om det er en ny lead eller en eksisterende i pending_survey
    try {
      await sendSurveyEmail(cleanEmail);
    } catch (err) {
      console.error(`Failed to send survey email to ${cleanEmail}:`, err);
      return res.status(502).json({
        message: "Kunne ikke sende survey-mail. Tjek SMTP-opsætningen i .env.",
      });
    }

    const user =
      existing ??
      (await User.create({
        email: cleanEmail,
        role: "client",
        status: "pending_survey",
      }));

    return res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Create lead error:", err);
    return res.status(500).json({ message: "Failed to create lead" });
  }
};

export const getCustomerCourses = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const user = await User.exists({ _id: id, role: "client" });
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const grants = await UserCourse.find({ userId: id })
      .populate("courseId", "title description")
      .sort({ grantedAt: -1 })
      .lean();

    if (grants.length === 0) {
      return res.status(200).json({ assignments: [] });
    }

    const courseIds = grants
      .map((g) => (g.courseId as any)?._id)
      .filter(Boolean);

    const [moduleCounts, progressRecords] = await Promise.all([
      Module.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
      UserProgress.find({ userId: id, courseId: { $in: courseIds } }).lean(),
    ]);

    const countByCourseId = new Map(
      moduleCounts.map((entry) => [String(entry._id), entry.count]),
    );
    const progressByCourseId = new Map(
      progressRecords.map((p) => [
        String(p.courseId),
        p.completedModuleIds.length,
      ]),
    );

    const assignments = grants
      .map((grant) => {
        const course = grant.courseId as any;
        if (!course) return null;
        const courseIdStr = String(course._id);
        const totalModules = countByCourseId.get(courseIdStr) ?? 0;
        const completedModules = progressByCourseId.get(courseIdStr) ?? 0;
        return {
          _id: grant._id,
          courseId: course._id,
          title: course.title,
          description: course.description,
          grantedAt: grant.grantedAt,
          completedModules,
          totalModules,
          percentage:
            totalModules > 0
              ? Math.round((completedModules / totalModules) * 100)
              : 0,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ assignments });
  } catch {
    return res
      .status(500)
      .json({ message: "Failed to fetch customer courses" });
  }
};

export const unassignCourse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const courseId = req.params.courseId as string;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(courseId)) {
      return res.status(404).json({ message: "Not found" });
    }

    const grant = await UserCourse.findOneAndDelete({
      userId: id,
      courseId,
    });

    if (!grant) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json({ message: "Assignment removed" });
  } catch {
    return res.status(500).json({ message: "Failed to remove assignment" });
  }
};

export const resendCourses = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const user = await User.findOne({ _id: id, role: "client" });
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const assignmentCount = await UserCourse.countDocuments({ userId: id });
    if (assignmentCount === 0) {
      return res
        .status(400)
        .json({ message: "Customer has no assigned courses" });
    }

    try {
      await sendRegistrationEmail(user.email);
    } catch (err) {
      console.error(`Failed to send registration email to ${user.email}:`, err);
      return res.status(502).json({
        message: "Kunne ikke sende kursusmail. Tjek SMTP-opsætningen i .env.",
      });
    }

    if (user.status === "pending_approval") {
      user.status = "pending_activation";
      await user.save();
    }

    return res.status(200).json({
      message: "Course email resent",
      sentTo: user.email,
      courseCount: assignmentCount,
      status: user.status,
    });
  } catch (err) {
    console.error("Resend courses error:", err);
    return res.status(500).json({ message: "Failed to resend courses" });
  }
};

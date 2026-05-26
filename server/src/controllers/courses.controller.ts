import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { UserCourse } from "../models/UserCourse";
import { UserProgress } from "../models/UserProgress";

const hasAccess = async (userId: string, courseId: string) => {
  return UserCourse.exists({ userId, courseId });
};

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const grants = await UserCourse.find({ userId }).populate("courseId");

    const courses = await Promise.all(
      grants.map(async (grant) => {
        const course = grant.courseId as any;
        const [totalModules, progress] = await Promise.all([
          Module.countDocuments({ courseId: course._id }),
          UserProgress.findOne({ userId, courseId: course._id }),
        ]);
        const completedModules = progress?.completedModuleIds.length ?? 0;

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          status: course.status,
          totalModules,
          completedModules,
          progressPct:
            totalModules > 0
              ? Math.round((completedModules / totalModules) * 100)
              : 0,
        };
      }),
    );

    return res.status(200).json({ courses });
  } catch {
    return res.status(500).json({ message: "Failed to fetch courses" });
  }
};

export const getCourse = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!(await hasAccess(userId, id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [course, totalModules, progress] = await Promise.all([
      Course.findById(id),
      Module.countDocuments({ courseId: id }),
      UserProgress.findOne({ userId, courseId: id }),
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const completed = progress?.completedModuleIds.length ?? 0;

    return res.status(200).json({
      course,
      progress: {
        completed,
        total: totalModules,
        percentage:
          totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch course" });
  }
};

export const getCourseModules = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!(await hasAccess(userId, id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [modules, progress] = await Promise.all([
      Module.find({ courseId: id }).sort({ order: 1 }),
      UserProgress.findOne({ userId, courseId: id }),
    ]);

    const completedSet = new Set(
      progress?.completedModuleIds.map((id) => id.toString()) ?? [],
    );

    const modulesWithCount = modules.map((mod) => ({
      _id: mod._id,
      title: mod.title,
      description: mod.description,
      duration: mod.duration,
      order: mod.order,
      materialsCount: mod.materials.length,
      isCompleted: completedSet.has(mod._id.toString()),
    }));

    return res.status(200).json({ modules: modulesWithCount });
  } catch {
    return res.status(500).json({ message: "Failed to fetch modules" });
  }
};

export const getCourseModule = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const moduleId = req.params.moduleId as string;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(moduleId)) {
      return res.status(404).json({ message: "Not found" });
    }

    if (!(await hasAccess(userId, id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [mod, progress] = await Promise.all([
      Module.findOne({ _id: moduleId, courseId: id }),
      UserProgress.findOne({ userId, courseId: id }),
    ]);

    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }

    const isCompleted =
      progress?.completedModuleIds.some((cid) => cid.toString() === moduleId) ??
      false;

    return res.status(200).json({ module: { ...mod.toObject(), isCompleted } });
  } catch {
    return res.status(500).json({ message: "Failed to fetch module" });
  }
};

export const completeModule = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const moduleId = req.params.moduleId as string;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(moduleId)) {
      return res.status(404).json({ message: "Not found" });
    }

    if (!(await hasAccess(userId, id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const mod = await Module.exists({ _id: moduleId, courseId: id });
    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }

    await UserProgress.updateOne(
      { userId, courseId: id },
      { $addToSet: { completedModuleIds: new Types.ObjectId(moduleId) } },
      { upsert: true },
    );

    const [totalModules, progress] = await Promise.all([
      Module.countDocuments({ courseId: id }),
      UserProgress.findOne({ userId, courseId: id }),
    ]);

    const completed = progress!.completedModuleIds.length;

    return res.status(200).json({
      message: "Module marked as complete",
      progress: {
        completed,
        total: totalModules,
        percentage:
          totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to complete module" });
  }
};

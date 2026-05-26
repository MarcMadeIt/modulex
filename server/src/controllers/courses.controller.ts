import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Content } from "../models/Content";
import { UserCourse } from "../models/UserCourse";
import { UserProgress } from "../models/UserProgress";

const hasAccess = async (userId: string, courseId: string) => {
  return UserCourse.exists({ userId, courseId });
};

// Når et material har en contentId-reference, vil vi gerne læse title/url
// fra Content i stedet for det snapshot der ligger i modulet. Det betyder
// at en opdatering af Content (fx ny YouTube-URL) automatisk slår igennem
// på alle kurser uden at vi skal re-oprette eller resynke moduler.
async function resolveMaterials(materials: any[]): Promise<any[]> {
  if (!Array.isArray(materials) || materials.length === 0) return materials || [];

  const contentIds = materials
    .map((mat) => mat?.contentId)
    .filter((id) => id && Types.ObjectId.isValid(id));

  if (contentIds.length === 0) return materials;

  const contents = await Content.find({ _id: { $in: contentIds } }).lean();
  const byId = new Map(contents.map((c: any) => [String(c._id), c]));

  return materials.map((mat) => {
    if (!mat?.contentId) return mat;
    const content: any = byId.get(String(mat.contentId));
    if (!content) return mat;

    return {
      ...mat,
      title: content.title,
      url: content.url,
      // type bevares fra modulet; Content's "youtube" matcher allerede vores enum
      type: content.type === "youtube" ? "youtube" : mat.type,
    };
  });
}

// Parser et duration-felt fra MongoDB. Accepterer både tal (12) og strenge
// ("12", "12 min", "12 minutter") — sidstnævnte fordi nogle moduler er
// oprettet med strengfelter i ældre versioner.
function parseDurationMinutes(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const match = value.match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }
  return 0;
}

// Beregner varigheden for ét modul. Foretrækker sum af materialernes
// expectedDuration/duration; ellers falder tilbage til modulets top-level
// duration-felt (for modules der er importeret med skema fra anden flow).
function moduleDurationOf(mod: any): number {
  const materials = Array.isArray(mod?.materials) ? mod.materials : [];
  const materialSum = materials.reduce(
    (sum: number, mat: any) =>
      sum + parseDurationMinutes(mat?.expectedDuration ?? mat?.duration),
    0,
  );
  if (materialSum > 0) return materialSum;
  return parseDurationMinutes(mod?.duration);
}

// Aggregerer total varighed for et kursus på tværs af alle moduler.
const computeCourseDuration = async (courseId: any): Promise<number> => {
  const modules = await Module.find({ courseId }).lean();
  return modules.reduce((sum, mod) => sum + moduleDurationOf(mod), 0);
};

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const grants = await UserCourse.find({ userId }).populate("courseId");

    const courses = await Promise.all(
      grants.map(async (grant) => {
        const course = grant.courseId as any;
        const [totalModules, totalDuration, progress] = await Promise.all([
          Module.countDocuments({ courseId: course._id }),
          computeCourseDuration(course._id),
          UserProgress.findOne({ userId, courseId: course._id }),
        ]);
        const completedModules = progress?.completedModuleIds.length ?? 0;

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          status: course.status,
          totalModules,
          totalDuration,
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

    const modules = await Module.find({ courseId: id })
      .sort({ order: 1 })
      .lean();

    const modulesWithCount = modules.map((mod: any) => ({
      _id: mod._id,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      materialsCount: Array.isArray(mod.materials) ? mod.materials.length : 0,
      // Aggregeret varighed — håndterer både materials.expectedDuration,
      // materials.duration (string/tal) og et top-level duration-felt.
      duration: moduleDurationOf(mod),
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

    const mod = await Module.findOne({ _id: moduleId, courseId: id }).lean();

    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }

    const materials = await resolveMaterials((mod as any).materials || []);

    return res.status(200).json({ module: { ...mod, materials } });
  } catch {
    return res.status(500).json({ message: "Failed to fetch module" });
  }
};

// Markerer et modul som gennemført for den indloggede bruger.
// Bruges fra CourseView når kunden trykker "Næste" på et bekræftet trin.
// Upserter UserProgress og bruger $addToSet for idempotens — gentagne kald
// for samme modul ændrer ikke noget. Returnerer den friske progress-info
// så frontenden kan opdatere "X% gennemført".
export const completeCourseModule = async (
  req: AuthRequest,
  res: Response,
) => {
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

    // Tjek at modulet rent faktisk hører til kurset — ellers kan en kunde
    // sende et hvilket som helst moduleId og opfinde "completed" rækker.
    const moduleExists = await Module.exists({ _id: moduleId, courseId: id });
    if (!moduleExists) {
      return res.status(404).json({ message: "Module not found" });
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId, courseId: id },
      { $addToSet: { completedModuleIds: moduleId } },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    const totalModules = await Module.countDocuments({ courseId: id });
    const completed = progress?.completedModuleIds.length ?? 0;
    const percentage =
      totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

    return res.status(200).json({
      progress: {
        completed,
        total: totalModules,
        percentage,
      },
    });
  } catch (err) {
    console.error("Complete module error:", err);
    return res
      .status(500)
      .json({ message: "Failed to mark module as completed" });
  }
};

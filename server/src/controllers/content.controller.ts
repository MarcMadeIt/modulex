import { Response } from "express";
import { Types, type AnyBulkWriteOperation } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  Content,
  type IContent,
  CONTENT_TYPES,
  CONTENT_CATEGORIES,
} from "../models/Content";
import { Module } from "../models/Module";

const EDITABLE_FIELDS = [
  "type",
  "title",
  "url",
  "description",
  "category",
] as const;

// Whitelist incoming body fields to prevent mass-assignment (e.g. uploadedBy).
const pickFields = (body: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

const validateEnums = (data: Record<string, unknown>): string | null => {
  if (
    data.type !== undefined &&
    !(CONTENT_TYPES as readonly unknown[]).includes(data.type)
  ) {
    return `type must be one of: ${CONTENT_TYPES.join(", ")}`;
  }
  if (
    data.category !== undefined &&
    !(CONTENT_CATEGORIES as readonly unknown[]).includes(data.category)
  ) {
    return `category must be one of: ${CONTENT_CATEGORIES.join(", ")}`;
  }
  return null;
};

export const getContent = async (req: AuthRequest, res: Response) => {
  try {
    const { type, category } = req.query;

    const filter: Record<string, unknown> = {};
    if (typeof type === "string") filter.type = type;
    if (typeof category === "string") filter.category = category;

    const content = await Content.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ content });
  } catch {
    return res.status(500).json({ message: "Failed to fetch content" });
  }
};

export const getContentById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Content not found" });
    }
    const item = await Content.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Content not found" });
    }
    return res.status(200).json({ content: item });
  } catch {
    return res.status(500).json({ message: "Failed to fetch content" });
  }
};

export const createContent = async (req: AuthRequest, res: Response) => {
  try {
    const data = pickFields(req.body);

    if (!data.type || !data.title || !data.url) {
      return res
        .status(400)
        .json({ message: "type, title and url are required" });
    }
    const enumError = validateEnums(data);
    if (enumError) {
      return res.status(400).json({ message: enumError });
    }

    const item = await Content.create({
      ...data,
      uploadedBy: req.user!.userId,
    });
    return res.status(201).json({ content: item });
  } catch {
    return res.status(500).json({ message: "Failed to create content" });
  }
};

export const createContentBulk = async (req: AuthRequest, res: Response) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "items must be a non-empty array" });
    }

    // Validate everything up front — never half-write a batch.
    for (let i = 0; i < items.length; i++) {
      const data = pickFields(items[i]);
      if (!data.type || !data.title || !data.url) {
        return res
          .status(400)
          .json({ message: `items[${i}]: type, title and url are required` });
      }
      const enumError = validateEnums(data);
      if (enumError) {
        return res.status(400).json({ message: `items[${i}]: ${enumError}` });
      }
    }

    // Upsert keyed on title so re-running (e.g. after fixing URLs) won't duplicate.
    const uploadedBy = new Types.ObjectId(req.user!.userId);
    const ops = items.map((raw: Record<string, unknown>) => {
      const data = pickFields(raw);
      return {
        updateOne: {
          filter: { title: data.title },
          update: { $set: { ...data, uploadedBy } },
          upsert: true,
        },
      };
    });

    const result = await Content.bulkWrite(
      ops as AnyBulkWriteOperation<IContent>[],
    );
    return res.status(200).json({
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch {
    return res.status(500).json({ message: "Failed to bulk insert content" });
  }
};

export const updateContent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const updates = pickFields(req.body);
    const enumError = validateEnums(updates);
    if (enumError) {
      return res.status(400).json({ message: enumError });
    }

    const item = await Content.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );
    if (!item) {
      return res.status(404).json({ message: "Content not found" });
    }
    return res.status(200).json({ content: item });
  } catch {
    return res.status(500).json({ message: "Failed to update content" });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Content not found" });
    }
    const item = await Content.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ message: "Content not found" });
    }
    return res.status(200).json({ message: "Content deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete content" });
  }
};

// Backfill: sætter contentId på eksisterende modul-materialer ved at matche
// material.title med Content.title. Bruges én gang efter at vi tog reference-
// arkitekturen i brug — derefter holder create-flowet contentId på plads.
// Efter backfill bliver title/url løst dynamisk fra Content ved read-time.
export const resyncModuleMaterials = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const contents = await Content.find().lean();

    let modulesUpdated = 0;

    for (const content of contents) {
      const materialType = content.type === "youtube" ? "youtube" : content.type;
      const matchableTypes =
        materialType === "youtube" ? ["youtube", "video"] : [materialType];

      const result = await Module.updateMany(
        {
          materials: {
            $elemMatch: {
              title: content.title,
              type: { $in: matchableTypes },
              contentId: { $exists: false },
            },
          },
        },
        {
          $set: {
            "materials.$[mat].contentId": content._id,
            "materials.$[mat].type": materialType,
          },
        },
        {
          arrayFilters: [
            {
              "mat.title": content.title,
              "mat.type": { $in: matchableTypes },
              "mat.contentId": { $exists: false },
            },
          ],
        },
      );

      modulesUpdated += result.modifiedCount;
    }

    return res.status(200).json({
      message: "contentId backfilled på eksisterende moduler",
      modulesUpdated,
      contentChecked: contents.length,
    });
  } catch (err) {
    console.error("Backfill error:", err);
    return res
      .status(500)
      .json({ message: "Kunne ikke backfille contentId" });
  }
};

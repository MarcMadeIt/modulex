import { Router } from "express";

import authRoutes from "./auth.routes";
import surveyRoutes from "./survey.routes";
import adminRoutes from "./admin.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/survey", surveyRoutes);
router.use("/admin", adminRoutes);

export default router;

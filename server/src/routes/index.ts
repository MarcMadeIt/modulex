import { Router } from "express";

import authRoutes from "./auth.routes";
import surveyRoutes from "./survey.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/survey", surveyRoutes);

export default router;

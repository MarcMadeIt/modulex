import { Router } from "express";
import {
  submitSurvey,
  getResponseByUser,
} from "../controllers/survey.controller";

const router: Router = Router();

router.post("/", submitSurvey);
router.get("/:userId", getResponseByUser); // admin only - tilføj middleware senere
router.get("/:userId", getResponseByUser); // admin only - tilføj middleware senere

export default router;

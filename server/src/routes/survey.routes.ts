import { Router } from "express";
import {
  submitSurvey,
  getResponseByUser,
} from "../controllers/survey.controller";
import { authRequired, adminOnly } from "../middleware/auth.middleware";

const router: Router = Router();

/**
 * @swagger
 * /survey:
 *   post:
 *     summary: Submit a survey and register a new company user
 *     tags: [Survey]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SurveySubmitRequest'
 *     responses:
 *       201:
 *         description: Survey submitted successfully, user created with pending_approval status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SurveySubmitResponse'
 *       409:
 *         description: Email is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", submitSurvey);

/**
 * @swagger
 * /survey/{userId}:
 *   get:
 *     summary: Get survey response for a specific user (admin only)
 *     tags: [Survey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the user
 *         example: 664f1c2e8b1a2c3d4e5f6a7b
 *     responses:
 *       200:
 *         description: Survey response found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   $ref: '#/components/schemas/SurveyResponseObject'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No survey response found for this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:userId", authRequired, adminOnly, getResponseByUser);

export default router;

import express from "express";
import { getSummary } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", protect, authorize("admin"), getSummary);

export default router;
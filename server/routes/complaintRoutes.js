import express from "express";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getComplaints,
  updateStatus,
} from "../controllers/complaintController.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImages } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/", authorize("citizen"), uploadImages, createComplaint);
router.get("/mine", authorize("citizen"), getMyComplaints);
router.get("/", authorize("officer", "admin"), getComplaints);
router.get("/:id", getComplaintById);
router.patch("/:id/status", authorize("officer", "admin"), updateStatus);

export default router;
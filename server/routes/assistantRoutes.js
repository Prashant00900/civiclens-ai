import express from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../controllers/assistantController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// har user ke liye 10 messages per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { message: "Too many messages. Please wait a minute." },
});

router.post("/chat", protect, limiter, chat);

export default router;
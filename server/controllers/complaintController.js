import { analyzeComplaint } from "../services/aiService.js";
import Complaint, { CATEGORIES, STATUSES } from "../models/Complaint.js";
import Department from "../models/Department.js";
import uploadImage from "../utils/uploadImage.js";

// kaunsa status kahan jaa sakta hai
const TRANSITIONS = {
  submitted: ["assigned", "rejected"],
  assigned: ["in_progress", "rejected"],
  in_progress: ["resolved"],
  resolved: [],
  rejected: [],
};

export const createComplaint = async (req, res) => {
  const { title, description, category, address } = req.body;
  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required" });
  }
  if (
    Number.isNaN(lat) || Number.isNaN(lng) ||
    lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    return res.status(400).json({ message: "Valid lat and lng are required" });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "At least one photo is required" });
  }

  const userCategory = CATEGORIES.includes(category) ? category : "other";

  // photo upload aur AI analysis ek saath chalte hain
  const [images, ai] = await Promise.all([
    Promise.all(req.files.map((f) => uploadImage(f.buffer))),
    analyzeComplaint({
      title,
      description,
      imageBuffer: req.files[0].buffer,
      mimeType: req.files[0].mimetype,
    }),
  ]);

  // AI chal gaya to uska jawab, warna user ki category aur default values
  const finalCategory = ai?.category ?? userCategory;
  const severity = ai?.severity ?? 1;
  const priorityScore = severity * 20;

  const dept = await Department.findOne({ categories: finalCategory });

  const complaint = await Complaint.create({
    reportedBy: req.user._id,
    title,
    description,
    category: finalCategory,
    severity,
    priorityScore,
    aiSummary: ai?.summary,
    address,
    images,
    department: dept?._id,
    location: { type: "Point", coordinates: [lng, lat] },
    statusHistory: [
      { status: "submitted", by: req.user._id, note: "Complaint submitted" },
    ],
  });

  res.status(201).json(complaint);
};

export const getMyComplaints = async (req, res) => {
  const items = await Complaint.find({ reportedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate("department", "name");
  res.json(items);
};

export const getComplaintById = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("reportedBy", "name email")
    .populate("department", "name")
    .populate("assignedTo", "name email")
    .populate("statusHistory.by", "name role");

  if (!complaint) return res.status(404).json({ message: "Complaint not found" });

  const isOwner = String(complaint.reportedBy._id) === String(req.user._id);
  if (req.user.role === "citizen" && !isOwner) {
    return res.status(403).json({ message: "Access denied" });
  }
  res.json(complaint);
};

export const getComplaints = async (req, res) => {
  const { status, category, department } = req.query;
  const filter = {};
  if (status) filter.status = String(status);
  if (category) filter.category = String(category);
  if (department) filter.department = String(department);

  // officer ko sirf apne department ki complaints dikhengi
  if (req.user.role === "officer" && req.user.department) {
    filter.department = req.user.department;
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("reportedBy", "name email")
      .populate("department", "name"),
    Complaint.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
};

export const updateStatus = async (req, res) => {
  const { status, note } = req.body;

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });

  if (
    req.user.role === "officer" &&
    String(complaint.department) !== String(req.user.department)
  ) {
    return res.status(403).json({ message: "Not your department's complaint" });
  }

  if (!TRANSITIONS[complaint.status].includes(status)) {
    return res.status(400).json({
      message: `Cannot move from ${complaint.status} to ${status}`,
    });
  }

  complaint.status = status;
  if (status === "resolved") {
    complaint.resolution.resolvedAt = new Date();
    complaint.resolution.note = note;
  }
  complaint.statusHistory.push({ status, by: req.user._id, note });
  await complaint.save();

  res.json(complaint);
};
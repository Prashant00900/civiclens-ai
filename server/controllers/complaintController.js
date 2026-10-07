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

  // pehle AI, taaki sahi category pata chale
  const ai = await analyzeComplaint({
    title,
    description,
    imageBuffer: req.files[0].buffer,
    mimeType: req.files[0].mimetype,
  });
  const finalCategory = ai?.category ?? userCategory;
  const severity = ai?.severity ?? 1;

  // duplicate check: 100 meter ke andar, wahi category, abhi khuli
  const existing = await Complaint.findOne({
    category: finalCategory,
    status: { $in: ["submitted", "assigned", "in_progress"] },
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 100,
      },
    },
  });

  if (existing) {
    const uid = String(req.user._id);
    const already =
      String(existing.reportedBy) === uid ||
      existing.supporters.some((s) => String(s) === uid);

    if (!already) {
      existing.supporters.push(req.user._id);
      existing.reportCount += 1;
      existing.severity = Math.max(existing.severity, severity);
      existing.priorityScore = Math.min(
        100,
        existing.severity * 20 + (existing.reportCount - 1) * 5
      );
      await existing.save();
    }

    return res.status(200).json({
      merged: true,
      alreadyReported: already,
      trackingId: existing.trackingId,
      reportCount: existing.reportCount,
    });
  }

  // duplicate nahi mila, to ab photo upload karke nayi complaint
  const images = await Promise.all(req.files.map((f) => uploadImage(f.buffer)));
  const dept = await Department.findOne({ categories: finalCategory });

  const complaint = await Complaint.create({
    reportedBy: req.user._id,
    title,
    description,
    category: finalCategory,
    severity,
    priorityScore: severity * 20,
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
  const items = await Complaint.find({
    $or: [{ reportedBy: req.user._id }, { supporters: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("department", "name");
  res.json(items);
};

export const getComplaintById = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("reportedBy", "name email")
    .populate("department", "name phone email officeAddress slaHours")
    .populate("assignedTo", "name")
    .populate("statusHistory.by", "name role");

  if (!complaint) return res.status(404).json({ message: "Complaint not found" });

  const uid = String(req.user._id);
  const isOwner = String(complaint.reportedBy._id) === uid;
  const isSupporter = complaint.supporters.some((s) => String(s) === uid);
  if (req.user.role === "citizen" && !isOwner && !isSupporter) {
    return res.status(403).json({ message: "Access denied" });
  }

  const data = complaint.toObject();
  const sla = complaint.department?.slaHours;
  if (sla) {
    data.dueAt = new Date(complaint.createdAt.getTime() + sla * 3600 * 1000);
    data.isOverdue =
      !["resolved", "rejected"].includes(complaint.status) &&
      data.dueAt < new Date();
  }

  if (req.user.role === "citizen") {
    // doosre citizens ki pehchaan chhupao
    delete data.reportedBy;
    delete data.supporters;
    data.statusHistory = data.statusHistory.map((h) =>
      h.by?.role === "citizen" && String(h.by._id) !== uid
        ? { ...h, by: { name: "Another citizen", role: "citizen" } }
        : h
    );
  }

  res.json(data);
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
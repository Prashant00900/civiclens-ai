import Complaint from "../models/Complaint.js";
import { askAssistant } from "../services/assistantService.js";

export const chat = async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }
  if (message.length > 500) {
    return res.status(400).json({ message: "Message is too long" });
  }

  // sirf isi user ki apni complaints, kisi aur ki nahi
  const complaints = await Complaint.find({ reportedBy: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("department", "name phone email officeAddress slaHours")
    .populate("assignedTo", "name");

  const data = complaints.map((c) => ({
    trackingId: c.trackingId,
    title: c.title,
    category: c.category,
    status: c.status,
    severity: c.severity,
    priorityScore: c.priorityScore,
    address: c.address,
    reportedOn: c.createdAt,
    department: c.department
      ? {
          name: c.department.name,
          helpline: c.department.phone,
          email: c.department.email,
          office: c.department.officeAddress,
        }
      : null,
    officer: c.assignedTo?.name || null,
    expectedBy: c.department?.slaHours
      ? new Date(c.createdAt.getTime() + c.department.slaHours * 3600 * 1000)
      : null,
    resolvedOn: c.resolution?.resolvedAt || null,
    timeline: c.statusHistory.map((h) => ({
      status: h.status,
      at: h.at,
      note: h.note,
    })),
  }));

  const history = Array.isArray(req.body.history) ? req.body.history : [];
  const reply = await askAssistant({ message, history, complaints: data });

  if (!reply) {
    return res.status(503).json({
      message: "The assistant is busy right now. Please try again in a minute.",
    });
  }

  res.json({ reply });
};
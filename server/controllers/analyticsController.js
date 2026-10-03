import Complaint from "../models/Complaint.js";

export const getSummary = async (req, res) => {
  const [total, byStatus, byCategory, resolved] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Complaint.find({
      status: "resolved",
      "resolution.resolvedAt": { $exists: true },
    }).select("createdAt resolution.resolvedAt"),
  ]);

  const avgHours = resolved.length
    ? resolved.reduce(
        (sum, c) => sum + (c.resolution.resolvedAt - c.createdAt),
        0
      ) /
      resolved.length /
      36e5
    : 0;

  res.json({
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byCategory: byCategory.map((c) => ({ name: c._id, value: c.count })),
    avgResolutionHours: Number(avgHours.toFixed(1)),
  });
};
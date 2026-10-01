import mongoose from "mongoose";

export const CATEGORIES = [
  "pothole",
  "garbage",
  "streetlight",
  "water_leakage",
  "drainage",
  "other",
];

export const STATUSES = [
  "submitted",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    trackingId: { type: String, unique: true },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    images: [{ url: String, publicId: String }],
    category: { type: String, enum: CATEGORIES, default: "other" },
    severity: { type: Number, min: 1, max: 5, default: 1 },
    priorityScore: { type: Number, default: 0 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String, trim: true },
    status: { type: String, enum: STATUSES, default: "submitted" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportCount: { type: Number, default: 1 },
    statusHistory: [statusHistorySchema],
    resolution: {
      afterImage: { url: String, publicId: String },
      note: String,
      resolvedAt: Date,
    },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

complaintSchema.index({ location: "2dsphere" });
complaintSchema.index({ status: 1, priorityScore: -1 });

complaintSchema.pre("validate", async function () {
  if (this.trackingId) return;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  this.trackingId = `CL-${new Date().getFullYear()}-${rand}`;
});

export default mongoose.model("Complaint", complaintSchema);
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    categories: [{ type: String }],
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    officeAddress: { type: String, trim: true },
    slaHours: { type: Number, default: 72 },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
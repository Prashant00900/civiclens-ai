import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Department from "../models/Department.js";

// Demo contact data. Asli city ke liye real numbers aur emails se badal dena.
const departments = [
  {
    name: "Roads",
    categories: ["pothole"],
    phone: "+91-00000-00001",
    email: "roads@civiclens.example",
    officeAddress: "Roads Department, City Hall Complex",
    slaHours: 72,
  },
  {
    name: "Sanitation",
    categories: ["garbage"],
    phone: "+91-00000-00002",
    email: "sanitation@civiclens.example",
    officeAddress: "Sanitation Department, Zonal Office",
    slaHours: 48,
  },
  {
    name: "Electricity",
    categories: ["streetlight"],
    phone: "+91-00000-00003",
    email: "electricity@civiclens.example",
    officeAddress: "Electricity Department, Power House Road",
    slaHours: 48,
  },
  {
    name: "Water",
    categories: ["water_leakage", "drainage"],
    phone: "+91-00000-00004",
    email: "water@civiclens.example",
    officeAddress: "Water Works Department, Main Pump House",
    slaHours: 24,
  },
  {
    name: "General",
    categories: ["other"],
    phone: "+91-00000-00005",
    email: "help@civiclens.example",
    officeAddress: "Citizen Help Desk, City Hall",
    slaHours: 96,
  },
];

await connectDB();

for (const d of departments) {
  await Department.updateOne({ name: d.name }, { $set: d }, { upsert: true });
}

console.log("Departments updated");
await mongoose.disconnect();
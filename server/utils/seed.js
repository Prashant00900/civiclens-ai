import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Department from "../models/Department.js";

const departments = [
  { name: "Roads", categories: ["pothole"] },
  { name: "Sanitation", categories: ["garbage"] },
  { name: "Electricity", categories: ["streetlight"] },
  { name: "Water", categories: ["water_leakage", "drainage"] },
  { name: "General", categories: ["other"] },
];

await connectDB();
await Department.deleteMany();
await Department.insertMany(departments);
console.log("Departments seeded");
await mongoose.disconnect();
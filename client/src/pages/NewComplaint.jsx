import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage" },
  { value: "streetlight", label: "Street light" },
  { value: "water_leakage", label: "Water leakage" },
  { value: "drainage", label: "Drainage" },
  { value: "other", label: "Other" },
];

export default function NewComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "pothole",
    address: "",
    lat: "",
    lng: "",
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = (e) => setFiles(Array.from(e.target.files).slice(0, 3));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Location is not supported in this browser");
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Could not get location. Please allow location access.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      return toast.error("Please capture your location first");
    }
    if (files.length === 0) {
      return toast.error("Please add at least one photo");
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.forEach((file) => data.append("images", file));

    setSubmitting(true);
    try {
      const res = await api.post("/complaints", data);
      toast.success(`Submitted! Tracking ID: ${res.data.trackingId}`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow space-y-4"
    >
      <h1 className="text-xl font-bold">Report a problem</h1>

      <input
        name="title"
        placeholder="Title (e.g. Pothole near school)"
        value={form.title}
        onChange={handleChange}
        required
        className="w-full border rounded-lg p-2"
      />

      <textarea
        name="description"
        placeholder="Describe the problem"
        value={form.description}
        onChange={handleChange}
        required
        rows={4}
        className="w-full border rounded-lg p-2"
      />

      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <input
        name="address"
        placeholder="Address or landmark"
        value={form.address}
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {locating ? "Getting location..." : "Use my location"}
        </button>
        <span className="text-sm text-gray-600">
          {form.lat ? `${form.lat}, ${form.lng}` : "Not captured yet"}
        </span>
      </div>

      <div>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          onChange={handleFiles}
        />
        <p className="text-xs text-gray-500 mt-1">
          Up to 3 photos, max 5MB each ({files.length} selected)
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit complaint"}
      </button>
    </form>
  );
}
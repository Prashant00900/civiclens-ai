import { useEffect, useState } from "react";
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

const MAX_PHOTO_MB = 4;

const inputClass =
  "w-full border border-line bg-white rounded px-3 py-2 focus:border-teal";

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
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files).slice(0, 3);
    if (picked.some((f) => f.size > MAX_PHOTO_MB * 1024 * 1024)) {
      toast.error(`Each photo must be under ${MAX_PHOTO_MB} MB`);
      e.target.value = "";
      return;
    }
    setFiles(picked);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("This browser cannot share your location");
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
        toast.error("Could not get your location. Allow location access and try again.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      return toast.error("Add your location first");
    }
    if (files.length === 0) {
      return toast.error("Add at least one photo");
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.forEach((file) => data.append("images", file));

    setSubmitting(true);
    try {
      const res = await api.post("/complaints", data);
      if (res.data.merged) {
        toast.success(
          res.data.alreadyReported
            ? `You already reported this. Tracking ID: ${res.data.trackingId}`
            : `Same problem was already reported nearby. Your report was added (${res.data.reportCount} reports). Tracking ID: ${res.data.trackingId}`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Complaint sent. Tracking ID: ${res.data.trackingId}`);
      }
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send the complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white border border-line rounded-md p-5 sm:p-6 space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Report a problem</h1>
        <p className="text-ink-soft mt-1">
          Add a photo and your location. AI will check the category and how
          urgent it is.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            placeholder="Pothole near school gate"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={120}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            What is wrong?
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Tell us what you see and how long it has been like this"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-soft mt-1">
            If this does not match your photo, AI will correct it.
          </p>
        </div>
      </div>

      <div className="border-t border-line pt-5 space-y-3">
        <h2 className="font-bold">Where is it?</h2>
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">
            Address or landmark
          </label>
          <input
            id="address"
            name="address"
            placeholder="Main Road, near the school gate"
            value={form.address}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="border border-ink rounded px-4 py-2 font-medium hover:bg-paper disabled:opacity-50"
          >
            {locating ? "Getting location..." : "Use my current location"}
          </button>
          {form.lat ? (
            <span className="text-sm text-teal font-medium">
              Location added ({form.lat}, {form.lng})
            </span>
          ) : (
            <span className="text-sm text-ink-soft">
              Stand near the problem and tap the button.
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-line pt-5 space-y-3">
        <h2 className="font-bold">Photos</h2>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          onChange={handleFiles}
          className="block text-sm"
        />
        <p className="text-xs text-ink-soft">
          Up to 3 photos, {MAX_PHOTO_MB} MB each. Only photos of the problem,
          not of people.
        </p>
        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {previews.map((src) => (
              <img
                key={src}
                src={src}
                alt="Selected photo"
                className="w-20 h-20 object-cover rounded border border-line"
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-teal text-white font-medium rounded px-6 py-2.5 hover:bg-teal-dark disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send complaint"}
      </button>
    </form>
  );
}
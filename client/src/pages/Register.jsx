import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

const inputClass =
  "w-full border border-line bg-white rounded px-3 py-2 focus:border-teal";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created");
      navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not create the account. The server may be waking up, wait a minute and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute. You can then report problems and track them."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-teal font-medium underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Full name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className={inputClass}
          />
          <p className="text-xs text-ink-soft mt-1">At least 6 characters.</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal text-white font-medium rounded py-2.5 hover:bg-teal-dark disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
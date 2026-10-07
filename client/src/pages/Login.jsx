import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

const inputClass =
  "w-full border border-line bg-white rounded px-3 py-2 focus:border-teal";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back");
      navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not log in. The server may be waking up, wait a minute and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Use your email and password to continue."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-teal font-medium underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal text-white font-medium rounded py-2.5 hover:bg-teal-dark disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
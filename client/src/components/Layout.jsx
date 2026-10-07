import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatAssistant from "./ChatAssistant";

const linkClass = ({ isActive }) =>
  `py-1 border-b-2 ${
    isActive
      ? "border-signal text-white"
      : "border-transparent text-white/70 hover:text-white"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/"
              className="flex items-center gap-2 font-display font-extrabold text-lg"
            >
              <span
                className="inline-block w-5 h-5 rounded-full border-4 border-signal"
                aria-hidden="true"
              />
              CivicLens AI
            </Link>
            {user.role === "citizen" ? (
              <>
                <NavLink to="/" end className={linkClass}>
                  My complaints
                </NavLink>
                <NavLink to="/new" className={linkClass}>
                  Report a problem
                </NavLink>
              </>
            ) : (
              <NavLink to="/admin" className={linkClass}>
                Dashboard
              </NavLink>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/70">{user.name}</span>
            <button
              onClick={handleLogout}
              className="border border-white/30 rounded px-3 py-1 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </nav>
        <div className="centerline" />
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {user.role === "citizen" && <ChatAssistant />}
    </div>
  );
}
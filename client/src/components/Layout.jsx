import { Link, Outlet, useNavigate } from "react-router-dom";
import ChatAssistant from "./ChatAssistant";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-blue-600 text-lg">
            CivicLens AI
          </Link>
                    {user.role === "citizen" ? (
            <>
              <Link to="/" className="text-gray-700 hover:text-blue-600">
                My Complaints
              </Link>
              <Link to="/new" className="text-gray-700 hover:text-blue-600">
                New Complaint
              </Link>
            </>
          ) : (
            <Link to="/admin" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
            {user.role === "citizen" && <ChatAssistant />}
    </div>
  );
}
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyComplaints from "./pages/MyComplaints";
import NewComplaint from "./pages/NewComplaint";
import AdminDashboard from "./pages/AdminDashboard";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();
  return user.role === "citizen" ? (
    <MyComplaints />
  ) : (
    <Navigate to="/admin" replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/new" element={<NewComplaint />} />
          <Route element={<ProtectedRoute roles={["admin", "officer"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
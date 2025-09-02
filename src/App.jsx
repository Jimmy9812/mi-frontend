import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      {/* opcional: 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

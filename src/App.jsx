import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Incidentes from "./pages/Incidentes.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";
import RoleSelector from "./components/RoleSelector.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user, showRoleSelector } = useAuth();
  
  return (
    <>
      {/* Solo mostrar RoleSelector si:
          1. Hay un usuario autenticado
          2. showRoleSelector es true
          3. No estamos en la página de login */}
      {user && 
       showRoleSelector && 
       !window.location.pathname.includes('/login') && 
       <RoleSelector />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/incidentes"
          element={
            <PrivateRoute>
              <Incidentes />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
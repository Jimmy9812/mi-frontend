import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Incidentes from "./pages/Incidentes";
import PrivateRoute from "./routes/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary"; // 👈 importar
import IncidenteEditor from "./pages/IncidenteEditor"; // 👈 nuevo


export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
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

          <Route
    path="/incidentes"
    element={
      <PrivateRoute>
        <Incidentes />
      </PrivateRoute>
    }
  />
  {/* 👇 nuevas rutas */}
  <Route
    path="/incidentes/nuevo"
    element={
      <PrivateRoute>
        <IncidenteEditor mode="create" />
      </PrivateRoute>
    }
  />
  <Route
    path="/incidentes/:id"
    element={
      <PrivateRoute>
        <IncidenteEditor mode="view" />
      </PrivateRoute>
    }
  />
  {/* ... */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

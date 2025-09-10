// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom"; 
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Incidentes from "./pages/Incidentes";
import Accidentes from "./pages/Accidentes"; // 👈 nuevo
import PrivateRoute from "./routes/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary"; 
import IncidenteEditor from "./pages/IncidenteEditor"; 
import AccidenteEditor from "./pages/AccidenteEditor"; // 👈 nuevo

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Lista de incidentes */}
          <Route
            path="/incidentes"
            element={
              <PrivateRoute>
                <Incidentes />
              </PrivateRoute>
            }
          />

          {/* Crear incidente */}
          <Route
            path="/incidentes/nuevo"
            element={
              <PrivateRoute>
                <IncidenteEditor mode="create" />
              </PrivateRoute>
            }
          />

          {/* Ver/editar incidente */}
          <Route
            path="/incidentes/:id"
            element={
              <PrivateRoute>
                <IncidenteEditor mode="view" />
              </PrivateRoute>
            }
          />

          {/* Lista de accidentes */}
          <Route
            path="/accidentes"
            element={
              <PrivateRoute>
                <Accidentes />
              </PrivateRoute>
            }
          />

          {/* Crear accidente */}
          <Route
            path="/accidentes/nuevo"
            element={
              <PrivateRoute>
                <AccidenteEditor mode="create" />
              </PrivateRoute>
            }
          />

          {/* Ver/editar accidente */}
          <Route
            path="/accidentes/:id"
            element={
              <PrivateRoute>
                <AccidenteEditor mode="view" />
              </PrivateRoute>
            }
          />

          {/* Cualquier otra ruta → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

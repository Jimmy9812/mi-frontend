import { Routes, Route, Navigate } from "react-router-dom"; 
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import DashboardHomePage from "./pages/DashboardHomePage";
import Incidentes from "./pages/Incidentes";
import Accidentes from "./pages/Accidentes";
import Externos from "./pages/Externos";
import ExternosEditor from "./pages/ExternoEditor";
import TestProduccion from "./pages/TestProduccion";
import PrivateRoute from "./routes/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary"; 
import IncidenteEditor from "./pages/IncidenteEditor";
import AccidenteEditor from "./pages/AccidenteEditor";
import TestProduccionEditor from "./pages/TestProduccionEditor";
import Sirecq from "./pages/Sirecq";
import SirecqEditor from "./pages/SirecqEditor";
import Error403 from "./pages/errors/Error403";
import GestionUsuarios from "./pages/GestionUsuarios";


export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Página de error 403 - NO protegida por PrivateRoute */}
          <Route path="/error/403" element={<Error403 />} />

          {/* Dashboard - Página principal con botones filtrados por rol */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* INCIDENTES */}
          <Route
            path="/incidentes"
            element={
              <PrivateRoute>
                <Incidentes />
              </PrivateRoute>
            }
          />
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

          {/* ACCIDENTES */}
          <Route
            path="/accidentes"
            element={
              <PrivateRoute>
                <Accidentes />
              </PrivateRoute>
            }
          />
          <Route
            path="/accidentes/nuevo"
            element={
              <PrivateRoute>
                <AccidenteEditor mode="create" />
              </PrivateRoute>
            }
          />
          <Route
            path="/accidentes/:id"
            element={
              <PrivateRoute>
                <AccidenteEditor mode="view" />
              </PrivateRoute>
            }
          />

          {/* TEST PRODUCCIÓN */}
          <Route
            path="/test-produccion"
            element={
              <PrivateRoute>
                <TestProduccion />
              </PrivateRoute>
            }
          />
          <Route
            path="/test-produccion/nuevo"
            element={
              <PrivateRoute>
                <TestProduccionEditor mode="create" />
              </PrivateRoute>
            }
          />
          <Route
            path="/test-produccion/:id"
            element={
              <PrivateRoute>
                <TestProduccionEditor mode="view" />
              </PrivateRoute>
            }
          />
          
          {/* EXTERNOS */}
          <Route
            path="/externos"
            element={
              <PrivateRoute>
                <Externos />
              </PrivateRoute>
            }
          />
          <Route
            path="/externos/nuevo"
            element={
              <PrivateRoute>
                <ExternosEditor mode="create" />
              </PrivateRoute>
            }
          />
          <Route
            path="/externos/:id"
            element={
              <PrivateRoute>
                <ExternosEditor mode="view" />
              </PrivateRoute>
            }
          />
          
          {/* DASHBOARD HOME */}
          <Route
            path="/dashboard-home"
            element={
              <PrivateRoute>
                <DashboardHomePage />
              </PrivateRoute>
            }
          />

          {/* SIREC-Q */}
          <Route
            path="/sirecq"
            element={
              <PrivateRoute>
                <Sirecq />
              </PrivateRoute>
            }
          />

          {/* GESTIÓN DE USUARIOS - solo admin */}
          <Route
            path="/gestion-usuarios"
            element={
              <PrivateRoute>
                <GestionUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/sirecq/nuevo"
            element={
              <PrivateRoute>
                <SirecqEditor mode="create" />
              </PrivateRoute>
            }
          />
          <Route
            path="/sirecq/:id"
            element={
              <PrivateRoute>
                <SirecqEditor mode="view" />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}
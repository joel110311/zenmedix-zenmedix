import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';
import { SettingsProvider } from './context/SettingsContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PatientLayout } from './components/layout/PatientLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/patients/PatientList';
import PatientForm from './pages/patients/PatientForm';

// V2 Pages
import PatientOverview from './pages/patient-profile/PatientOverview';
import PatientHistory from './pages/patient-profile/PatientHistory';
import ConsultationList from './pages/patient-profile/ConsultationList';
import NewConsultation from './pages/patient-profile/NewConsultation';
import LabResults from './pages/patient-profile/LabResults';
import EvolutionNotes from './pages/patient-profile/EvolutionNotes';
import PrintRecipe from './pages/print/PrintRecipe';
import PrintHistory from './pages/print/PrintHistory';
import PrintStudyRequest from './pages/print/PrintStudyRequest';

// V3 Pages
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import RecipeLayoutEditor from './pages/settings/RecipeLayoutEditor';
import AuditLogPage from './pages/admin/AuditLogPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <SettingsProvider>
          <PatientProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />

                {/* Patient Directory */}
                <Route path="pacientes" element={<PatientList />} />
                <Route path="pacientes/nuevo" element={<PatientForm />} />
                <Route path="pacientes/editar/:id" element={<PatientForm />} />

                {/* V3: Appointments */}
                <Route path="citas" element={<AppointmentsPage />} />

                {/* V3: Settings */}
                <Route path="configuracion" element={<SettingsPage />} />
                <Route path="configuracion/receta" element={<RecipeLayoutEditor />} />

                {/* V3: Audit Log - NOM-024 */}
                <Route path="auditoria" element={<AuditLogPage />} />

                {/* V2: Nested Patient Profile Routes */}
                <Route path="pacientes/:id" element={<PatientLayout />}>
                  <Route index element={<Navigate to="resumen" replace />} />
                  <Route path="resumen" element={<PatientOverview />} />
                  <Route path="antecedentes" element={<PatientHistory />} />
                  <Route path="historial" element={<ConsultationList />} />
                  <Route path="notas" element={<EvolutionNotes />} />
                  <Route path="consulta/nueva" element={<NewConsultation />} />
                  <Route path="analisis" element={<LabResults />} />
                </Route>
              </Route>

              {/* Print Views (No sidebar) */}
              <Route path="/imprimir/receta/:id" element={
                <ProtectedRoute>
                  <PrintRecipe />
                </ProtectedRoute>
              } />
              <Route path="/imprimir/historia/:id" element={
                <ProtectedRoute>
                  <PrintHistory />
                </ProtectedRoute>
              } />
              <Route path="/imprimir/solicitud/:id" element={
                <ProtectedRoute>
                  <PrintStudyRequest />
                </ProtectedRoute>
              } />
            </Routes>
          </PatientProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

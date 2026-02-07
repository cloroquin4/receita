import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PatientsPage } from './pages/PatientsPage'
import { PrescriptionFormPage } from './pages/PrescriptionFormPage'
import { PrescriptionsPage } from './pages/PrescriptionsPage'
import { MedicamentosPage } from './pages/MedicamentosPage'
import PrescriptionViewPage from './pages/PrescriptionViewPage'
import PrescriptionEditPage from './pages/PrescriptionEditPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/receitas" element={<PrescriptionsPage />} />
        <Route path="/pacientes" element={<PatientsPage />} />
        <Route path="/medicamentos" element={<MedicamentosPage />} />
        <Route path="/documentos" element={<DocumentsPage />} />
        <Route path="/receitas/nova/simples" element={<PrescriptionFormPage prescriptionType="simple" />} />
        <Route path="/receitas/nova/especial" element={<PrescriptionFormPage prescriptionType="special_control" />} />
        <Route path="/prescriptions/new" element={<PrescriptionFormPage prescriptionType="simple" />} />
        <Route path="/prescriptions/new/special" element={<PrescriptionFormPage prescriptionType="special_control" />} />
        <Route path="/receitas/:id" element={<PrescriptionViewPage />} />
        <Route path="/receitas/:id/editar" element={<PrescriptionEditPage />} />
        <Route path="/estatisticas" element={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><h2 className="text-2xl font-bold text-gray-900">Estatísticas</h2><p className="text-gray-600">Em desenvolvimento...</p></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

function AppWithProvider() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

export default AppWithProvider

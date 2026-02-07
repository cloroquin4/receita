// Rotas centralizadas da aplicação
export const ROUTES = {
  // Autenticação
  login: '/login',
  
  // Dashboard
  dashboard: '/dashboard',
  
  // Pacientes
  patients: '/pacientes',
  
  // Receitas
  prescriptions: '/receitas',
  prescriptionsNewSimple: '/receitas/nova/simples',
  prescriptionsNewSpecial: '/receitas/nova/especial',
  
  // Documentos
  documents: '/documentos',
  
  // API Endpoints
  api: {
    login: '/api/auth/login',
    profile: '/api/user/profile',
    prescriptions: '/api/prescriptions',
    patients: '/api/patients',
    patientsSearch: (term: string) => `/api/patients?search=${encodeURIComponent(term)}`,
  }
} as const

// Helper para navegação tipada
export const createRoute = (path: string) => path

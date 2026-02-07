import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FaFileMedical, 
  FaFlask, 
  FaClipboardList, 
  FaStethoscope, 
  FaUserMd, 
  FaNotesMedical, 
  FaPills, 
  FaUserPlus,
  FaSearch,
  FaChartBar,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa'
import { apiClient } from '../services/apiClient'
import { ROUTES } from '../config/routes'
import { useAuthToken } from '../hooks/useAuth'

interface Patient {
  id: string
  name: string
  cpf: string
  phone: string
  email?: string
}

interface Prescription {
  id: string
  type: 'simple' | 'special_control'
  instructions: string
  pdfUrl: string
  createdAt: string
  patient: {
    name: string
    cpf: string
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthToken()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Carregar receitas do backend apenas para stats
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!isAuthenticated()) {
        navigate(ROUTES.login, { replace: true })
        return
      }

      try {
        setStatsLoading(true)
        const data = await apiClient.get<Prescription[]>(ROUTES.api.prescriptions)
        setPrescriptions(data)
      } catch (err: any) {
        console.error('Erro ao carregar estatísticas:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchPrescriptions()
  }, [navigate, isAuthenticated])

  // Buscar pacientes para autocomplete (otimizado com AbortController)
  useEffect(() => {
    if (!isAuthenticated()) return
    
    // Cancelar requisição anterior se existir
    if (abortController) {
      abortController.abort()
    }
    
    if (searchTerm.trim() && searchTerm.trim().length >= 3) {
      const timeoutId = setTimeout(async () => {
        const controller = new AbortController()
        setAbortController(controller)
        
        try {
          setPatientsLoading(true)
          // Busca otimizada: backend filtra os pacientes
          const data = await (apiClient as any).get(ROUTES.api.patientsSearch(searchTerm.trim()), {
            signal: controller.signal
          })
          setPatients(data)
          setShowDropdown(true)
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('Erro ao buscar pacientes:', err)
            setPatients([])
            setShowDropdown(false)
          }
        } finally {
          setPatientsLoading(false)
        }
      }, 300) // Debounce de 300ms

      return () => {
        clearTimeout(timeoutId)
        if (abortController) {
          abortController.abort()
        }
      }
    } else {
      setPatients([])
      setShowDropdown(false)
      setAbortController(null)
    }
  }, [searchTerm, isAuthenticated])

  const handleSearchPatient = () => {
    if (searchTerm.trim()) {
      navigate(`/pacientes?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate('/pacientes')
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    // Ir para formulário de receita com paciente pré-selecionado
    navigate(ROUTES.prescriptionsNewSimple, { 
      state: { selectedPatient: patient } 
    })
    setShowDropdown(false)
  }

  const handleCreatePrescriptionForPatient = (patient: Patient) => {
    // Ir para formulário de receita especial com paciente pré-selecionado
    navigate(ROUTES.prescriptionsNewSpecial, { 
      state: { selectedPatient: patient } 
    })
    setShowDropdown(false)
  }

  // Estatísticas otimizadas com useMemo
  const stats = useMemo(() => {
    const totalPrescriptions = prescriptions.length
    const simplePrescriptions = prescriptions.filter(p => p.type === 'simple').length
    const specialControlPrescriptions = prescriptions.filter(p => p.type === 'special_control').length
    const thisMonthPrescriptions = prescriptions.filter(p => {
      const prescriptionDate = new Date(p.createdAt)
      const currentDate = new Date()
      return prescriptionDate.getMonth() === currentDate.getMonth() &&
             prescriptionDate.getFullYear() === currentDate.getFullYear()
    }).length

    return {
      totalPrescriptions,
      simplePrescriptions,
      specialControlPrescriptions,
      thisMonthPrescriptions
    }
  }, [prescriptions])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Moderno */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <FaChartBar className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-blue-100">Visão geral do seu sistema médico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total de Receitas */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <FaFileMedical className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total de Receitas</h3>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalPrescriptions}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FaCheckCircle className="text-green-500 mr-2" />
              Todos os documentos
            </div>
          </div>

          {/* Receitas Simples */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <FaNotesMedical className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Receitas Simples</h3>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.simplePrescriptions}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FaCheckCircle className="text-green-500 mr-2" />
              Prescrições padrão
            </div>
          </div>

          {/* Controle Especial */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                <FaPills className="text-red-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Controle Especial</h3>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.specialControlPrescriptions}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FaExclamationTriangle className="text-orange-500 mr-2" />
              Medicamentos controlados
            </div>
          </div>
        </div>

        {/* Busca Rápida de Paciente */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaSearch className="text-blue-600 text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Busca Rápida de Paciente</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Digite o CPF ou Nome do Paciente para buscá-lo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearchPatient()
                  }
                }}
                onFocus={() => searchTerm.length >= 3 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              
              {/* Dropdown Autocomplete */}
              {showDropdown && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {patients.map(patient => (
                    <div key={patient.id} className="border-b border-gray-100 last:border-b-0">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">CPF: {patient.cpf}</div>
                        </div>
                        {patient.phone && (
                          <div className="text-sm text-gray-400 mb-2">Tel: {patient.phone}</div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectPatient(patient)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            disabled={patientsLoading}
                          >
                            Receita Simples
                          </button>
                          <button
                            onClick={() => handleCreatePrescriptionForPatient(patient)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            disabled={patientsLoading}
                          >
                            Controle Especial
                          </button>
                          <button
                            onClick={() => {
                              navigate(`${ROUTES.patients}?search=${encodeURIComponent(patient.cpf)}`)
                              setShowDropdown(false)
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                          >
                            Ver Paciente
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearchPatient}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg flex items-center gap-2"
              disabled={statsLoading}
            >
              <FaSearch />
              {statsLoading ? 'Buscando...' : 'Buscar Paciente'}
            </button>
            <button
              onClick={() => navigate(ROUTES.patients)}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg flex items-center gap-2"
            >
              <FaUserPlus />
              Novo Paciente
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Use os cards abaixo para criar novos documentos ou vá para "Meus Documentos" para gerenciar os existentes
            </p>
          </div>
        </div>

        {/* Ações Rápidas - Criar Documentos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <FaFileMedical className="text-green-600 text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Criar Novo Documento</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(ROUTES.prescriptionsNewSimple)}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FaNotesMedical className="text-blue-600 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Receita Simples</h4>
                  <p className="text-sm text-gray-600">Prescrições médicas padrão</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">Rápido</span>
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => navigate(ROUTES.prescriptionsNewSpecial)}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <FaPills className="text-red-600 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Controle Especial</h4>
                  <p className="text-sm text-gray-600">Medicamentos controlados</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-medium">Restrito</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Outros Documentos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FaClipboardList className="text-purple-600 text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Outros Documentos</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => alert('Solicitação de Exame - em breve')}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50"
              disabled
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <FaClipboardList className="text-orange-600 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Solicitação de Exame</h4>
                  <p className="text-sm text-gray-600">Pedidos laboratoriais</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium">Em breve</span>
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => alert('Relatório Médico - em breve')}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-teal-300 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50"
              disabled
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <FaStethoscope className="text-teal-600 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Relatório Médico</h4>
                  <p className="text-sm text-gray-600">Avaliações clínicas</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">Em breve</span>
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => alert('Atestado de Saúde - em breve')}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50"
              disabled
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <FaUserMd className="text-emerald-600 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Atestado de Saúde</h4>
                  <p className="text-sm text-gray-600">Comprovações médicas</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">Em breve</span>
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => alert('Laudo Médico - em breve')}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50"
              disabled
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <FaFlask className="text-indigo-600 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Laudo Médico</h4>
                  <p className="text-sm text-gray-600">Diagnósticos detalhados</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">Em breve</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

export function PrescriptionsPage() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar receitas do backend
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const response = await fetch('http://localhost:5001/api/prescriptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar receitas')
        }

        const data = await response.json()
        setPrescriptions(data)
        setFilteredPrescriptions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar receitas')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [navigate])

  // Efeito para filtrar receitas baseado no termo de busca
  useEffect(() => {
    const filtered = prescriptions.filter(rx =>
      rx.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.patient.cpf.includes(searchTerm)
    )
    setFilteredPrescriptions(filtered)
  }, [prescriptions, searchTerm])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const onView = (id: string) => {
    navigate(`/receitas/${id}`)
  }

  const onEdit = (id: string) => {
    navigate(`/receitas/${id}/editar`)
  }

  const onReprint = (id: string) => {
    window.alert(`Reimprimir receita ${id} (ainda não implementado).`)
  }

  const onDelete = async (id: string) => {
    // Confirmação do usuário
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.\n\n' +
      '⚠️ ATENÇÃO: Esta exclusão é apenas local. A receita permanecerá no servidor até que o administrador implemente a exclusão no backend.'
    )
    
    if (!confirmed) {
      return
    }

    try {
      // Tenta excluir no backend (mas vai falhar)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      const apiUrl = `http://localhost:5001/api/prescriptions/${id}`
      
      let backendDeleted = false
      
      try {
        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          backendDeleted = true
        }
      } catch (backendError) {
        // Backend não responde ou endpoint não existe (esperado)
      }

      // Remove da lista local (independente do backend)
      setPrescriptions(prev => prev.filter(p => p.id !== id))
      setFilteredPrescriptions(prev => prev.filter(p => p.id !== id))

      // Feedback diferenciado
      if (backendDeleted) {
        window.alert('✅ Receita excluída com sucesso! (Removida do servidor e da lista)')
      } else {
        window.alert(
          '⚠️ Receita removida da lista localmente!\n\n' +
          'A exclusão no servidor ainda não está disponível. ' +
          'A receita pode reaparecer se você recarregar a página.\n\n' +
          'Entre em contato com o administrador para implementar a exclusão no backend.'
        )
      }
      
    } catch (err) {
      // Mesmo com erro, tenta remover localmente
      setPrescriptions(prev => prev.filter(p => p.id !== id))
      setFilteredPrescriptions(prev => prev.filter(p => p.id !== id))
      
      window.alert(
        '⚠️ Ocorreu um erro, mas a receita foi removida da lista local.\n\n' +
        'A receita pode reaparecer ao recarregar a página.\n' +
        'Erro: ' + (err instanceof Error ? err.message : 'Erro desconhecido')
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Minhas Receitas</h2>
          <p className="text-gray-600">Gerencie suas receitas médicas</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nova Receita
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Buscar por paciente ou CPF..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Receitas Recentes</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Carregando receitas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">❌ {error}</div>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {searchTerm ? 'Nenhuma receita encontrada para esta busca.' : 'Nenhuma receita encontrada.'}
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeira Receita
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{prescription.patient.name}</div>
                        <div className="text-sm text-gray-500">{prescription.patient.cpf}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prescription.type === 'special_control' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {prescription.type === 'special_control' ? 'Controle Especial' : 'Simples'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => onView(prescription.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Visualizar
                        </button>
                        <button
                          onClick={() => onEdit(prescription.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onReprint(prescription.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Reimprimir
                        </button>
                        <button
                          onClick={() => onDelete(prescription.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

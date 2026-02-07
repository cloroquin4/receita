import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface Medication {
  id?: string
  name: string
  dosage: string
  quantity: string
  instructions: string
}

interface Prescription {
  id: string
  type: 'simple' | 'special_control'
  instructions: string
  patient_id: string
  patient_name: string
  patient_cpf: string
  patient_phone: string
  patient_email?: string
  patient_address?: string
  patient_birthDate?: string
  medications: Medication[]
}

export default function PrescriptionEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [prescription, setPrescription] = useState<Prescription>({
    id: '',
    type: 'simple',
    instructions: '',
    patient_id: '',
    patient_name: '',
    patient_cpf: '',
    patient_phone: '',
    patient_email: '',
    patient_address: '',
    patient_birthDate: '',
    medications: [{ name: '', dosage: '', quantity: '', instructions: '' }]
  })

  useEffect(() => {
    const fetchPrescription = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Não autenticado')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/prescriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error('Receita não encontrada')
        }

        const data = await res.json()
        setPrescription(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar receita')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPrescription()
    }
  }, [id])

  const addMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', quantity: '', instructions: '' }]
    }))
  }

  const removeMedication = (index: number) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setError('Não autenticado')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: prescription.type,
          instructions: prescription.instructions,
          medications: prescription.medications
        }),
      })

      if (!res.ok) {
        throw new Error('Erro ao atualizar receita')
      }

      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar receita')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando receita...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-gray-800 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="ml-3 text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  Receit Médico
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Receita</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Editar Receita</h2>
          <p className="text-gray-600">Altere os dados da receita</p>
        </div>

        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-4xl mx-auto px-4">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Paciente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Dados do Paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={prescription.patient_name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={prescription.patient_cpf}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={prescription.patient_phone}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Tipo da Receita */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📄 Tipo da Receita</h2>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="simple"
                  checked={prescription.type === 'simple'}
                  onChange={() => setPrescription(prev => ({ ...prev, type: 'simple' }))}
                  className="mr-2"
                />
                Receita Simples
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="special_control"
                  checked={prescription.type === 'special_control'}
                  onChange={() => setPrescription(prev => ({ ...prev, type: 'special_control' }))}
                  className="mr-2"
                />
                Controle Especial
              </label>
            </div>
          </div>

          {/* Medicamentos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">💊 Medicamentos</h2>
              <button
                type="button"
                onClick={addMedication}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Adicionar Medicamento
              </button>
            </div>

            <div className="space-y-4">
              {prescription.medications.map((med, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Medicamento</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Ex: 500mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                      <input
                        type="text"
                        value={med.quantity}
                        onChange={(e) => updateMedication(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Ex: 30 comprimidos"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instruções</label>
                      <textarea
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={2}
                        placeholder="Ex: Tomar 1 comprimido a cada 8 horas"
                      />
                    </div>
                  </div>
                  {prescription.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="mt-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instruções Gerais */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📝 Instruções Gerais</h2>
            <textarea
              value={prescription.instructions}
              onChange={(e) => setPrescription(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Instruções gerais para o paciente..."
              required
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
        </div>
      </main>
    </div>
  )
}

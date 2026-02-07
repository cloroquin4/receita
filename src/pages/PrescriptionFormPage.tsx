import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MedicationAutocomplete } from '../components/MedicationAutocomplete'
import { MedicationSearchResult } from '../services/medicationService'

interface Patient {
  id: string
  name: string
  cpf: string
  phone: string
  email?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  quantity: string
  instructions?: string
}

interface PrescriptionFormPageProps {
  prescriptionType?: 'simple' | 'special_control'
}

export function PrescriptionFormPage({ prescriptionType }: PrescriptionFormPageProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Paciente
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [newPatient, setNewPatient] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    address: '',
    birthDate: '',
  })

  // Verificar se veio um paciente selecionado
  useEffect(() => {
    if (location.state?.selectedPatient) {
      const selectedPatient = location.state.selectedPatient
      
      setPatientMode('existing')
      setSelectedPatientId(selectedPatient.id)
      setPatientSearch(selectedPatient.name)
    }
  }, [location.state])

  // Receita - Sempre usar tipo predefinido (nunca mostrar seleção)
  const finalPrescriptionType = prescriptionType || 
    (location.state as any)?.prescriptionType || 
    'simple'
  
  const [instructions] = useState('')
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: '', dosage: '', quantity: '', instructions: '' },
  ])

  // Buscar pacientes
  useEffect(() => {
    if (patientSearch.trim() && patientSearch.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        const fetchPatients = async () => {
          const token = localStorage.getItem('auth_token')
          if (!token) return

          try {
            // Primeiro tenta buscar todos pacientes e filtrar no frontend
            const res = await fetch(`http://localhost:5001/api/patients`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
              const allPatients = await res.json()
              // Filtrar no frontend por nome ou CPF
              const filtered = allPatients.filter((patient: Patient) =>
                patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                patient.cpf.includes(patientSearch)
              )
              setPatients(filtered)
            }
          } catch {
            // Silenciar erros de busca
          }
        }
        fetchPatients()
      }, 300) // Debounce de 300ms

      return () => clearTimeout(timeoutId)
    } else {
      setPatients([])
    }
  }, [patientSearch])

  const addMedication = () => {
    setMedications([...medications, { id: Date.now().toString(), name: '', dosage: '', quantity: '', instructions: '' }])
  }

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id))
  }

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(prev => {
      const updated = prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
      return updated
    })
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setError('Não autenticado')
      setLoading(false)
      return
    }

    // Validações básicas
    if (patientMode === 'existing' && !selectedPatientId) {
      setError('Selecione um paciente')
      setLoading(false)
      return
    }

    if (patientMode === 'new' && (!newPatient.name || !newPatient.cpf || !newPatient.phone)) {
      setError('Preencha nome, CPF e telefone do paciente')
      setLoading(false)
      return
    }

    // Só valida medicamentos que têm nome preenchido OU outros campos preenchidos
    console.log('=== DEBUG MEDICAMENTOS ANTES DO FILTRO ===')
    console.log('Medications Array:', medications)
    console.log('Medications:', medications.map((m, i) => `${i}: "${m.name}" | Dosage: "${m.dosage}" | Qty: "${m.quantity}"`))
    
    const filledMeds = medications.filter(m => m.name.trim() || (m.dosage.trim() && m.quantity.trim()))
    console.log('FilledMeds:', filledMeds)
    console.log('FilledMeds count:', filledMeds.length)
    console.log('=====================================')
    
    if (filledMeds.length === 0) {
      setError('Adicione pelo menos um medicamento')
      setLoading(false)
      return
    }

    const invalidMed = filledMeds.find(m => !m.dosage || !m.quantity || !m.instructions?.trim())
    if (invalidMed) {
      setError('Preencha dosagem, quantidade e instruções de todos os medicamentos')
      setLoading(false)
      return
    }

    try {
      const body: any = {
        type: finalPrescriptionType,
        instructions: instructions.trim() || 'Prescrição médica', // Evitar enviar apenas espaços
        medications: filledMeds.map(({ id, ...m }) => m), // Só envia medicamentos preenchidos
      }

      if (patientMode === 'existing') {
        body.patientId = selectedPatientId
      } else {
        body.newPatient = {
          name: newPatient.name,
          cpf: newPatient.cpf,
          phone: newPatient.phone,
          ...(newPatient.email && { email: newPatient.email }),
          ...(newPatient.address && { address: newPatient.address }),
          ...(newPatient.birthDate && { birthDate: newPatient.birthDate }),
        }
      }

      console.log('=== ENVIANDO PARA API ===')
      console.log('FinalPrescriptionType:', finalPrescriptionType)
      console.log('Body:', JSON.stringify(body, null, 2))
      console.log('PatientMode:', patientMode)
      console.log('SelectedPatientId:', selectedPatientId)
      console.log('Total Medicamentos:', medications.length)
      console.log('Medicamentos Preenchidos:', filledMeds.length)
      console.log('Medicamentos Enviados:', filledMeds.map(({ id, ...m }) => m))
      console.log('========================')

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.log('=== ERRO DO BACKEND ===')
        console.log('Status:', res.status)
        console.log('Response:', err)
        console.log('=======================')
        throw new Error(err.message || 'Falha ao criar receita')
      }

      const data = await res.json()
      
      // Abrir PDF em nova aba
      if (data.pdfBase64) {
        // Converter base64 para Blob corretamente
        const byteCharacters = atob(data.pdfBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
      }
      
      setSuccess(true)
      setTimeout(() => navigate('/documentos'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar receita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Nova Receita</h2>
        <p className="text-gray-600">Crie uma nova receita médica</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✅ Receita criada com sucesso! Redirecionando...
          </div>
        ) : (
          <form className="space-y-8 max-w-6xl mx-auto" onSubmit={onSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Patient Selection - Layout Angular Style */}
            <div className="flex flex-row justify-between items-center p-3 gap-6 mb-2 rounded-lg bg-white border">
              <div className="w-full relative">
                {location.state?.selectedPatient ? (
                  // Paciente pré-selecionado - mostrar apenas visualização
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="font-medium text-gray-900">
                      {location.state.selectedPatient.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      CPF: {location.state.selectedPatient.cpf}
                    </div>
                  </div>
                ) : (
                  // Seleção normal de paciente
                  <>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      placeholder="Nome ou CPF do paciente (mínimo 3 caracteres)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Dropdown Autocomplete */}
                    {patients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {patients.map(patient => (
                          <div
                            key={patient.id}
                            onClick={() => {
                              setSelectedPatientId(patient.id)
                              setPatientSearch(`${patient.name} - ${patient.cpf}`)
                              setPatients([])
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">CPF: {patient.cpf}</div>
                            {patient.phone && (
                              <div className="text-sm text-gray-400">Tel: {patient.phone}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {/* Selected Patient Info */}
                {selectedPatientId && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-800 font-medium">
                      ✓ Paciente selecionado
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPatientMode('new')
                  setSelectedPatientId('')
                  setPatientSearch('')
                  setPatients([])
                }}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 font-medium"
              >
                + Novo Paciente
              </button>
            </div>

            {/* New Patient Form - Appears when button clicked */}
            {patientMode === 'new' && (
              <div className="flex flex-col p-4 gap-4 rounded-lg bg-white border">
                <h4 className="font-semibold text-gray-900">Dados do Novo Paciente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newPatient.name}
                    onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="Nome completo"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newPatient.cpf}
                    onChange={e => setNewPatient({ ...newPatient, cpf: formatCPF(e.target.value) })}
                    placeholder="CPF (000.000.000-00)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="Telefone"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="Email (opcional)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tipo de Receita - Sempre predefinido */}
            <div className="flex flex-col p-4 gap-4 rounded-lg bg-white border">
              <h3 className="font-semibold text-gray-900">Tipo de Receita</h3>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  finalPrescriptionType === 'simple' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <div className="font-medium text-gray-900">
                    {finalPrescriptionType === 'simple' ? 'Receita Simples' : 'Receita de Controle Especial'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {finalPrescriptionType === 'simple' ? 'Medicamentos comuns' : 'Medicamentos controlados'}
                  </div>
                </div>
              </div>
            </div>

            {/* Medications Section - Angular Style Layout */}
            <div className="flex flex-col p-4 gap-6 rounded-lg bg-white border">
              <div className="space-y-6">
                {medications.map((med) => (
                  <div key={med.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex flex-row items-center gap-4 mb-3">
                      <MedicationAutocomplete
                        value={med.name}
                        onChange={(value) => updateMedication(med.id, 'name', value)}
                        onSelect={(medication: MedicationSearchResult) => {
                          // Preencher dose e instruções padrão se existirem
                          updateMedication(med.id, 'name', medication.name)
                          if (medication.defaultDosage) {
                            updateMedication(med.id, 'dosage', medication.defaultDosage)
                          }
                          if (medication.defaultInstructions) {
                            updateMedication(med.id, 'instructions', medication.defaultInstructions)
                          }
                        }}
                        placeholder="Nome do medicamento ou substância"
                        className="flex-1"
                      />
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={e => updateMedication(med.id, 'dosage', e.target.value)}
                        placeholder="Dosagem/Concentração"
                        className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={med.quantity}
                        onChange={e => updateMedication(med.id, 'quantity', e.target.value)}
                        placeholder="Quantidade"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(med.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <textarea
                        rows={3}
                        value={med.instructions || ''}
                        onChange={e => updateMedication(med.id, 'instructions', e.target.value)}
                        placeholder="Administração, posologia, duração do tratamento e outras informações"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        maxLength={2000}
                      />
                      <small className="text-gray-500 text-sm mt-1">
                        {(med.instructions || '').length} de 2000 caracteres
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addMedication}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Adicionar medicamento
                </button>
              </div>

              {/* Dados Complementares */}
              <div className="flex flex-col rounded-lg p-4 gap-3 bg-gray-50">
                <p className="font-bold text-gray-900">Dados Complementares</p>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Imprimir CPF do paciente na receita
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Desejo que o endereço do paciente apareça na receita?
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/medicamentos')}
              >
                Biblioteca de Medicamentos
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Emitindo...' : 'Emitir Receita'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

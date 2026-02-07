import { useState, useEffect, useRef } from 'react'
import { medicationService, MedicationSearchResult, CreateMedicationData } from '../services/medicationService'

interface MedicationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (medication: MedicationSearchResult) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MedicationAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Nome do medicamento",
  disabled = false,
  className = ""
}: MedicationAutocompleteProps) {
  const [medications, setMedications] = useState<MedicationSearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showNewMedicationModal, setShowNewMedicationModal] = useState(false)
  const [justSelected, setJustSelected] = useState(false)
  const [forceClosed, setForceClosed] = useState(false)
  const [lastSelectedValue, setLastSelectedValue] = useState('')
  const [newMedicationData, setNewMedicationData] = useState<CreateMedicationData>({
    name: '',
    defaultDosage: '',
    defaultInstructions: ''
  })
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Buscar medicamentos com autocomplete
  useEffect(() => {
    // Se o valor for o mesmo que foi selecionado recentemente, não busca
    if (value === lastSelectedValue && lastSelectedValue.trim().length >= 2) {
      setMedications([])
      setShowDropdown(false)
      return
    }
    
    // Se o valor mudou e era diferente do último selecionado, reset
    if (lastSelectedValue && value !== lastSelectedValue) {
      setLastSelectedValue('')
    }
    
    if (!value || value.trim().length < 2 || forceClosed) {
      setMedications([])
      setShowDropdown(false)
      return
    }

    // Se acabou de selecionar, não faz nova busca por um tempo
    if (justSelected) {
      setMedications([])
      setShowDropdown(false)
      // Reset flag após um delay para evitar reabertura
      const timeoutId = setTimeout(() => {
        setJustSelected(false)
      }, 1000) // Espera 1 segundo antes de permitir novas buscas
      return () => clearTimeout(timeoutId)
    }

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        const results = await medicationService.searchMedications(value.trim())
        setMedications(results)
        setShowDropdown(true)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro ao buscar medicamentos:', err)
          setMedications([])
          setShowDropdown(false)
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [value, justSelected, forceClosed, lastSelectedValue])

  const handleSelectMedication = (medication: MedicationSearchResult) => {
    // Fecha dropdown imediatamente
    setShowDropdown(false)
    setMedications([])
    
    // Salva o valor selecionado para evitar nova busca
    setLastSelectedValue(medication.name)
    
    // Bloqueia qualquer nova busca por tempo suficiente
    setForceClosed(true)
    
    // Atualiza o valor
    onChange(medication.name)
    onSelect(medication)
    
    // Desbloqueia apenas quando usuário começar a digitar novamente
    setTimeout(() => {
      setForceClosed(false)
    }, 5000)
  }

  const handleAddNewMedication = () => {
    setNewMedicationData({
      name: value.trim(),
      defaultDosage: '',
      defaultInstructions: ''
    })
    setShowNewMedicationModal(true)
  }

  const handleSaveNewMedication = async () => {
    if (!newMedicationData.name.trim()) return

    try {
      setSaving(true)
      const newMedication = await medicationService.createMedication(newMedicationData)
      
      // Adicionar ao autocomplete e selecionar
      const medicationResult: MedicationSearchResult = {
        id: newMedication.id,
        name: newMedication.name,
        defaultDosage: newMedication.defaultDosage,
        defaultInstructions: newMedication.defaultInstructions
      }
      
      handleSelectMedication(medicationResult)
      setShowNewMedicationModal(false)
      setNewMedicationData({ name: '', defaultDosage: '', defaultInstructions: '' })
    } catch (err) {
      console.error('Erro ao salvar medicamento:', err)
      alert('Erro ao salvar medicamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleUseOnlyThisTime = () => {
    const medicationResult: MedicationSearchResult = {
      id: `temp-${Date.now()}`,
      name: newMedicationData.name.trim(),
      defaultDosage: newMedicationData.defaultDosage,
      defaultInstructions: newMedicationData.defaultInstructions
    }
    
    handleSelectMedication(medicationResult)
    setShowNewMedicationModal(false)
    setNewMedicationData({ name: '', defaultDosage: '', defaultInstructions: '' })
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />

      {/* Dropdown de autocomplete */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-sm">Buscando...</div>
          ) : medications.length > 0 ? (
            medications.map(medication => (
              <div
                key={medication.id}
                onMouseDown={() => handleSelectMedication(medication)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{medication.name}</div>
                {medication.defaultDosage && (
                  <div className="text-sm text-gray-500">Dose: {medication.defaultDosage}</div>
                )}
                {medication.defaultInstructions && (
                  <div className="text-sm text-gray-400">Instruções: {medication.defaultInstructions}</div>
                )}
              </div>
            ))
          ) : value.length >= 2 ? (
            <div
              onMouseDown={() => handleAddNewMedication()}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-blue-600 text-sm"
            >
              Adicionar '{value}' como novo medicamento
            </div>
          ) : null}
        </div>
      )}

      {/* Modal para novo medicamento */}
      {showNewMedicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Medicamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Medicamento
                </label>
                <input
                  type="text"
                  value={newMedicationData.name}
                  onChange={(e) => setNewMedicationData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Paracetamol"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose Padrão (opcional)
                </label>
                <input
                  type="text"
                  value={newMedicationData.defaultDosage}
                  onChange={(e) => setNewMedicationData(prev => ({ ...prev, defaultDosage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 500mg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instruções Padrão (opcional)
                </label>
                <textarea
                  value={newMedicationData.defaultInstructions}
                  onChange={(e) => setNewMedicationData(prev => ({ ...prev, defaultInstructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ex: Tomar 8/8 horas por 7 dias"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewMedicationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUseOnlyThisTime}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Usar só desta vez
              </button>
              <button
                onClick={handleSaveNewMedication}
                disabled={saving || !newMedicationData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar na biblioteca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

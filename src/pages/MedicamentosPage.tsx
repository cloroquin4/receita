import { useState, useEffect } from 'react'
import { medicationService, Medication } from '../services/medicationService'

export function MedicamentosPage() {
  
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    defaultDosage: '',
    defaultInstructions: ''
  })

  // Carregar medicamentos
  const loadMedications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await medicationService.getUserMedications()
      setMedications(data)
      setFilteredMedications(data)
    } catch (err) {
      setError('Erro ao carregar medicamentos')
      console.error('Erro ao carregar medicamentos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedications()
  }, [])

  // Filtrar medicamentos
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMedications(medications)
    } else {
      const filtered = medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMedications(filtered)
    }
  }, [searchTerm, medications])

  // Abrir modal de adicionar
  const handleAdd = () => {
    setFormData({
      name: '',
      defaultDosage: '',
      defaultInstructions: ''
    })
    setShowAddModal(true)
  }

  // Abrir modal de editar
  const handleEdit = (medication: Medication) => {
    setSelectedMedication(medication)
    setFormData({
      name: medication.name,
      defaultDosage: medication.defaultDosage || '',
      defaultInstructions: medication.defaultInstructions || ''
    })
    setShowEditModal(true)
  }

  // Abrir modal de excluir
  const handleDelete = (medication: Medication) => {
    setSelectedMedication(medication)
    setShowDeleteModal(true)
  }

  // Salvar novo medicamento
  const handleSaveAdd = async () => {
    if (!formData.name.trim()) {
      setError('Nome do medicamento é obrigatório')
      return
    }

    try {
      await medicationService.createMedication(formData)
      setShowAddModal(false)
      await loadMedications()
      setError(null)
    } catch (err) {
      setError('Erro ao salvar medicamento')
      console.error('Erro ao salvar medicamento:', err)
    }
  }

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!formData.name.trim()) {
      setError('Nome do medicamento é obrigatório')
      return
    }

    try {
      // TODO: Implementar updateMedication no service
      setShowEditModal(false)
      await loadMedications()
      setError(null)
    } catch (err) {
      setError('Erro ao atualizar medicamento')
      console.error('Erro ao atualizar medicamento:', err)
    }
  }

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!selectedMedication) return

    try {
      // TODO: Implementar deleteMedication no service
      setShowDeleteModal(false)
      await loadMedications()
      setSelectedMedication(null)
      setError(null)
    } catch (err) {
      setError('Erro ao excluir medicamento')
      console.error('Erro ao excluir medicamento:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Medicamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus medicamentos personalizados para prescrição rápida</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Adicionar Medicamento
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Medications List */}
            {filteredMedications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  {searchTerm ? 'Nenhum medicamento encontrado' : 'Nenhum medicamento cadastrado'}
                </div>
                {!searchTerm && (
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Adicionar seu primeiro medicamento
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dose Padrão
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instruções Padrão
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Cadastro
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMedications.map((medication) => (
                        <tr key={medication.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{medication.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.defaultDosage || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {medication.defaultInstructions || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(medication.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(medication)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(medication)}
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
              </div>
            )}
          </>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Medicamento</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Medicamento *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.defaultDosage}
                    onChange={(e) => setFormData({ ...formData, defaultDosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instruções Padrão (opcional)
                  </label>
                  <textarea
                    value={formData.defaultInstructions}
                    onChange={(e) => setFormData({ ...formData, defaultInstructions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ex: Tomar 8/8 horas por 7 dias"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedMedication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Medicamento</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Medicamento *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dose Padrão (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.defaultDosage}
                    onChange={(e) => setFormData({ ...formData, defaultDosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instruções Padrão (opcional)
                  </label>
                  <textarea
                    value={formData.defaultInstructions}
                    onChange={(e) => setFormData({ ...formData, defaultInstructions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedMedication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Excluir Medicamento</h3>
              
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir "{selectedMedication.name}"? Esta ação não pode ser desfeita.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FaPills, 
  FaWhatsapp, 
  FaEnvelope, 
  FaEdit, 
  FaEye, 
  FaCopy, 
  FaTimes, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaArrowLeft,
  FaPlus,
  FaFilter,
  FaFileMedical
} from 'react-icons/fa'

interface Document {
  id: string
  type: 'prescription' | 'medical_certificate' | 'medical_report' | 'exam_request' | 'special_control'
  title: string
  patientName: string
  patientCpf: string
  createdAt: string
  status: 'draft' | 'completed' | 'signed'
  doctorName: string
  doctorCrm: string
  location: string
  hasMedications: boolean
}

type SortField = 'dhDocumento' | 'paciente' | 'unidadeAtendimento' | 'situacao' | 'tipoDocumentoId'
type SortDirection = 'asc' | 'desc'

export function DocumentsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('dhDocumento')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Filtros avançados
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Modal
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false)

  const handleNewDocument = () => {
    setShowNewDocumentModal(true)
  }

  const handleCloseModal = () => {
    setShowNewDocumentModal(false)
  }

  const handleSelectDocumentType = (type: string) => {
    const routeMap: { [key: string]: string } = {
      'simples': '/receitas/nova/simples',
      'antimicrobiano': '/receitas/nova/simples',
      'controle-especial': '/receitas/nova/especial',
      'solicitacao-exame': '/receitas/nova/simples',
      'relatorio-medico': '/receitas/nova/simples',
      'laudo-medico': '/receitas/nova/simples',
      'atestado-saude': '/receitas/nova/simples'
    }
    
    const route = routeMap[type] || '/receitas/nova/simples'
    navigate(route)
    setShowNewDocumentModal(false)
  }

  useEffect(() => {
    const userData = localStorage.getItem('user_profile')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5001/api/prescriptions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      const prescriptionDocuments: Document[] = data.map((prescription: any) => ({
        id: prescription.id,
        type: prescription.type === 'special_control' ? 'special_control' : 'prescription',
        title: `Receita - ${prescription.patient.name}`,
        patientName: prescription.patient.name,
        patientCpf: prescription.patient.cpf,
        createdAt: prescription.createdAt,
        status: 'signed' as const,
        doctorName: user?.name || 'Médico',
        doctorCrm: user?.crm || 'CRM',
        location: 'S.B. SERVIÇOS MÉDICOS',
        hasMedications: prescription.type === 'special_control'
      }))

      setDocuments(prescriptionDocuments)
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const documentTypeLabels: { [key: string]: string } = {
    prescription: 'Receita Simples',
    special_control: 'Receita de Controle Especial',
    medical_certificate: 'Atestado Médico',
    medical_report: 'Relatório Médico',
    exam_request: 'Solicitação De Exame'
  }

  const statusLabels = {
    draft: 'Rascunho',
    completed: 'Concluído',
    signed: 'Assinado'
  }

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortDirection === 'asc'
    setSortDirection(isAsc ? 'desc' : 'asc')
    setSortField(field)
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    if (!sortDirection) return 0
    
    let aValue: any
    let bValue: any
    
    switch (sortField) {
      case 'dhDocumento':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'paciente':
        aValue = a.patientName.toLowerCase()
        bValue = b.patientName.toLowerCase()
        break
      case 'unidadeAtendimento':
        aValue = a.location.toLowerCase()
        bValue = b.location.toLowerCase()
        break
      case 'situacao':
        aValue = a.status
        bValue = b.status
        break
      case 'tipoDocumentoId':
        aValue = documentTypeLabels[a.type]
        bValue = documentTypeLabels[b.type]
        break
      default:
        return 0
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })

  // Aplicar filtros
  const filteredDocuments = sortedDocuments.filter(doc => {
    const matchesType = filterType === 'all' || doc.type === filterType
    const matchesSearch = searchTerm === '' || 
                         doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.patientCpf.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus
    
    let matchesDateRange = true
    if (startDate || endDate) {
      const docDate = new Date(doc.createdAt)
      if (startDate) {
        matchesDateRange = matchesDateRange && docDate >= new Date(startDate)
      }
      if (endDate) {
        matchesDateRange = matchesDateRange && docDate <= new Date(endDate + 'T23:59:59')
      }
    }
    
    return matchesType && matchesSearch && matchesStatus && matchesDateRange
  })

  // Paginação
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDocumentIds = new Set(documents.map(doc => doc.id))
      setSelectedDocuments(allDocumentIds)
    } else {
      setSelectedDocuments(new Set())
    }
  }

  const handleSelectDocument = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedDocuments(newSelected)
  }

  const handleViewDocument = async (document: Document) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('Token não encontrado')
        return
      }

      const res = await fetch(`/api/prescriptions/${document.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Documento não encontrado')
      }

      const data = await res.json()
      
      const binaryString = atob(data.pdfBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      window.open(pdfUrl, '_blank')
      
    } catch (err) {
      console.error('Erro ao abrir documento:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="text-gray-400 text-xs" />
    if (sortDirection === 'asc') return <FaSortUp className="text-blue-600 text-xs" />
    if (sortDirection === 'desc') return <FaSortDown className="text-blue-600 text-xs" />
    return <FaSort className="text-gray-400 text-xs" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Moderno */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Integrado */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <a href="/dashboard" className="text-blue-100 hover:text-white flex items-center gap-1 transition-colors">
                  <FaArrowLeft className="w-3 h-3" />
                  Início
                </a>
              </li>
              <li className="text-blue-200">/</li>
              <li className="text-white font-medium">Meus Documentos Médicos</li>
            </ol>
          </nav>

          {/* Título e Botão */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <FaFileMedical className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Meus Documentos</h1>
                <p className="text-blue-100">Gerencie todos os seus documentos médicos em um só lugar</p>
              </div>
            </div>
            <button 
              onClick={handleNewDocument}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium shadow-lg"
            >
              <FaPlus />
              Novo Documento
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filtros Avançados - Design Moderno */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaFilter className="text-blue-600 text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">Todos</option>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Busca por CPF ou Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
              <input
                type="text"
                placeholder="CPF ou Nome"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Situação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Situação</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">Todas</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela Moderna */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Lista de Documentos</h3>
              <div className="text-sm text-gray-500">
                {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {/* Checkbox */}
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedDocuments.size === documents.length && documents.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>

                  {/* Data */}
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('dhDocumento')}
                      className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Data
                      {getSortIcon('dhDocumento')}
                    </button>
                  </th>

                  {/* Paciente */}
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('paciente')}
                      className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Paciente
                      {getSortIcon('paciente')}
                    </button>
                  </th>

                  {/* Local Atendimento */}
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('unidadeAtendimento')}
                      className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Local
                      {getSortIcon('unidadeAtendimento')}
                    </button>
                  </th>

                  {/* Situação */}
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('situacao')}
                      className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Situação
                      {getSortIcon('situacao')}
                    </button>
                  </th>

                  {/* Tipo de Documento */}
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('tipoDocumentoId')}
                      className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Tipo
                      {getSortIcon('tipoDocumentoId')}
                    </button>
                  </th>

                  {/* Ações */}
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhum documento encontrado
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      {/* Checkbox */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedDocuments.has(document.id)}
                          onChange={(e) => handleSelectDocument(document.id, e.target.checked)}
                        />
                      </td>

                      {/* Data */}
                      <td className="px-6 py-4 text-xs text-gray-900 whitespace-nowrap">
                        {formatDate(document.createdAt)}
                      </td>

                      {/* Paciente */}
                      <td className="px-6 py-4 text-xs text-gray-900">
                        {document.patientName}
                      </td>

                      {/* Local Atendimento */}
                      <td className="px-6 py-4 text-xs text-gray-900">
                        {document.location}
                      </td>

                      {/* Situação */}
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {statusLabels[document.status]}
                        </span>
                      </td>

                      {/* Tipo de Documento */}
                      <td className="px-6 py-4 text-xs text-gray-900">
                        <div className="flex items-center gap-2">
                          {document.hasMedications && (
                            <FaPills className="text-blue-600" title="Medicamentos controlados" />
                          )}
                          {documentTypeLabels[document.type]}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* WhatsApp (desabilitado) */}
                          <div className="relative group">
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                              disabled
                              title="Paciente sem telefone"
                            >
                              <FaWhatsapp />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Paciente sem telefone
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="relative group">
                            <button
                              className="p-2 text-green-600 hover:text-green-700 transition-colors"
                              title="Enviar documento"
                            >
                              <FaEnvelope />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Enviar documento
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>

                          {/* Editar (desabilitado) */}
                          <div className="relative group">
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                              disabled
                              title="Não é possível editar um documento assinado"
                            >
                              <FaEdit />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Não é possível editar um documento assinado
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>

                          {/* Visualizar */}
                          <div className="relative group">
                            <button
                              onClick={() => handleViewDocument(document)}
                              className="p-2 text-green-600 hover:text-green-700 transition-colors"
                              title="Visualizar"
                            >
                              <FaEye />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Visualizar documento
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>

                          {/* Copiar */}
                          <div className="relative group">
                            <button
                              className="p-2 text-green-600 hover:text-green-700 transition-colors"
                              title="Gerar Cópia"
                            >
                              <FaCopy />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Gerar cópia
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>

                          {/* Excluir */}
                          <div className="relative group">
                            <button
                              className="p-2 text-red-600 hover:text-red-700 transition-colors"
                              title="Excluir"
                            >
                              <FaTimes />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Excluir documento
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação Moderna */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredDocuments.length)} de {filteredDocuments.length} resultados
              </div>
              
              <div className="flex items-center gap-2">
                {/* Itens por página */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                
                {/* Navegação */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Primeira página"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Página anterior"
                >
                  ‹
                </button>
                
                <span className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Próxima página"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Última página"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão de assinar documentos (se selecionados) */}
        {selectedDocuments.size > 0 && (
          <div className="fixed bottom-4 right-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              Assinar {selectedDocuments.size} documento{selectedDocuments.size > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Modal Novo Documento - Design Moderno */}
        {showNewDocumentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
              {/* Header Moderno */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaPlus className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Criar Novo Documento</h3>
                      <p className="text-blue-100 text-sm mt-1">Escolha o tipo de documento médico</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group"
                  >
                    <FaTimes className="text-white text-lg group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>

              {/* Conteúdo com Cards Modernos */}
              <div className="p-6 bg-gray-50">
                {/* Receituários */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaFileMedical className="text-blue-600 text-sm" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Receituários</h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleSelectDocumentType('simples')}
                      className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <FaFileMedical className="text-blue-600 text-lg" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">Receita Simples</h5>
                          <p className="text-sm text-gray-600">Prescrições médicas padrão</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">Comum</span>
                            <span className="text-xs text-gray-400">Rápido</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectDocumentType('controle-especial')}
                      className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <FaPills className="text-red-600 text-lg" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">Controle Especial</h5>
                          <p className="text-sm text-gray-600">Medicamentos controlados</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-medium">Restrito</span>
                            <span className="text-xs text-gray-400">Seguro</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Moderno */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Todos os documentos são gerados com assinatura digital</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function PrescriptionViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfOpened, setPdfOpened] = useState(false)

  useEffect(() => {
    const fetchAndOpenPDF = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Não autenticado')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/prescriptions/${id}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error('Receita não encontrada')
        }

        const data = await res.json()
        
        // Converter base64 para blob corretamente
        const binaryString = atob(data.pdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
        const pdfUrl = URL.createObjectURL(pdfBlob)
        
        // Abrir em nova aba
        window.open(pdfUrl, '_blank')
        
        // Marcar que PDF foi aberto
        setPdfOpened(true)
        setLoading(false)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar receita')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchAndOpenPDF()
    }
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documento...</p>
          <p className="text-sm text-gray-500 mt-2">O PDF abrirá em nova aba para visualização</p>
        </div>
      </div>
    )
  }

  if (pdfOpened) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Documento aberto com sucesso!</h2>
          <p className="text-gray-600 mb-6">O PDF foi aberto em uma nova aba para visualização.</p>
          <button
            onClick={() => navigate('/documentos')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar para Meus Documentos
          </button>
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

  // Se chegou aqui, o PDF foi aberto com sucesso
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
              <h1 className="text-3xl font-bold text-gray-900">Visualizar Receita</h1>
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
          <h2 className="text-2xl font-bold text-gray-900">Visualizar Receita</h2>
          <p className="text-gray-600">Veja os detalhes da receita</p>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-green-500 text-xl mb-4">✅</div>
            <p className="text-gray-800 font-medium mb-4">PDF aberto com sucesso!</p>
            <p className="text-sm text-gray-600 mb-6">O PDF foi aberto em nova aba para visualização</p>
            <p className="text-xs text-gray-500 mb-6">Use Ctrl+P ou o botão de impressão do navegador para imprimir</p>
          </div>
        </div>
      </main>
    </div>
  )
}

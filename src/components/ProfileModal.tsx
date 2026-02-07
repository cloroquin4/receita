import { useState } from 'react'
import { User } from '../types/User'

interface ProfileModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSave: (updatedUser: Partial<User>) => void
}

export function ProfileModal({ user, isOpen, onClose, onSave }: ProfileModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    name: user.name,
    email: user.email,
    crm: user.crm
    // Removido specialty e phone porque não existem no backend
  })
  
  // Separar CRM em número e estado
  const [crmNumber, setCrmNumber] = useState(() => {
    let crmValue = user.crm || ''
    console.log('CRM original:', crmValue)
    
    // Remover prefixo "CRM-" se existir
    crmValue = crmValue.replace(/^CRM-/i, '')
    console.log('CRM sem prefixo:', crmValue)
    
    // Tentar diferentes formatos
    // Formato 1: "MT 17163" (estado espaço número)
    let parts = crmValue.split(' ')
    if (parts.length >= 2) {
      const number = parts[1]?.trim()
      console.log('Número extraído (formato 1):', number)
      return number || ''
    }
    
    // Formato 2: "17163 MT" (número espaço estado)
    parts = crmValue.split(' ')
    if (parts.length >= 2) {
      const number = parts[0]?.trim()
      console.log('Número extraído (formato 2):', number)
      return number || ''
    }
    
    // Formato 3: "17163-MT" (número hífen estado)
    parts = crmValue.split('-')
    if (parts.length >= 2) {
      const number = parts[0]?.trim()
      console.log('Número extraído (formato 3):', number)
      return number || ''
    }
    
    // Se não conseguir separar, assume que é só o número
    console.log('Número não separado, usando CRM completo:', crmValue.trim())
    return crmValue.trim()
  })
  
  const [crmState, setCrmState] = useState(() => {
    let crmValue = user.crm || ''
    console.log('CRM original para estado:', crmValue)
    
    // Remover prefixo "CRM-" se existir
    crmValue = crmValue.replace(/^CRM-/i, '')
    console.log('CRM sem prefixo para estado:', crmValue)
    
    // Tentar diferentes formatos
    // Formato 1: "MT 17163" (estado espaço número)
    let parts = crmValue.split(' ')
    if (parts.length >= 2) {
      const state = parts[0]?.trim()
      console.log('Estado extraído (formato 1):', state)
      return state || ''
    }
    
    // Formato 2: "17163 MT" (número espaço estado)
    parts = crmValue.split(' ')
    if (parts.length >= 2) {
      const state = parts[1]?.trim()
      console.log('Estado extraído (formato 2):', state)
      return state || ''
    }
    
    // Formato 3: "17163-MT" (número hífen estado)
    parts = crmValue.split('-')
    if (parts.length >= 2) {
      const state = parts[1]?.trim()
      console.log('Estado extraído (formato 3):', state)
      return state || ''
    }
    
    // Se não conseguir separar, deixar vazio para usuário selecionar
    console.log('Estado não separado, deixando vazio')
    return ''
  })
  
  // Estados brasileiros
  const brazilianStates = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
  ]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('=== SUBMIT PERFIL ===')
    console.log('formData:', formData)
    console.log('crmNumber:', crmNumber)
    console.log('crmState:', crmState)
    console.log('crmNumber.trim():', crmNumber?.trim())
    console.log('crmState.trim():', crmState?.trim())

    try {
      // Validações básicas
      if (!formData.name?.trim()) {
        setError('Nome é obrigatório')
        setLoading(false)
        return
      }

      if (!formData.email?.trim()) {
        setError('Email é obrigatório')
        setLoading(false)
        return
      }

      // Validar formato do CRM (número + estado)
      if (!crmNumber?.trim()) {
        console.log('❌ Número do CRM vazio')
        setError('Número do CRM é obrigatório')
        setLoading(false)
        return
      }

      if (!crmState?.trim()) {
        console.log('❌ Estado do CRM vazio')
        setError('Estado do CRM é obrigatório')
        setLoading(false)
        return
      }

      console.log('✅ Validações passaram!')

      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        setError('Email inválido')
        setLoading(false)
        return
      }

      // Construir CRM final
      const finalCrm = `CRM-${crmState?.trim()} ${crmNumber?.trim()}`
      console.log('CRM final que será enviado:', finalCrm)

      // Dados finais para salvar (apenas campos que existem no backend)
      const updatedData = { 
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        crm: finalCrm
      }

      // Abordagem HÍBRIDA: Tenta backend, fallback localStorage
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        console.log('🔄 Tentando salvar no backend...')
        try {
          const response = await fetch('http://localhost:5001/api/user/profile', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
          })

          if (response.ok) {
            const backendData = await response.json()
            console.log('✅ Salvo no backend com sucesso:', backendData)
            
            // Sincroniza localStorage com dados do backend
            localStorage.setItem('user_profile', JSON.stringify(backendData))
            onSave(backendData)
            onClose()
            
            console.log('🎯 Dados sincronizados: Backend + LocalStorage')
            return
          } else {
            console.log('⚠️ Backend retornou erro, usando fallback localStorage')
          }
        } catch (backendError) {
          console.log('❌ Erro no backend, usando fallback localStorage:', backendError)
        }
      }

      // Fallback: Salva apenas no localStorage
      console.log('💾 Salvando no localStorage (fallback):', updatedData)
      localStorage.setItem('user_profile', JSON.stringify(updatedData))
      
      onSave(updatedData)
      onClose()
      
      console.log('✅ Perfil salvo no localStorage (modo offline)')
      
    } catch (err) {
      console.error('❌ Erro geral:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dr(a). Nome Sobrenome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRM (Número)
              </label>
              <input
                type="text"
                value={crmNumber || ''}
                onChange={(e) => setCrmNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="17163"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRM (Estado)
              </label>
              <select
                value={crmState || ''}
                onChange={(e) => setCrmState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {brazilianStates.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label} ({state.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidade
            </label>
            <input
              type="text"
              value={formData.specialty || ''}
              onChange={(e) => handleChange('specialty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Clínico Geral, Cardiologista, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

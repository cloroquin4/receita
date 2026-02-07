import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types/User'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
  updateProfile: (updatedUser: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar dados do usuário ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setLoading(false)
          return
        }

        // 1. Tentar usar localStorage primeiro
        const savedProfile = localStorage.getItem('user_profile')
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile)
            if (parsedProfile.name && parsedProfile.name !== 'Carregando...' && parsedProfile.crm) {
              setUser(parsedProfile)
              setLoading(false)
              return
            }
          } catch (err) {
            console.error('Erro ao carregar perfil do localStorage:', err)
          }
        }

        // 2. Se não tiver dados bons, buscar do backend
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5001'
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          localStorage.setItem('user_profile', JSON.stringify(userData))
        } else {
          console.log('Response não OK, mantendo dados atuais do localStorage')
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = (token: string) => {
    localStorage.setItem('auth_token', token)
    window.dispatchEvent(new Event('auth_changed'))
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_profile')
    setUser(null)
    window.dispatchEvent(new Event('auth_changed'))
  }

  const updateProfile = async (updatedUser: Partial<User>) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const currentUser = { ...user, ...updatedUser } as User
      
      // Abordagem HÍBRIDA: Tenta backend, fallback localStorage
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5001'
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currentUser)
        })

        if (response.ok) {
          const backendData = await response.json()
          setUser(backendData)
          localStorage.setItem('user_profile', JSON.stringify(backendData))
          console.log('✅ Layout: Sincronizado com backend')
          return
        } else {
          console.log('⚠️ Layout: Backend erro, usando localStorage')
        }
      } catch (backendError) {
        console.log('❌ Layout: Erro backend, usando localStorage:', backendError)
      }

      // Fallback: Salva no localStorage
      setUser(currentUser)
      localStorage.setItem('user_profile', JSON.stringify(currentUser))
      console.log('✅ Layout: Perfil atualizado no localStorage')
      
    } catch (error) {
      console.error('❌ Layout: Erro geral:', error)
      // Fallback final
      const newUser = { ...user, ...updatedUser } as User
      setUser(newUser)
      localStorage.setItem('user_profile', JSON.stringify(newUser))
      console.log('⚠️ Layout: Atualizado mesmo com erro')
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

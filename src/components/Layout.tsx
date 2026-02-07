import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUserMd } from 'react-icons/fa'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ProfileModal } from './ProfileModal'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { user, loading, updateProfile, logout } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <Topbar onMobileMenuToggle={setIsMobileMenuOpen} />

        {/* Container Principal */}
        <div className="flex">
          {/* Sidebar */}
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            <Sidebar />
          </div>
          
          {/* Conteúdo Principal */}
          <main className="flex-1 min-h-screen">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Carregando...</div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div className="md:hidden bg-blue-700 border-t border-blue-800">
            <div className="px-4 py-3">
              {/* Informações do Médico Mobile */}
              <div className="flex items-center bg-white/10 px-4 py-3 rounded-lg mb-3">
                <FaUserMd className="text-white mr-3 text-lg" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-blue-100">CRM: {user?.crm}</p>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-white">Online</span>
                </div>
              </div>
              
              {/* Menu Mobile Items */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/dashboard')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  🏠 Início
                </button>
                <button 
                  onClick={() => {
                    navigate('/prescriptions/new')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  📝 Nova Prescrição
                </button>
                <button 
                  onClick={() => {
                    navigate('/patients')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  👥 Pacientes
                </button>
                <button 
                  onClick={() => {
                    navigate('/documentos')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  📄 Documentos
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  🚪 Sair
                </button>
              </div>
            </div>
          </div>

          {/* Overlay escuro para fechar menu */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </>
      )}
      </div>

      {/* Modal de Perfil */}
      {isModalOpen && user && (
        <ProfileModal
          user={user}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={updateProfile}
        />
      )}
    </>
  )
}

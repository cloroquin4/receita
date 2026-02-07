import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBars, FaTimes, FaFileMedical, FaUserMd, FaChevronDown } from 'react-icons/fa'
import { UserProfileDropdown } from './UserProfileDropdown'
import { ProfileModal } from './ProfileModal'
import { useAuth } from '../contexts/AuthContext'

interface TopbarProps {
  onMobileMenuToggle?: (isOpen: boolean) => void
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const navigate = useNavigate()
  const { user, logout, updateProfile } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)
    onMobileMenuToggle?.(newState)
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b border-blue-800 relative z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Hambúrguer */}
          <div className="flex items-center flex-1">
            {/* Botão Hambúrguer Mobile */}
            <button 
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors mr-2"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="text-xl" />
              ) : (
                <FaBars className="text-xl" />
              )}
            </button>
            
            {/* Logo */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <FaFileMedical className="text-white text-lg" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold">Receit Médico</h1>
                <p className="text-xs text-blue-100">Sistema de Prescrições</p>
              </div>
            </button>
          </div>

          {/* Informações do Médico - Desktop com Dropdown Integrado */}
          <div className="hidden lg:flex items-center gap-4 flex-1 justify-end">
            <div className="relative">
              {/* Botão que abre o dropdown */}
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="hidden xl:flex items-center bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <FaUserMd className="text-white mr-2" />
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-blue-100">CRM: {user?.crm}</p>
                </div>
                <FaChevronDown 
                  className={`ml-2 text-blue-100 transition-transform duration-200 ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`}
                  size={12}
                />
              </button>

              {/* Dropdown Menu Integrado */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in">
                  {/* Header do Dropdown */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <FaUserMd className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">CRM: {user?.crm}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        setIsModalOpen(true)
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center"
                    >
                      <FaUserMd className="mr-3 text-gray-400" size={14} />
                      Editar Perfil
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        navigate('/dashboard')
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center"
                    >
                      <FaFileMedical className="mr-3 text-gray-400" size={14} />
                      Meus Documentos
                    </button>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                    >
                      <FaUserMd className="mr-3" size={14} />
                      Sair
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay para fechar dropdown */}
              {isUserDropdownOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserDropdownOpen(false)}
                />
              )}
            </div>
            
            {/* Separador */}
            <div className="hidden xl:block w-px h-8 bg-white/20"></div>
          </div>

          {/* Perfil Dropdown - Mobile Only */}
          <div className="relative flex-shrink-0 ml-2 lg:ml-4 xl:hidden">
            <UserProfileDropdown 
              user={user || { id: '', name: '', email: '', crm: '', specialty: '', phone: '', createdAt: '' }} 
              onLogout={handleLogout}
              onProfileUpdate={updateProfile}
            />
          </div>
        </div>
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
    </nav>
  )
}

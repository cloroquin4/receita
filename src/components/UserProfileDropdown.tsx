import { useState } from 'react'
import { User } from '../types/User'
import { ProfileModal } from './ProfileModal'
import { FaUser, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa'

interface UserProfileDropdownProps {
  user: User
  onLogout: () => void
  onProfileUpdate: (updatedUser: Partial<User>) => void
}

export function UserProfileDropdown({ user, onLogout, onProfileUpdate }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleProfileUpdate = (updatedUser: Partial<User>) => {
    onProfileUpdate(updatedUser)
    setIsOpen(false)
  }

  const handleLogout = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <>
      <div className="relative">
        {/* Avatar/Profile Button - Responsivo */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {/* Avatar */}
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-lg border-2 border-white/20">
            <span className="text-white font-bold text-sm">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          
          {/* Informações - Desktop Only */}
          <div className="hidden md:block text-left">
            <div className="font-semibold text-white text-sm leading-tight">
              {user.name}
            </div>
            <div className="text-xs text-blue-100">
              {user.crm?.startsWith('CRM-') ? user.crm : `CRM-${user.crm}`}
            </div>
          </div>
          
          {/* Setinha - Desktop Only */}
          <div className="hidden md:block ml-2">
            <FaChevronDown 
              className={`text-blue-100 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              size={14}
            />
          </div>
        </button>

        {/* Dropdown Menu - Responsivo */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in">
            {/* Header do Dropdown */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xs">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.crm?.startsWith('CRM-') ? user.crm : `CRM-${user.crm}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsModalOpen(true)
                  setIsOpen(false)
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaUser className="mr-3 text-gray-400" size={14} />
                Editar Perfil
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaCog className="mr-3 text-gray-400" size={14} />
                Configurações
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="mr-3" size={14} />
                Sair
              </button>
            </div>
          </div>
        )}

        {/* Overlay para fechar dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Modal de Perfil */}
      {isModalOpen && (
        <ProfileModal
          user={user}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </>
  )
}

import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { 
  FaHome,
  FaUsers,
  FaFileMedical,
  FaFolder,
  FaPills,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  isCollapsed?: boolean
  exact?: boolean
}

// Menu items movido para fora do componente
const menuItems = [
  {
    href: '/dashboard',
    icon: <FaHome />,
    label: 'Início',
    exact: true
  },
  {
    href: '/receitas/nova',
    icon: <FaFileMedical />,
    label: 'Nova Receita',
    exact: true
  },
  {
    href: '/receitas',
    icon: <FaFolder />,
    label: 'Minhas Receitas',
    exact: false
  },
  {
    href: '/pacientes',
    icon: <FaUsers />,
    label: 'Pacientes',
    exact: true
  },
  {
    href: '/documentos',
    icon: <FaFolder />,
    label: 'Documentos',
    exact: true
  },
  {
    href: '/medicamentos',
    icon: <FaPills />,
    label: 'Medicamentos',
    exact: true
  },
  {
    href: '/estatisticas',
    icon: <FaChartBar />,
    label: 'Estatísticas',
    exact: true
  }
]

function SidebarItem({ href, icon, label, isActive, isCollapsed }: SidebarItemProps) {
  const navigate = useNavigate()

  return (
    <li className="list-none">
      <button
        onClick={() => navigate(href)}
        className={`w-full text-left px-4 py-3 flex items-center transition-all duration-200 rounded-lg mx-2 ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className="text-lg flex-shrink-0">{icon}</span>
        {!isCollapsed && (
          <span className="ml-3 font-medium whitespace-nowrap">{label}</span>
        )}
      </button>
    </li>
  )
}

export function Sidebar() {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActivePath = useMemo(() => {
    return (href: string, exact: boolean = false) => {
      if (exact) {
        // Para rotas exatas, verificar pathname exato
        if (href === '/dashboard') {
          return location.pathname === '/' || location.pathname === '/dashboard'
        }
        return location.pathname === href
      } else {
        // Para rotas não exatas, usar startsWith
        if (href === '/receitas') {
          return location.pathname.startsWith('/receitas') && !location.pathname.startsWith('/receitas/nova')
        }
        return location.pathname.startsWith(href)
      }
    }
  }, [location.pathname])

  return (
    <div className="hidden md:block">
      <nav className={`bg-white border-r border-gray-200 transition-all duration-300 shadow-lg flex flex-col h-full ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Header do Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FaFileMedical className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Receit</h2>
                  <p className="text-xs text-gray-500">Médico</p>
                </div>
              </div>
            )}
            
            {/* Botão de Collapse */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
              aria-label={isCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
            >
              {isCollapsed ? (
                <FaChevronRight className="text-gray-600" />
              ) : (
                <FaChevronLeft className="text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Menu Items - Scrollável */}
        <ul className="nav flex-col p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActivePath(item.href, item.exact)}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>

        {/* Footer do Sidebar */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center justify-center">
            {!isCollapsed ? (
              <div className="text-center">
                <p className="text-xs text-gray-500">Versão 1.0.0</p>
                <p className="text-xs text-gray-400">© 2024</p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-600 font-bold">R</span>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}

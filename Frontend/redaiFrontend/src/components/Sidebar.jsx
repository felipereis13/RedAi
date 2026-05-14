import { ClipboardList, LayoutDashboard, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const adminItems = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/admin/provas',
    label: 'Provas',
    icon: ClipboardList,
  },
  {
    label: 'Candidatos',
    icon: UsersRound,
    disabled: true,
  },
]

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Navegacao do administrador">
      <nav>
        {adminItems.map((item) => {
          const Icon = item.icon
          if (item.disabled) {
            return (
              <span className="sidebarDisabled" key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
                <small>Em breve</small>
              </span>
            )
          }

          return (
            <NavLink to={item.to} end key={item.to}>
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar

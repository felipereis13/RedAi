import { ClipboardList } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const adminItems = [
  {
    to: '/admin',
    label: 'Provas',
    icon: ClipboardList,
  },
]

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Navegacao do administrador">
      <nav>
        {adminItems.map((item) => {
          const Icon = item.icon
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

import { BookOpen, FilePlus2, History, LayoutDashboard } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const candidateItems = [
  { to: '/candidato', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/candidato/historico', label: 'Historico', icon: History },
  { to: '/candidato/provas', label: 'Provas', icon: BookOpen },
  { to: '/candidato/redacoes/nova', label: 'Nova redacao', icon: FilePlus2 },
]

function PageLayout({ role = 'candidato' }) {
  const isAdmin = role === 'admin'

  return (
    <div className={isAdmin ? 'pageShell pageShell--admin' : 'pageShell'}>
      <Navbar />
      {isAdmin && <Sidebar />}
      <main className="pageContent">
        {!isAdmin && (
          <nav className="tabNav" aria-label="Navegacao do candidato">
            {candidateItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink to={item.to} end={item.end} key={item.to}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        )}
        <Outlet />
      </main>
    </div>
  )
}

export default PageLayout

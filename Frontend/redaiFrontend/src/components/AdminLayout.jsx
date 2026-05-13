import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function AdminLayout() {
  const { logout, usuario } = useAuth()

  return (
    <main className="appShell wideShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Painel admin</p>
          <h1>{usuario?.nome}</h1>
        </div>
        <button className="secondaryButton" onClick={logout} type="button">
          Sair
        </button>
      </header>

      <nav className="candidateNav" aria-label="Navegacao do administrador">
        <NavLink to="/admin" end>
          Provas
        </NavLink>
      </nav>

      <Outlet />
    </main>
  )
}

export default AdminLayout

import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function CandidatoLayout() {
  const { logout, usuario } = useAuth()

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Area do candidato</p>
          <h1>Ola, {usuario?.nome}</h1>
        </div>
        <button className="secondaryButton" onClick={logout} type="button">
          Sair
        </button>
      </header>

      <nav className="candidateNav" aria-label="Navegacao do candidato">
        <NavLink to="/candidato" end>
          Historico
        </NavLink>
        <NavLink to="/candidato/provas">Provas</NavLink>
        <NavLink to="/candidato/redacoes/nova">Nova redacao</NavLink>
      </nav>

      <Outlet />
    </main>
  )
}

export default CandidatoLayout

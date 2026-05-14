import { LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import Badge from './Badge'
import Button from './Button'

function Navbar() {
  const { logout, usuario } = useAuth()

  return (
    <header className="navbar">
      <div className="brand">
        <span className="brandMark" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <span>RedAI</span>
      </div>
      <div className="userCluster">
        <div className="userMeta">
          <strong>{usuario?.nome || 'Usuario'}</strong>
          <Badge status="default">{usuario?.role || 'PERFIL'}</Badge>
        </div>
        <Button variant="ghost" onClick={logout} aria-label="Sair">
          <LogOut size={18} />
          <span>Sair</span>
        </Button>
      </div>
    </header>
  )
}

export default Navbar

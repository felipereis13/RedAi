import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/useAuth'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, usuario } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to={usuario?.role === 'ADMIN' ? '/admin' : '/candidato'} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = await login({ email, senha })
      const defaultDestination = user?.role === 'ADMIN' ? '/admin' : '/candidato'
      const destination = location.state?.from?.pathname || defaultDestination
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Nao foi possivel entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">RedAI</p>
          <h1 id="login-title">Entrar</h1>
          <p className="muted">Acesse sua area para submeter e acompanhar redacoes.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              disabled={loading}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Senha
            <input
              autoComplete="current-password"
              disabled={loading}
              minLength={6}
              onChange={(event) => setSenha(event.target.value)}
              required
              type="password"
              value={senha}
            />
          </label>

          {error && <p className="formError">{error}</p>}

          <button disabled={loading} type="submit">
            {loading ? <Spinner label="Entrando" /> : 'Entrar'}
          </button>
        </form>

        <p className="authSwitch">
          Ainda nao tem conta? <Link to="/registro">Criar cadastro</Link>
        </p>
      </section>
    </main>
  )
}

export default Login

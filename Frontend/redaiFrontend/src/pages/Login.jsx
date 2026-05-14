import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import { useAuth } from '../context/useAuth'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, usuario } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})

  if (isAuthenticated) {
    return <Navigate to={usuario?.role === 'ADMIN' ? '/admin' : '/candidato'} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ email: true, senha: true })

    if (!email || !senha) {
      return
    }

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
        <div className="authIntro">
          <span className="brandMark" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <p className="eyebrow">RedAI</p>
          <h1 id="login-title">Entrar</h1>
          <p className="muted">Acesse sua area para submeter e acompanhar redacoes.</p>
        </div>

        <Card as="form" className="authForm" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            disabled={loading}
            error={touched.email && !email ? 'Informe seu email.' : ''}
            label="Email"
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <Input
            autoComplete="current-password"
            disabled={loading}
            error={touched.senha && !senha ? 'Informe sua senha.' : ''}
            label="Senha"
            minLength={6}
            onBlur={() => setTouched((current) => ({ ...current, senha: true }))}
            onChange={(event) => setSenha(event.target.value)}
            required
            type="password"
            value={senha}
          />

          {error && <p className="formError">{error}</p>}

          <Button disabled={loading} loading={loading} type="submit">
            Entrar
          </Button>
        </Card>

        <p className="authSwitch">
          Ainda nao tem conta? <Link to="/registro">Criar cadastro</Link>
        </p>
      </section>
    </main>
  )
}

export default Login

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import api from '../api/axiosInstance'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import { useAuth } from '../context/useAuth'

function Registro() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})

  if (isAuthenticated) {
    return <Navigate to="/candidato" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ nome: true, email: true, senha: true })

    if (!nome || !email || senha.length < 6) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/api/auth/register', { nome, email, senha })
      navigate('/login', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Nao foi possivel criar o cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="registro-title">
        <div className="authIntro">
          <span className="brandMark" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <p className="eyebrow">RedAI</p>
          <h1 id="registro-title">Criar conta</h1>
          <p className="muted">Cadastre-se para acessar as provas disponiveis.</p>
        </div>

        <Card as="form" className="authForm" onSubmit={handleSubmit}>
          <Input
            autoComplete="name"
            disabled={loading}
            error={touched.nome && !nome ? 'Informe seu nome.' : ''}
            label="Nome"
            onBlur={() => setTouched((current) => ({ ...current, nome: true }))}
            onChange={(event) => setNome(event.target.value)}
            required
            type="text"
            value={nome}
          />

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
            autoComplete="new-password"
            disabled={loading}
            error={touched.senha && senha.length < 6 ? 'Use ao menos 6 caracteres.' : ''}
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
            Criar conta
          </Button>
        </Card>

        <p className="authSwitch">
          Ja tem cadastro? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

export default Registro

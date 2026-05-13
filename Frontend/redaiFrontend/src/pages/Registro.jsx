import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/useAuth'

function Registro() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/candidato" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
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
        <div>
          <p className="eyebrow">RedAI</p>
          <h1 id="registro-title">Criar conta</h1>
          <p className="muted">Cadastre-se para acessar as provas disponiveis.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              autoComplete="name"
              disabled={loading}
              onChange={(event) => setNome(event.target.value)}
              required
              type="text"
              value={nome}
            />
          </label>

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
              autoComplete="new-password"
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
            {loading ? <Spinner label="Criando" /> : 'Criar conta'}
          </button>
        </form>

        <p className="authSwitch">
          Ja tem cadastro? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

export default Registro

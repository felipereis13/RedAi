import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarRedacoes } from '../api/candidato'
import Spinner from '../components/Spinner'

function PainelCandidato() {
  const [redacoes, setRedacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function carregarHistorico() {
      try {
        const data = await listarRedacoes()
        if (active) {
          setRedacoes(data)
        }
      } catch {
        if (active) {
          setError('Nao foi possivel carregar seu historico.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    carregarHistorico()

    return () => {
      active = false
    }
  }, [])

  return (
      <section className="contentBand">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Redacoes</p>
            <h2>Historico de envios</h2>
          </div>
          <div className="buttonGroup">
            <Link className="secondaryLinkButton" to="/candidato/provas">
              Ver provas
            </Link>
            <Link className="primaryLinkButton" to="/candidato/redacoes/nova">
              Nova redacao
            </Link>
          </div>
        </div>

        {loading && <Spinner label="Carregando historico" />}
        {error && <p className="formError">{error}</p>}

        {!loading && !error && redacoes.length === 0 && (
          <p className="emptyState">Voce ainda nao enviou redacoes.</p>
        )}

        <div className="historyList">
          {redacoes.map((redacao) => (
            <Link className="historyItem" key={redacao.id} to={`/candidato/redacoes/${redacao.id}`}>
              <div>
                <strong>Redacao #{redacao.id}</strong>
                <span>{formatDate(redacao.createdAt)}</span>
              </div>
              <span className={`statusBadge status${redacao.status}`}>{statusLabel(redacao.status)}</span>
            </Link>
          ))}
        </div>
      </section>
  )
}

function statusLabel(status) {
  const labels = {
    PENDENTE: 'Pendente',
    PROCESSANDO: 'Processando',
    CONCLUIDA: 'Concluida',
    ERRO: 'Erro',
  }

  return labels[status] || status
}

function formatDate(value) {
  if (!value) {
    return 'Data indisponivel'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default PainelCandidato

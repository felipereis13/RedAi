import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
import { listarRedacoes } from '../api/candidato'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'

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
            <Button as={Link} variant="secondary" to="/candidato/provas">
              Ver provas
            </Button>
            <Button as={Link} to="/candidato/redacoes/nova">
              Nova redacao
            </Button>
          </div>
        </div>

        {loading && <SkeletonLoader rows={4} />}
        {error && <p className="formError">{error}</p>}

        {!loading && !error && redacoes.length === 0 && (
          <EmptyState
            icon={History}
            title="Voce ainda nao enviou redacoes."
            subtitle="Escolha uma prova disponivel para iniciar sua primeira correcao."
          />
        )}

        <div className="historyList">
          {redacoes.map((redacao) => (
            <Link className="historyItem" key={redacao.id} to={`/candidato/redacoes/${redacao.id}`}>
              <div>
                <strong>Redacao #{redacao.id}</strong>
                <span>{formatDate(redacao.createdAt)}</span>
              </div>
              <Badge status={redacao.status} pulse={redacao.status === 'PROCESSANDO'}>
                {statusLabel(redacao.status)}
              </Badge>
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

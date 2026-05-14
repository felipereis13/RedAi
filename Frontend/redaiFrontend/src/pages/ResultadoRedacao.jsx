import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buscarRedacao } from '../api/candidato'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'
import Spinner from '../components/Spinner'

const POLLING_STATUS = new Set(['PENDENTE', 'PROCESSANDO'])

function ResultadoRedacao() {
  const { id } = useParams()
  const [redacao, setRedacao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let intervalId

    async function carregarRedacao() {
      try {
        const data = await buscarRedacao(id)
        if (!active) {
          return
        }

        setRedacao(data)
        setError('')

        if (!POLLING_STATUS.has(data.status) && intervalId) {
          clearInterval(intervalId)
        }
      } catch {
        if (active) {
          setError('Nao foi possivel consultar sua redacao.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    carregarRedacao()
    intervalId = setInterval(carregarRedacao, 3000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [id])

  if (loading) {
    return (
      <section className="contentBand">
        <SkeletonLoader rows={4} />
      </section>
    )
  }

  if (error) {
    return (
      <section className="contentBand">
        <p className="formError">{error}</p>
        <Button as={Link} className="fitButton" variant="secondary" to="/candidato">
          Voltar
        </Button>
      </section>
    )
  }

  if (!redacao) {
    return (
      <section className="contentBand">
        <EmptyState title="Redacao nao encontrada." subtitle="Volte ao historico para consultar seus envios." />
        <Button as={Link} className="fitButton" variant="secondary" to="/candidato">
          Voltar ao historico
        </Button>
      </section>
    )
  }

  return (
    <section className="contentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Resultado</p>
          <h2>Redacao #{redacao.id}</h2>
        </div>
        <Button as={Link} variant="secondary" to="/candidato">
          Historico
        </Button>
      </div>

      {POLLING_STATUS.has(redacao.status) && (
        <Card className="processingPanel">
          <Badge status={redacao.status} pulse>
            {redacao.status === 'PENDENTE' ? 'Pendente' : 'Processando'}
          </Badge>
          <Spinner label="Corrigindo sua redacao..." />
          <p className="muted">A pagina sera atualizada automaticamente a cada 3 segundos.</p>
        </Card>
      )}

      {redacao.status === 'ERRO' && (
        <Card className="errorPanel">
          <h3>Nao foi possivel concluir a correcao</h3>
          <p>Houve uma falha ao corrigir sua redacao. Tente enviar novamente em alguns instantes.</p>
        </Card>
      )}

      {redacao.status === 'CONCLUIDA' && redacao.resultado && <ResultadoConcluido resultado={redacao.resultado} />}
    </section>
  )
}

function ResultadoConcluido({ resultado }) {
  const percentual = Math.round(resultado.percentualAproveitamento)

  return (
    <div className="resultStack">
      <div className="resultSummary">
        <Card>
          <span className="summaryLabel">Nota</span>
          <strong>
            {formatNumber(resultado.notaTotal)} / {formatNumber(resultado.notaMaximaProva)}
          </strong>
        </Card>
        <Card className="percentBox">
          <span>{percentual}%</span>
          <small>Aproveitamento</small>
          <ProgressBar value={percentual} />
        </Card>
      </div>

      <Card className="feedbackBox">
        <h3>Feedback geral</h3>
        <p>{resultado.feedbackGeral}</p>
      </Card>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Criterio</th>
              <th>Nota</th>
              <th>Maxima</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {resultado.avaliacoesCriterios.map((avaliacao) => (
              <tr key={avaliacao.nome}>
                <td>{avaliacao.nome}</td>
                <td>{formatNumber(avaliacao.notaObtida)}</td>
                <td>{formatNumber(avaliacao.notaMaxima)}</td>
                <td>{avaliacao.comentario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 1,
  })
}

export default ResultadoRedacao

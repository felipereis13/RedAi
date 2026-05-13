import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buscarRedacao } from '../api/candidato'
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
        <Spinner label="Carregando resultado" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="contentBand">
        <p className="formError">{error}</p>
        <Link className="secondaryLinkButton fitButton" to="/candidato">
          Voltar
        </Link>
      </section>
    )
  }

  if (!redacao) {
    return null
  }

  return (
    <section className="contentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Resultado</p>
          <h2>Redacao #{redacao.id}</h2>
        </div>
        <Link className="secondaryLinkButton" to="/candidato">
          Historico
        </Link>
      </div>

      {POLLING_STATUS.has(redacao.status) && (
        <div className="processingPanel">
          <Spinner label="Corrigindo sua redacao..." />
          <p className="muted">A pagina sera atualizada automaticamente a cada 3 segundos.</p>
        </div>
      )}

      {redacao.status === 'ERRO' && (
        <div className="errorPanel">
          <h3>Nao foi possivel concluir a correcao</h3>
          <p>Houve uma falha ao corrigir sua redacao. Tente enviar novamente em alguns instantes.</p>
        </div>
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
        <div>
          <span className="summaryLabel">Nota</span>
          <strong>
            {formatNumber(resultado.notaTotal)} / {formatNumber(resultado.notaMaximaProva)}
          </strong>
        </div>
        <div className="percentBox">
          <span>{percentual}%</span>
          <small>Aproveitamento</small>
        </div>
      </div>

      <article className="feedbackBox">
        <h3>Feedback geral</h3>
        <p>{resultado.feedbackGeral}</p>
      </article>

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

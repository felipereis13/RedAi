import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  MessageSquareText,
  PenLine,
  RefreshCw,
  Sparkles,
  Star,
} from 'lucide-react'
import { buscarRedacao, reenviarRedacao } from '../api/candidato'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'

const POLLING_STATUS = new Set(['PENDENTE', 'PROCESSANDO'])
const MAX_TENTATIVAS = 3

function ResultadoRedacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [redacao, setRedacao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reenviando, setReenviando] = useState(false)
  const [error, setError] = useState('')

  const carregarRedacao = useCallback(async () => {
    try {
      const data = await buscarRedacao(id)
      setRedacao(data)
      setError('')
    } catch {
      setError('Nao foi possivel consultar sua redacao.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true

    async function carregarInicial() {
      if (!active) {
        return
      }
      await carregarRedacao()
    }

    carregarInicial()

    return () => {
      active = false
    }
  }, [carregarRedacao])

  useEffect(() => {
    if (!redacao || !POLLING_STATUS.has(redacao.status)) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      carregarRedacao()
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [carregarRedacao, redacao])

  const handleReenviar = async () => {
    setReenviando(true)
    setError('')

    try {
      const data = await reenviarRedacao(id)
      setRedacao(data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Nao foi possivel reenviar a redacao.')
    } finally {
      setReenviando(false)
    }
  }

  const handleVoltarEditar = () => {
    if (!redacao) {
      return
    }

    navigate('/candidato/redacoes/nova', {
      state: {
        draft: {
          idProva: redacao.idProva,
          tema: redacao.tema,
          texto: redacao.texto,
        },
      },
    })
  }

  if (loading) {
    return (
      <section className="contentBand">
        <SkeletonLoader rows={4} />
      </section>
    )
  }

  if (!redacao && error) {
    return (
      <section className="contentBand">
        <p className="formError">{error}</p>
        <Button as={Link} className="fitButton" variant="secondary" to="/candidato/historico">
          Voltar ao historico
        </Button>
      </section>
    )
  }

  if (!redacao) {
    return (
      <section className="contentBand">
        <EmptyState title="Redacao nao encontrada." subtitle="Volte ao historico para consultar seus envios." />
        <Button as={Link} className="fitButton" variant="secondary" to="/candidato/historico">
          Voltar ao historico
        </Button>
      </section>
    )
  }

  if (POLLING_STATUS.has(redacao.status)) {
    return <ResultadoProcessando status={redacao.status} />
  }

  if (redacao.status === 'ERRO') {
    return (
      <ResultadoErro
        error={error}
        onReenviar={handleReenviar}
        onVoltarEditar={handleVoltarEditar}
        redacao={redacao}
        reenviando={reenviando}
      />
    )
  }

  if (redacao.status === 'CONCLUIDA' && redacao.resultado) {
    return <ResultadoConcluido redacao={redacao} />
  }

  return (
    <section className="contentBand">
      <EmptyState title="Resultado indisponivel." subtitle="Aguarde alguns instantes e tente abrir novamente." />
    </section>
  )
}

function ResultadoProcessando({ status }) {
  return (
    <section className="resultCenteredState">
      <Card className="processingResultCard">
        <div className="writingAnimation" aria-hidden="true">
          <PenLine size={34} />
          <span />
        </div>
        <Badge status={status} pulse>
          {status === 'PENDENTE' ? 'Pendente' : 'Processando'}
        </Badge>
        <div>
          <h1>Corrigindo sua redacao...</h1>
          <p>Isso pode levar alguns segundos</p>
        </div>
      </Card>
    </section>
  )
}

function ResultadoErro({ error, onReenviar, onVoltarEditar, redacao, reenviando }) {
  const tentativas = Number(redacao.tentativas || 0)
  const tentativaAtual = Math.min(tentativas + 1, MAX_TENTATIVAS)
  const atingiuLimite = tentativas >= MAX_TENTATIVAS

  return (
    <section className="resultCenteredState">
      <Card className="errorResultCard">
        <span className="errorResultIcon">
          <AlertTriangle size={34} />
        </span>
        <Badge status="erro">Erro</Badge>
        <div>
          <h1>Ocorreu um erro na correcao</h1>
          <p>Tentativa {tentativaAtual} de {MAX_TENTATIVAS}</p>
        </div>
        {error && <p className="formError">{error}</p>}
        {atingiuLimite ? (
          <p className="supportNotice">Limite de tentativas atingido. Entre em contato com o suporte.</p>
        ) : (
          <Button disabled={reenviando} onClick={onReenviar}>
            <RefreshCw size={16} />
            {reenviando ? 'Reenviando...' : 'Tentar novamente'}
          </Button>
        )}
        <Button onClick={onVoltarEditar} variant="secondary">
          Voltar e editar
        </Button>
      </Card>
    </section>
  )
}

function ResultadoConcluido({ redacao }) {
  const resultado = redacao.resultado
  const percentual = Math.round(resultado.percentualAproveitamento || 0)
  const tone = getScoreTone(percentual)

  return (
    <section className="resultPage">
      <header className="resultHero">
        <div>
          <p className="eyebrow">Resultado da correcao</p>
          <h1>{redacao.tema || redacao.titulo || `Redacao #${redacao.id}`}</h1>
          {redacao.titulo && redacao.titulo !== redacao.tema && <p>{redacao.titulo}</p>}
          <div className="resultMeta">
            <span>Enviada em {formatDate(redacao.createdAt)}</span>
            <span>Correcao concluida</span>
          </div>
        </div>
        <Badge status="concluida">Concluida</Badge>
      </header>

      <Card className={`scoreShowcase scoreShowcase--${tone}`}>
        <span>Nota geral</span>
        <strong>
          {formatNumber(resultado.notaTotal)} / {formatNumber(resultado.notaMaximaProva)}
        </strong>
        <ProgressBar value={percentual} />
        <p>{percentual}% de aproveitamento</p>
      </Card>

      <Card className="feedbackResultCard">
        <div className="cardTitleRow">
          <MessageSquareText size={20} />
          <h2>Avaliacao geral</h2>
        </div>
        <p>{resultado.feedbackGeral}</p>
      </Card>

      <section className="resultSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Criterios</p>
            <h2>Criterios de avaliacao</h2>
          </div>
        </div>
        <div className="criteriaResultList">
          {(resultado.avaliacoesCriterios || []).map((avaliacao) => (
            <CriterioCard avaliacao={avaliacao} key={avaliacao.nome} />
          ))}
        </div>
      </section>

      <section className="resultSection resultComparisonSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Comparacao</p>
            <h2>Sua redacao vs versao ideal</h2>
          </div>
        </div>
        <div className="essayComparison">
          <EssayColumn icon={<FileText size={19} />} title="Sua redacao" text={redacao.texto} />
          <EssayColumn
            badge="IA"
            icon={<Star size={19} />}
            isAi
            subtitle="Como poderia ser"
            title="Versao sugerida pela IA"
            text={resultado.redacaoCorrigida || 'A versao corrigida nao foi retornada para esta redacao.'}
          />
        </div>
      </section>

      <div className="resultActions">
        <Button as={Link} to="/candidato/redacoes/nova">
          Nova redacao
        </Button>
        <Button as={Link} to="/candidato/historico" variant="secondary">
          Ver historico
        </Button>
        <Button disabled variant="ghost">
          Exportar PDF em breve
        </Button>
      </div>
    </section>
  )
}

function CriterioCard({ avaliacao }) {
  const [expanded, setExpanded] = useState(false)
  const percentual = useMemo(() => {
    if (!avaliacao.notaMaxima) {
      return 0
    }
    return Math.round((Number(avaliacao.notaObtida || 0) / Number(avaliacao.notaMaxima)) * 100)
  }, [avaliacao])
  const hasSuggestion = Boolean(avaliacao.sugestaoMelhoria?.trim())

  return (
    <Card className="criterionResultCard">
      <div className="criterionResultTop">
        <div>
          <h3>{avaliacao.nome}</h3>
          <span>{formatNumber(avaliacao.notaObtida)} / {formatNumber(avaliacao.notaMaxima)}</span>
        </div>
        <strong>{percentual}%</strong>
      </div>
      <ProgressBar value={percentual} />
      <p>{avaliacao.comentario}</p>
      {hasSuggestion && (
        <div className="improvementBox">
          <button
            aria-expanded={expanded}
            className="improvementToggle"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            <span>
              <Sparkles size={16} />
              Como melhorar
            </span>
            <ChevronDown className={expanded ? 'chevronOpen' : ''} size={18} />
          </button>
          <div className={expanded ? 'improvementContent improvementContent--open' : 'improvementContent'}>
            <p>{avaliacao.sugestaoMelhoria}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

function EssayColumn({ badge, icon, isAi = false, subtitle, text, title }) {
  return (
    <article className={isAi ? 'essayColumn essayColumn--ai' : 'essayColumn'}>
      {badge && <Badge status="concluida">{badge}</Badge>}
      <div className="essayColumnHeader">
        {icon}
        <div>
          <h3>{title}</h3>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </div>
      <div className="essayText">{text}</div>
    </article>
  )
}

function getScoreTone(percentual) {
  if (percentual < 40) return 'danger'
  if (percentual < 70) return 'warning'
  if (percentual < 90) return 'primary'
  return 'success'
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 1,
  })
}

function formatDate(value) {
  if (!value) {
    return 'data nao informada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default ResultadoRedacao

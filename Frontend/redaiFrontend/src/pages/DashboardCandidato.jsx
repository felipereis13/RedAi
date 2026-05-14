import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, CheckCircle2, FilePlus2, FileText, Trophy } from 'lucide-react'
import {
  buscarDashboardCandidatoEvolucao,
  buscarDashboardCandidatoResumo,
  buscarDashboardCandidatoUltimasRedacoes,
  listarProvas,
} from '../api/candidato'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'
import { useAuth } from '../context/useAuth'

const initialSection = { data: null, loading: true, error: '' }

function DashboardCandidato() {
  const { usuario } = useAuth()
  const [resumo, setResumo] = useState(initialSection)
  const [evolucao, setEvolucao] = useState(initialSection)
  const [ultimasRedacoes, setUltimasRedacoes] = useState(initialSection)
  const [provas, setProvas] = useState(initialSection)

  const carregarDashboard = useCallback(async () => {
    setResumo((current) => ({ ...current, loading: true, error: '' }))
    setEvolucao((current) => ({ ...current, loading: true, error: '' }))
    setUltimasRedacoes((current) => ({ ...current, loading: true, error: '' }))
    setProvas((current) => ({ ...current, loading: true, error: '' }))

    const [resumoResult, evolucaoResult, ultimasResult, provasResult] = await Promise.allSettled([
      buscarDashboardCandidatoResumo(),
      buscarDashboardCandidatoEvolucao(),
      buscarDashboardCandidatoUltimasRedacoes(),
      listarProvas(),
    ])

    applySectionResult(setResumo, resumoResult, 'Nao foi possivel carregar seu resumo.')
    applySectionResult(setEvolucao, evolucaoResult, 'Nao foi possivel carregar sua evolucao.')
    applySectionResult(setUltimasRedacoes, ultimasResult, 'Nao foi possivel carregar suas redacoes recentes.')
    applySectionResult(setProvas, provasResult, 'Nao foi possivel carregar as provas disponiveis.')
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => carregarDashboard(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregarDashboard])

  const media = resumo.data?.mediaAproveitamento ?? 0
  const totalEnviadas = resumo.data?.totalRedacoesEnviadas ?? 0
  const mensagem = getMensagemMotivacional(totalEnviadas, media)
  const melhorPercentual = useMemo(() => {
    const pontos = evolucao.data || []
    return pontos.reduce((maior, ponto) => Math.max(maior, ponto.percentualAproveitamento || 0), 0)
  }, [evolucao.data])

  const summaryCards = [
    {
      label: 'Redacoes enviadas',
      value: totalEnviadas,
      icon: FileText,
      tone: 'primary',
    },
    {
      label: 'Redacoes corrigidas',
      value: resumo.data?.totalConcluidas ?? 0,
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Media de aproveitamento',
      value: `${Math.round(media)}%`,
      icon: BarChart3,
      tone: 'primary',
    },
    {
      label: 'Melhor nota',
      value: `${formatNumber(resumo.data?.melhorNota)} / ${formatNumber(resumo.data?.melhorNotaMaxima)}`,
      icon: Trophy,
      tone: 'warning',
    },
  ]

  return (
    <section className="candidateDashboard">
      <div className="candidateMain">
        <Card className="welcomeCard">
          <div>
            <p className="eyebrow">Area do candidato</p>
            <h1>Ola, {usuario?.nome || 'candidato'}! 👋</h1>
            <p>{mensagem}</p>
          </div>
          <Button as={Link} className="welcomeAction" to="/candidato/redacoes/nova">
            <FilePlus2 size={18} />
            Nova redacao
          </Button>
        </Card>

        <div className="candidateMetricGrid">
          {summaryCards.map((card) => (
            <CandidateMetricCard card={card} key={card.label} loading={resumo.loading} />
          ))}
        </div>
        {resumo.error && <p className="formError">{resumo.error}</p>}

        <Card className="chartCard">
          <div className="cardTitle">
            <h3>Sua evolucao</h3>
            <span>Ultimas 10 concluidas</span>
          </div>
          {evolucao.loading ? (
            <SkeletonLoader rows={2} />
          ) : evolucao.error ? (
            <p className="formError">{evolucao.error}</p>
          ) : (evolucao.data || []).length < 2 ? (
            <EmptyState title="Faca mais redacoes para ver sua evolucao aqui" subtitle="A partir de duas correcoes concluidas, o grafico mostra seu progresso." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucao.data || []} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="candidateEvolutionArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F6AF5" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#4F6AF5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="data" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<EvolutionTooltip />} />
                <Area type="monotone" dataKey="percentualAproveitamento" stroke="none" fill="url(#candidateEvolutionArea)" />
                <Line
                  type="monotone"
                  dataKey="percentualAproveitamento"
                  stroke="#4F6AF5"
                  strokeWidth={3}
                  dot={(props) => <EvolutionDot {...props} melhorPercentual={melhorPercentual} />}
                  activeDot={{ r: 6, fill: '#4F6AF5', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="recentEssays">
          <div className="cardTitle">
            <h3>Ultimas redacoes</h3>
            <span>5 mais recentes</span>
          </div>
          {ultimasRedacoes.loading ? (
            <SkeletonLoader rows={5} />
          ) : ultimasRedacoes.error ? (
            <p className="formError">{ultimasRedacoes.error}</p>
          ) : (ultimasRedacoes.data || []).length === 0 ? (
            <EmptyState title="Voce ainda nao enviou redacoes." subtitle="Comece por uma prova disponivel e acompanhe sua evolucao aqui." />
          ) : (
            <div className="recentEssayList">
              {ultimasRedacoes.data.map((redacao) => (
                <Link className="recentEssayCard" key={redacao.id} to={`/candidato/redacoes/${redacao.id}`}>
                  <div>
                    <strong>{redacao.titulo || `Redacao #${redacao.id}`}</strong>
                    <span>{redacao.tema}</span>
                    <small>{redacao.cargo} - {redacao.banca} - {formatDate(redacao.createdAt)}</small>
                  </div>
                  <div className="recentEssayMeta">
                    <Badge status={redacao.status} pulse={redacao.status === 'PROCESSANDO'}>
                      {statusLabel(redacao.status)}
                    </Badge>
                    {redacao.status === 'CONCLUIDA' && (
                      <div className="miniProgressCell">
                        <ProgressBar value={redacao.percentualAproveitamento || 0} />
                        <span>{formatNumber(redacao.notaTotal)} / {formatNumber(redacao.notaMaximaProva)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="cardFooter">
            <Button as={Link} variant="secondary" to="/candidato/historico">
              Ver historico completo
            </Button>
          </div>
        </Card>
      </div>

      <aside className="availableExams">
        <Card className="availableExamsCard">
          <div className="cardTitle">
            <h3>Provas disponiveis</h3>
            <span>Comece agora</span>
          </div>
          {provas.loading ? (
            <SkeletonLoader rows={4} />
          ) : provas.error ? (
            <p className="formError">{provas.error}</p>
          ) : (provas.data || []).length === 0 ? (
            <EmptyState title="Nenhuma prova disponivel." subtitle="Novas provas aparecerao aqui quando forem ativadas." />
          ) : (
            <div className="availableExamList">
              {(provas.data || []).slice(0, 4).map((prova) => (
                <div className="availableExamItem" key={prova.id}>
                  <div>
                    <strong>{prova.cargo}</strong>
                    <span>{prova.banca}</span>
                  </div>
                  <Button as={Link} variant="secondary" to={`/candidato/redacoes/nova?idProva=${prova.id}`}>
                    Escrever
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button as={Link} variant="ghost" to="/candidato/provas">
            Ver todas
          </Button>
        </Card>
      </aside>
    </section>
  )
}

function CandidateMetricCard({ card, loading }) {
  const Icon = card.icon

  return (
    <Card className={`candidateMetricCard metricCard--${card.tone}`}>
      {loading ? (
        <SkeletonLoader rows={1} />
      ) : (
        <>
          <span className="metricIcon" aria-hidden="true">
            <Icon size={20} />
          </span>
          <div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        </>
      )}
    </Card>
  )
}

function EvolutionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0].payload
  return (
    <div className="chartTooltip">
      <strong>Data: {label}</strong>
      <span>Aproveitamento: {Math.round(item.percentualAproveitamento)}%</span>
      <span>Nota: {formatNumber(item.notaTotal)} / {formatNumber(item.notaMaximaProva)}</span>
    </div>
  )
}

function EvolutionDot(props) {
  const { cx, cy, payload, melhorPercentual } = props
  const isBest = payload.percentualAproveitamento === melhorPercentual

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isBest ? 6 : 4}
      fill={isBest ? '#34C48B' : '#4F6AF5'}
      stroke="#fff"
      strokeWidth={2}
    />
  )
}

function applySectionResult(setter, result, fallbackMessage) {
  if (result.status === 'fulfilled') {
    setter({ data: result.value, loading: false, error: '' })
    return
  }

  setter((current) => ({ ...current, loading: false, error: fallbackMessage }))
}

function getMensagemMotivacional(totalRedacoes, media) {
  if (totalRedacoes === 0) {
    return 'Comece sua primeira redacao agora!'
  }

  if (media < 50) {
    return 'Continue praticando, voce esta evoluindo!'
  }

  if (media < 80) {
    return 'Bom desempenho! Continue assim.'
  }

  return 'Excelente! Voce esta indo muito bem.'
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
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

export default DashboardCandidato

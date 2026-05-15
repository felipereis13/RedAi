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
import { FilePlus2, History } from 'lucide-react'
import { buscarEvolucaoNotas, listarHistoricoRedacoes, listarProvas } from '../api/candidato'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'

const PAGE_SIZE = 10
const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'CONCLUIDA', label: 'Concluida' },
  { value: 'ERRO', label: 'Erro' },
]

function PainelCandidato() {
  const [provas, setProvas] = useState([])
  const [historico, setHistorico] = useState(null)
  const [evolucao, setEvolucao] = useState([])
  const [filtroProva, setFiltroProva] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [graficoProva, setGraficoProva] = useState('')
  const [pagina, setPagina] = useState(0)
  const [loadingProvas, setLoadingProvas] = useState(true)
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [loadingEvolucao, setLoadingEvolucao] = useState(true)
  const [errorHistorico, setErrorHistorico] = useState('')
  const [errorEvolucao, setErrorEvolucao] = useState('')

  const carregarProvas = useCallback(async () => {
    setLoadingProvas(true)
    try {
      setProvas(await listarProvas())
    } catch {
      setProvas([])
    } finally {
      setLoadingProvas(false)
    }
  }, [])

  const carregarHistorico = useCallback(async () => {
    setLoadingHistorico(true)
    setErrorHistorico('')

    try {
      const data = await listarHistoricoRedacoes({
        idProva: filtroProva,
        status: filtroStatus,
        pagina,
        tamanho: PAGE_SIZE,
      })
      setHistorico(data)
    } catch {
      setErrorHistorico('Nao foi possivel carregar seu historico.')
    } finally {
      setLoadingHistorico(false)
    }
  }, [filtroProva, filtroStatus, pagina])

  const carregarEvolucao = useCallback(async () => {
    setLoadingEvolucao(true)
    setErrorEvolucao('')

    try {
      const data = await buscarEvolucaoNotas({ idProva: graficoProva })
      setEvolucao(data.map(normalizeEvolutionPoint))
    } catch {
      setErrorEvolucao('Nao foi possivel carregar sua evolucao.')
    } finally {
      setLoadingEvolucao(false)
    }
  }, [graficoProva])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => carregarProvas(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregarProvas])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => carregarHistorico(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregarHistorico])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => carregarEvolucao(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregarEvolucao])

  const melhorPercentual = useMemo(
    () => evolucao.reduce((maior, ponto) => Math.max(maior, ponto.percentualAproveitamento || 0), 0),
    [evolucao],
  )

  const totalRedacoes = historico?.totalElements ?? 0
  const totalPaginas = Math.max(1, historico?.totalPages || 1)
  const redacoes = historico?.content || []

  const handleFiltroProvaChange = (event) => {
    setFiltroProva(event.target.value)
    setPagina(0)
  }

  const handleFiltroStatusChange = (event) => {
    setFiltroStatus(event.target.value)
    setPagina(0)
  }

  return (
    <section className="historyPage">
      <header className="sectionHeader">
        <div>
          <p className="eyebrow">Historico</p>
          <h1>Historico de redacoes</h1>
          <p className="muted">{totalRedacoes} redacoes enviadas</p>
        </div>
        <Button as={Link} to="/candidato/redacoes/nova">
          <FilePlus2 size={18} />
          Nova redacao
        </Button>
      </header>

      <Card className="historyChartCard">
        <div className="historyChartHeader">
          <div>
            <h2>Evolucao de desempenho</h2>
            <p>Compare seu aproveitamento nas redacoes concluidas.</p>
          </div>
          <Input
            as="select"
            disabled={loadingProvas}
            label="Prova"
            onChange={(event) => setGraficoProva(event.target.value)}
            value={graficoProva}
          >
            <option value="">Todas as provas</option>
            {provas.map((prova) => (
              <option key={prova.id} value={prova.id}>
                {prova.cargo} - {prova.banca}
              </option>
            ))}
          </Input>
        </div>
        {loadingEvolucao ? (
          <SkeletonLoader rows={3} />
        ) : errorEvolucao ? (
          <p className="formError">{errorEvolucao}</p>
        ) : evolucao.length < 2 ? (
          <EmptyState
            icon={History}
            title="Faca mais redacoes para ver sua evolucao aqui"
            subtitle="A partir de duas correcoes concluidas, o grafico mostra seu progresso."
          />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={evolucao} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="historyEvolutionArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F6AF5" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#4F6AF5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<EvolutionTooltip />} />
              <Area type="monotone" dataKey="percentualAproveitamento" stroke="none" fill="url(#historyEvolutionArea)" />
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

      <Card className="historyFilters">
        <Input as="select" disabled={loadingProvas} label="Prova" onChange={handleFiltroProvaChange} value={filtroProva}>
          <option value="">Todas as provas</option>
          {provas.map((prova) => (
            <option key={prova.id} value={prova.id}>
              {prova.cargo} - {prova.banca}
            </option>
          ))}
        </Input>
        <Input as="select" label="Status" onChange={handleFiltroStatusChange} value={filtroStatus}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Input>
      </Card>

      {loadingHistorico ? (
        <SkeletonLoader rows={5} />
      ) : errorHistorico ? (
        <p className="formError">{errorHistorico}</p>
      ) : redacoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={History}
            title="Nenhuma redacao encontrada."
            subtitle="Ajuste os filtros ou comece sua primeira redacao."
          />
          <div className="emptyAction">
            <Button as={Link} to="/candidato/redacoes/nova">
              Fazer primeira redacao
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="historyCards">
            {redacoes.map((redacao) => (
              <Link className="historyEssayCard" key={redacao.id} to={`/candidato/redacoes/${redacao.id}`}>
                <div>
                  <strong>{redacao.titulo || `Redacao #${redacao.id}`}</strong>
                  <span>{redacao.tema}</span>
                  <small>{redacao.cargo} - {redacao.banca}/{redacao.estado} - {formatDate(redacao.createdAt)}</small>
                </div>
                <div className="historyEssayMeta">
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

          <div className="paginationBar">
            <Button disabled={pagina === 0} onClick={() => setPagina((current) => Math.max(0, current - 1))} variant="secondary">
              Anterior
            </Button>
            <span>Pagina {pagina + 1} de {totalPaginas}</span>
            <Button disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((current) => current + 1)} variant="secondary">
              Proxima
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

function EvolutionTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0].payload
  return (
    <div className="chartTooltip">
      <strong>Data: {item.label}</strong>
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

function normalizeEvolutionPoint(point) {
  return {
    ...point,
    label: formatShortDate(point.data),
  }
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

function formatShortDate(value) {
  if (!value) {
    return '--/--'
  }

  if (/^\d{2}\/\d{2}$/.test(String(value))) {
    return value
  }

  const [year, month, day] = String(value).split('-')
  if (year && month && day) {
    return `${day}/${month}`
  }

  return value
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

export default PainelCandidato

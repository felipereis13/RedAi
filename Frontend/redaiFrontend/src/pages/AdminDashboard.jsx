import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FileText, ListChecks, RefreshCw, Trash2, UsersRound, X } from 'lucide-react'
import {
  buscarAtividadeRecente,
  buscarDashboardResumo,
  buscarRankingProvas,
  buscarRedacoesPorDia,
  criarSugestaoTema,
  excluirRedacaoAdmin,
  listarProvasAdmin,
} from '../api/admin'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'
import { useToast } from '../components/useToast'
import { useAuth } from '../context/useAuth'

const initialSection = { data: null, loading: true, error: '' }

function AdminDashboard() {
  const { usuario } = useAuth()
  const toast = useToast()
  const [resumo, setResumo] = useState(initialSection)
  const [redacoesPorDia, setRedacoesPorDia] = useState(initialSection)
  const [rankingProvas, setRankingProvas] = useState(initialSection)
  const [atividadeRecente, setAtividadeRecente] = useState(initialSection)
  const [refreshing, setRefreshing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [redacaoParaExcluir, setRedacaoParaExcluir] = useState(null)
  const [deletingRedacao, setDeletingRedacao] = useState(false)

  const carregarDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setResumo((current) => ({ ...current, loading: true, error: '' }))
      setRedacoesPorDia((current) => ({ ...current, loading: true, error: '' }))
      setRankingProvas((current) => ({ ...current, loading: true, error: '' }))
      setAtividadeRecente((current) => ({ ...current, loading: true, error: '' }))
    }

    setRefreshing(true)

    const [resumoResult, redacoesResult, rankingResult, atividadeResult] = await Promise.allSettled([
      buscarDashboardResumo(),
      buscarRedacoesPorDia(),
      buscarRankingProvas(),
      buscarAtividadeRecente(),
    ])

    applySectionResult(setResumo, resumoResult, 'Nao foi possivel carregar o resumo.')
    applySectionResult(setRedacoesPorDia, redacoesResult, 'Nao foi possivel carregar as redacoes por dia.')
    applySectionResult(setRankingProvas, rankingResult, 'Nao foi possivel carregar o ranking de provas.')
    applySectionResult(setAtividadeRecente, atividadeResult, 'Nao foi possivel carregar a atividade recente.')
    setRefreshing(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => carregarDashboard(), 0)
    const intervalId = window.setInterval(() => carregarDashboard({ silent: true }), 60000)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [carregarDashboard])

  const confirmarExclusaoRedacao = async () => {
    if (!redacaoParaExcluir) {
      return
    }

    setDeletingRedacao(true)

    try {
      await excluirRedacaoAdmin(redacaoParaExcluir.id)
      setAtividadeRecente((current) => ({
        ...current,
        data: (current.data || []).filter((atividade) => atividade.id !== redacaoParaExcluir.id),
      }))
      setRedacaoParaExcluir(null)
      toast?.showToast('Redação excluída com sucesso', 'success')
    } catch (requestError) {
      setRedacaoParaExcluir(null)
      toast?.showToast(requestError.response?.data?.message || 'Nao foi possivel excluir a redacao.', 'error')
    } finally {
      setDeletingRedacao(false)
    }
  }

  const metrics = useMemo(() => [
    {
      label: 'Redacoes corrigidas',
      value: resumo.data?.totalRedacoesCorrigidas ?? 0,
      icon: FileText,
      tone: 'primary',
    },
    {
      label: 'Candidatos cadastrados',
      value: resumo.data?.totalCandidatos ?? 0,
      icon: UsersRound,
      tone: 'success',
    },
    {
      label: 'Provas ativas',
      value: resumo.data?.totalProvasAtivas ?? 0,
      icon: ListChecks,
      tone: 'warning',
    },
  ], [resumo.data])

  return (
    <section className="contentBand">
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Administracao</p>
          <h1>Dashboard</h1>
        </div>
        <div className="dashboardHeaderMeta">
          <span>Ola, {usuario?.nome || 'admin'}</span>
          <small>{formatDateLong(new Date())}</small>
          <Button variant="secondary" onClick={() => carregarDashboard()} loading={refreshing} aria-label="Atualizar dashboard">
            <RefreshCw size={17} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {resumo.error && <p className="formError">{resumo.error}</p>}
      <div className="metricGrid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} loading={resumo.loading} />
        ))}
      </div>

      <div className="dashboardGrid">
        <Card className="chartCard">
          <div className="cardTitle">
            <h3>Redacoes por dia</h3>
            <span>Ultimos 7 dias</span>
          </div>
          {redacoesPorDia.loading ? (
            <SkeletonLoader rows={2} />
          ) : redacoesPorDia.error ? (
            <p className="formError">{redacoesPorDia.error}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={redacoesPorDia.data || []} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="redacoesArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F6AF5" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#4F6AF5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="data" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<DashboardTooltip labelName="Data" valueName="Redacoes" />} />
                <Area type="monotone" dataKey="quantidade" stroke="#4F6AF5" strokeWidth={3} fill="url(#redacoesArea)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="chartCard">
          <div className="cardTitle">
            <h3>Provas mais utilizadas</h3>
            <span>Top 5</span>
          </div>
          {rankingProvas.loading ? (
            <SkeletonLoader rows={2} />
          ) : rankingProvas.error ? (
            <p className="formError">{rankingProvas.error}</p>
          ) : (rankingProvas.data || []).length === 0 ? (
            <EmptyState title="Sem dados de ranking." subtitle="As provas aparecem aqui quando receberem redacoes." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={(rankingProvas.data || []).map((item) => ({
                  ...item,
                  label: `${item.cargo} - ${item.banca}`,
                }))}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 28, bottom: 0 }}
              >
                <CartesianGrid stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis dataKey="label" type="category" width={128} tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<DashboardTooltip valueName="Redacoes" />} />
                <Bar dataKey="totalRedacoes" fill="#4F6AF5" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="activityCard">
        <div className="cardTitle">
          <h3>Atividade recente</h3>
          <span>Ultimas 10 redacoes</span>
        </div>
        {atividadeRecente.loading ? (
          <SkeletonLoader rows={5} />
        ) : atividadeRecente.error ? (
          <p className="formError">{atividadeRecente.error}</p>
        ) : (atividadeRecente.data || []).length === 0 ? (
          <EmptyState title="Nenhuma atividade recente." subtitle="As redacoes enviadas pelos candidatos aparecerao aqui." />
        ) : (
          <div className="tableWrap">
            <table className="activityTable">
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Prova</th>
                  <th>Status</th>
                  <th>Nota</th>
                  <th>Aproveitamento</th>
                  <th>Data</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {atividadeRecente.data.map((atividade) => (
                  <tr key={atividade.id}>
                    <td>{atividade.nomeCandidato}</td>
                    <td>{atividade.cargo} - {atividade.banca}</td>
                    <td>
                      <Badge status={atividade.status} pulse={atividade.status === 'PROCESSANDO'}>
                        {statusLabel(atividade.status)}
                      </Badge>
                    </td>
                    <td>{atividade.status === 'CONCLUIDA' ? formatNumber(atividade.notaTotal) : '-'}</td>
                    <td>
                      {atividade.status === 'CONCLUIDA' ? (
                        <div className="miniProgressCell">
                          <ProgressBar value={atividade.percentualAproveitamento || 0} />
                          <span>{Math.round(atividade.percentualAproveitamento || 0)}%</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{formatDateTime(atividade.createdAt)}</td>
                    <td>
                      <div className="tableActions">
                        <Button
                          aria-label="Excluir redação"
                          className="iconButton"
                          disabled={deletingRedacao}
                          variant="danger"
                          onClick={() => setRedacaoParaExcluir(atividade)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="quickActions">
        <Button as={Link} to="/admin/provas">
          Gerenciar Provas
        </Button>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Novo tema sugerido
        </Button>
      </div>

      {modalOpen && (
        <SugestaoTemaModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            toast?.showToast('Tema sugerido criado com sucesso.', 'success')
            setModalOpen(false)
          }}
        />
      )}

      {redacaoParaExcluir && (
        <div className="modalBackdrop" role="presentation">
          <Card className="quickModal" role="dialog" aria-modal="true" aria-labelledby="delete-redacao-title">
            <div className="modalHeader">
              <div>
                <p className="eyebrow">Excluir redacao</p>
                <h2 id="delete-redacao-title">Excluir redação</h2>
                <p className="muted">
                  Esta ação é irreversível. A redação e seu resultado de correção serão excluídos permanentemente.
                </p>
              </div>
              <Button aria-label="Fechar" disabled={deletingRedacao} variant="ghost" onClick={() => setRedacaoParaExcluir(null)}>
                <X size={18} />
              </Button>
            </div>
            <div className="buttonGroup">
              <Button disabled={deletingRedacao} variant="secondary" onClick={() => setRedacaoParaExcluir(null)}>
                Cancelar
              </Button>
              <Button disabled={deletingRedacao} loading={deletingRedacao} variant="danger" onClick={confirmarExclusaoRedacao}>
                Excluir permanentemente
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}

function MetricCard({ metric, loading }) {
  const Icon = metric.icon
  const animatedValue = useAnimatedNumber(metric.value)

  return (
    <Card className={`metricCard metricCard--${metric.tone}`}>
      {loading ? (
        <SkeletonLoader rows={1} />
      ) : (
        <>
          <span className="metricIcon" aria-hidden="true">
            <Icon size={22} />
          </span>
          <div>
            <span>{metric.label}</span>
            <strong>{animatedValue.toLocaleString('pt-BR')}</strong>
          </div>
        </>
      )}
    </Card>
  )
}

function SugestaoTemaModal({ onClose, onCreated }) {
  const [provas, setProvas] = useState([])
  const [idProva, setIdProva] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})

  useEffect(() => {
    let active = true

    async function carregarProvas() {
      try {
        const data = await listarProvasAdmin()
        if (active) {
          setProvas(data.filter((prova) => prova.ativo))
        }
      } catch {
        if (active) {
          setError('Nao foi possivel carregar as provas.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    carregarProvas()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ idProva: true, titulo: true })

    if (!idProva || !titulo.trim()) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await criarSugestaoTema(idProva, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        ativo: true,
      })
      onCreated()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Nao foi possivel criar a sugestao.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modalBackdrop" role="presentation">
      <Card as="form" className="quickModal" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-labelledby="sugestao-title">
        <div className="modalHeader">
          <div>
            <p className="eyebrow">Atalho rapido</p>
            <h2 id="sugestao-title">Novo tema sugerido</h2>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </Button>
        </div>

        {loading ? (
          <SkeletonLoader rows={3} />
        ) : (
          <>
            <Input
              as="select"
              disabled={saving}
              error={touched.idProva && !idProva ? 'Selecione uma prova.' : ''}
              label="Prova"
              onBlur={() => setTouched((current) => ({ ...current, idProva: true }))}
              onChange={(event) => setIdProva(event.target.value)}
              required
              value={idProva}
            >
              <option value="" disabled>
                Selecione uma prova
              </option>
              {provas.map((prova) => (
                <option key={prova.id} value={prova.id}>
                  {prova.cargo} - {prova.banca}/{prova.estado}
                </option>
              ))}
            </Input>
            <Input
              disabled={saving}
              error={touched.titulo && !titulo.trim() ? 'Informe o titulo.' : ''}
              label="Titulo"
              onBlur={() => setTouched((current) => ({ ...current, titulo: true }))}
              onChange={(event) => setTitulo(event.target.value)}
              required
              value={titulo}
            />
            <Input
              as="textarea"
              disabled={saving}
              label="Descricao"
              onChange={(event) => setDescricao(event.target.value)}
              rows={3}
              value={descricao}
            />
          </>
        )}

        {error && <p className="formError">{error}</p>}

        <div className="formFooter">
          <Button disabled={saving} variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={saving || loading} loading={saving} type="submit">
            Criar sugestao
          </Button>
        </div>
      </Card>
    </div>
  )
}

function DashboardTooltip({ active, payload, label, labelName = 'Prova', valueName }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="chartTooltip">
      <strong>{labelName}: {label}</strong>
      <span>{valueName}: {payload[0].value}</span>
    </div>
  )
}

function useAnimatedNumber(value) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1000

    function update(now) {
      const progress = Math.min(1, (now - start) / duration)
      setDisplayValue(Math.round(value * progress))

      if (progress < 1) {
        window.requestAnimationFrame(update)
      }
    }

    const frame = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(frame)
  }, [value])

  return displayValue
}

function applySectionResult(setter, result, fallbackMessage) {
  if (result.status === 'fulfilled') {
    setter({ data: result.value, loading: false, error: '' })
    return
  }

  setter((current) => ({ ...current, loading: false, error: fallbackMessage }))
}

function formatDateLong(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(value)
}

function formatDateTime(value) {
  if (!value) {
    return '-'
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

export default AdminDashboard

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { listarProvas, listarSugestoesProva, submeterRedacao } from '../api/candidato'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import FolhaRedacao from '../components/FolhaRedacao'
import Input from '../components/Input'
import SkeletonLoader from '../components/SkeletonLoader'
import Spinner from '../components/Spinner'

const MAX_TEXTO = 5000
const MIN_LINHAS = 5

function SubmissaoRedacao() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const provaInicial = searchParams.get('idProva') || ''
  const draft = location.state?.draft || {}
  const [provas, setProvas] = useState([])
  const [idProva, setIdProva] = useState(draft.idProva ? String(draft.idProva) : provaInicial)
  const [sugestoes, setSugestoes] = useState([])
  const [selectedSugestaoId, setSelectedSugestaoId] = useState(null)
  const [tema, setTema] = useState(draft.tema || '')
  const [texto, setTexto] = useState(draft.texto || '')
  const [linhasUtilizadas, setLinhasUtilizadas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingSugestoes, setLoadingSugestoes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sugestoesError, setSugestoesError] = useState('')
  const [touched, setTouched] = useState({})

  const provaSelecionada = useMemo(
    () => provas.find((prova) => String(prova.id) === String(idProva)),
    [idProva, provas],
  )

  const temaPreenchido = tema.trim().length > 0
  const textoPreenchido = texto.trim().length > 0
  const linhasInsuficientes = linhasUtilizadas < MIN_LINHAS
  const canSubmit = Boolean(provaSelecionada) && temaPreenchido && textoPreenchido && !linhasInsuficientes && !submitting

  useEffect(() => {
    let active = true

    async function carregarProvas() {
      try {
        const data = await listarProvas()
        if (active) {
          setProvas(data)
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

  useEffect(() => {
    let active = true

    async function carregarSugestoes() {
      if (!idProva) {
        setSugestoes([])
        return
      }

      setLoadingSugestoes(true)
      setSugestoesError('')
      setSugestoes([])
      setSelectedSugestaoId(null)

      try {
        const data = await listarSugestoesProva(idProva)
        if (active) {
          setSugestoes(data)
        }
      } catch {
        if (active) {
          setSugestoesError('Nao foi possivel carregar as sugestoes de tema.')
        }
      } finally {
        if (active) {
          setLoadingSugestoes(false)
        }
      }
    }

    carregarSugestoes()

    return () => {
      active = false
    }
  }, [idProva])

  const handleProvaChange = (event) => {
    setIdProva(event.target.value)
    setTema('')
    setTexto('')
    setLinhasUtilizadas(0)
    setTouched({})
  }

  const handleTemaChange = (event) => {
    setTema(event.target.value)
    setSelectedSugestaoId(null)
  }

  const handleSugestaoClick = (sugestao) => {
    if (selectedSugestaoId === sugestao.id) {
      setSelectedSugestaoId(null)
      setTema('')
      return
    }

    setSelectedSugestaoId(sugestao.id)
    setTema(sugestao.titulo)
    setTouched((current) => ({ ...current, tema: true }))
  }

  const handleTextoChange = useCallback((nextTexto) => {
    setTexto(nextTexto)
  }, [])

  const handleLinhaCountChange = useCallback((nextLinhaCount) => {
    setLinhasUtilizadas(nextLinhaCount)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ idProva: true, tema: true, texto: true })

    if (!canSubmit) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const redacao = await submeterRedacao({
        idProva: Number(idProva),
        tema: tema.trim(),
        texto: texto.trim(),
      })
      navigate(`/candidato/redacoes/${redacao.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Nao foi possivel enviar sua redacao.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="submissionPage" onSubmit={handleSubmit}>
      <div className="submissionHeader">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/candidato">Dashboard</Link>
            <ChevronRight size={14} />
            <span>Nova redacao</span>
          </nav>
          <h1>Nova redacao</h1>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : provas.length === 0 ? (
        <EmptyState title="Nenhuma prova ativa." subtitle="Aguarde uma configuracao de prova para enviar redacoes." />
      ) : (
        <>
          <Card className="submissionStep fadeInStep">
            <div className="stepHeader">
              <span>1</span>
              <div>
                <h2>Selecionar prova</h2>
                <p>Escolha a configuracao de correcao antes de escrever.</p>
              </div>
            </div>
            <Input
              as="select"
              disabled={submitting}
              error={touched.idProva && !idProva ? 'Selecione uma prova.' : ''}
              label="Selecionar prova"
              onBlur={() => setTouched((current) => ({ ...current, idProva: true }))}
              onChange={handleProvaChange}
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
            {provaSelecionada && (
              <div className="examBadges fadeInStep">
                <Badge status="processando">{provaSelecionada.quantidadeLinhas} linhas disponiveis</Badge>
                <Badge status="default">Nota maxima: {formatNumber(provaSelecionada.notaMaxima)}</Badge>
              </div>
            )}
          </Card>

          {provaSelecionada && (
            <Card className="submissionStep fadeInStep">
              <div className="stepHeader">
                <span>2</span>
                <div>
                  <h2>Tema da redacao</h2>
                  <p>Digite o tema ou selecione uma sugestao abaixo.</p>
                </div>
              </div>
              <Input
                disabled={submitting}
                error={touched.tema && !temaPreenchido ? 'Informe o tema da redacao.' : ''}
                label="Tema da redacao"
                onBlur={() => setTouched((current) => ({ ...current, tema: true }))}
                onChange={handleTemaChange}
                placeholder="Digite o tema ou selecione uma sugestao abaixo"
                required
                value={tema}
              />

              {loadingSugestoes && <SkeletonLoader rows={1} />}
              {sugestoesError && <p className="formError">{sugestoesError}</p>}
              {!loadingSugestoes && sugestoes.length > 0 && (
                <div className="suggestionBlock">
                  <span>Sugestoes de tema:</span>
                  <div className="themeChips" aria-label="Sugestoes de tema">
                    {sugestoes.map((sugestao) => (
                      <button
                        className={selectedSugestaoId === sugestao.id ? 'themeChip themeChip--active' : 'themeChip'}
                        disabled={submitting}
                        key={sugestao.id}
                        onClick={() => handleSugestaoClick(sugestao)}
                        type="button"
                      >
                        {sugestao.titulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {provaSelecionada && temaPreenchido && (
            <section className="submissionEditorStep fadeInStep">
              <div className="editorTop">
                <div className="stepHeader">
                  <span>3</span>
                  <div>
                    <h2>Folha de redacao</h2>
                    <p>Escreva respeitando o limite de linhas da prova.</p>
                  </div>
                </div>
                <strong>{linhasUtilizadas} / {provaSelecionada.quantidadeLinhas} linhas utilizadas</strong>
              </div>
              <FolhaRedacao
                disabled={submitting}
                maxLength={MAX_TEXTO}
                onChange={handleTextoChange}
                onLinhaCountChange={handleLinhaCountChange}
                showFooter={false}
                totalLinhas={provaSelecionada.quantidadeLinhas}
                value={texto}
              />
              {touched.texto && !textoPreenchido && (
                <span className="fieldError">Digite sua redacao antes de enviar.</span>
              )}
              {touched.texto && textoPreenchido && linhasInsuficientes && (
                <span className="fieldError">Escreva pelo menos {MIN_LINHAS} linhas antes de enviar.</span>
              )}
            </section>
          )}
        </>
      )}

      {error && <p className="formError">{error}</p>}

      <div className="submissionFixedFooter">
        <span className={texto.length > MAX_TEXTO * 0.9 ? 'counter counterWarn' : 'counter'}>
          {texto.length} / {MAX_TEXTO.toLocaleString('pt-BR')} caracteres
        </span>
        <Button disabled={!canSubmit} type="submit">
          {submitting ? (
            <>
              <Spinner label="" size="sm" />
              Enviando...
            </>
          ) : (
            'Enviar para correcao'
          )}
        </Button>
      </div>
    </form>
  )
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default SubmissaoRedacao

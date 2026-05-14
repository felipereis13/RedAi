import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listarProvas, submeterRedacao } from '../api/candidato'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import FolhaRedacao from '../components/FolhaRedacao'
import Input from '../components/Input'
import SkeletonLoader from '../components/SkeletonLoader'

const MAX_TEXTO = 5000
const MIN_LINHAS = 5
const LINHAS_PLACEHOLDER = 30
const TEMAS_SUGERIDOS = [
  'Tecnologia e cidadania',
  'Gestao publica eficiente',
  'Educacao e inclusao social',
]

function SubmissaoRedacao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const provaInicial = searchParams.get('idProva') || ''
  const [provas, setProvas] = useState([])
  const [idProva, setIdProva] = useState(provaInicial)
  const [tema, setTema] = useState('')
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [linhasUtilizadas, setLinhasUtilizadas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})

  const provaSelecionada = useMemo(
    () => provas.find((prova) => String(prova.id) === String(idProva)),
    [idProva, provas],
  )

  const totalLinhas = provaSelecionada?.quantidadeLinhas || LINHAS_PLACEHOLDER
  const textoVazio = texto.trim().length === 0
  const temaVazio = tema.trim().length === 0
  const tituloVazio = titulo.trim().length === 0
  const linhasInsuficientes = linhasUtilizadas < MIN_LINHAS
  const canSubmit = Boolean(idProva) && !temaVazio && !tituloVazio && !textoVazio && !linhasInsuficientes && !submitting

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ idProva: true, tema: true, titulo: true, texto: true })

    if (!canSubmit) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const redacao = await submeterRedacao({
        idProva: Number(idProva),
        tema: tema.trim(),
        titulo: titulo.trim(),
        texto: texto.trim(),
      })
      navigate(`/candidato/redacoes/${redacao.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Nao foi possivel enviar sua redacao.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTemaChipClick = (temaSugerido) => {
    setTema(temaSugerido)
    setTouched((current) => ({ ...current, tema: true }))
  }

  const handleTextoChange = useCallback((nextTexto) => {
    setTexto(nextTexto)
  }, [])

  const handleLinhaCountChange = useCallback((nextLinhaCount) => {
    setLinhasUtilizadas(nextLinhaCount)
  }, [])

  return (
    <section className="contentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Submissao</p>
          <h2>Enviar redacao para correcao</h2>
        </div>
        <Button as={Link} variant="secondary" to="/candidato/provas">
          Ver provas
        </Button>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : (
        <Card as="form" className="submissionForm" onSubmit={handleSubmit}>
          {provas.length === 0 ? (
            <EmptyState title="Nenhuma prova ativa." subtitle="Aguarde uma configuracao de prova para enviar redacoes." />
          ) : (
            <Input
              as="select"
              disabled={submitting}
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
          )}

          {provas.length > 0 && (
            <>
              {provaSelecionada && (
                <p className="examLineInfo">Esta prova permite ate {provaSelecionada.quantidadeLinhas} linhas</p>
              )}

              {provaSelecionada && (
                <div className="selectedExam">
                  <strong>{provaSelecionada.cargo}</strong>
                  <span>
                    {provaSelecionada.banca} - {provaSelecionada.estado} - nota maxima{' '}
                    {formatNumber(provaSelecionada.notaMaxima)} - {provaSelecionada.quantidadeLinhas} linhas
                  </span>
                </div>
              )}

              <div className="themeBlock">
                <Input
                  disabled={submitting}
                  error={touched.tema && temaVazio ? 'Informe o tema da redacao.' : ''}
                  label="Tema"
                  onBlur={() => setTouched((current) => ({ ...current, tema: true }))}
                  onChange={(event) => setTema(event.target.value)}
                  required
                  value={tema}
                />
                <div className="themeChips" aria-label="Sugestoes de tema">
                  {TEMAS_SUGERIDOS.map((temaSugerido) => (
                    <button
                      className={tema === temaSugerido ? 'themeChip themeChip--active' : 'themeChip'}
                      disabled={submitting}
                      key={temaSugerido}
                      onClick={() => handleTemaChipClick(temaSugerido)}
                      type="button"
                    >
                      {temaSugerido}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                disabled={submitting}
                error={touched.titulo && tituloVazio ? 'Informe o titulo da redacao.' : ''}
                label="Titulo"
                onBlur={() => setTouched((current) => ({ ...current, titulo: true }))}
                onChange={(event) => setTitulo(event.target.value)}
                required
                value={titulo}
              />

              <div className="submissionEditor">
                <FolhaRedacao
                  disabled={submitting || !provaSelecionada}
                  maxLength={MAX_TEXTO}
                  onChange={handleTextoChange}
                  onLinhaCountChange={handleLinhaCountChange}
                  placeholder={!provaSelecionada ? 'Selecione uma prova para comecar a escrever' : ''}
                  totalLinhas={totalLinhas}
                  value={texto}
                />
                {touched.texto && textoVazio && (
                  <span className="fieldError">Digite sua redacao antes de enviar.</span>
                )}
                {touched.texto && !textoVazio && linhasInsuficientes && (
                  <span className="fieldError">Escreva pelo menos {MIN_LINHAS} linhas antes de enviar.</span>
                )}
              </div>

              <div className="formFooter">
                <span className="counter">
                  Minimo de {MIN_LINHAS} linhas para envio
                </span>
                <Button disabled={!canSubmit} loading={submitting} type="submit">
                  Enviar para correcao
                </Button>
              </div>
            </>
          )}

          {error && <p className="formError">{error}</p>}
        </Card>
      )}
    </section>
  )
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default SubmissaoRedacao

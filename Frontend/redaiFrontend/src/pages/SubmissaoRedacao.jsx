import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listarProvas, submeterRedacao } from '../api/candidato'
import Spinner from '../components/Spinner'

const MAX_TEXTO = 5000

function SubmissaoRedacao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const provaInicial = searchParams.get('idProva') || ''
  const [provas, setProvas] = useState([])
  const [idProva, setIdProva] = useState(provaInicial)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const provaSelecionada = useMemo(
    () => provas.find((prova) => String(prova.id) === String(idProva)),
    [idProva, provas],
  )

  useEffect(() => {
    let active = true

    async function carregarProvas() {
      try {
        const data = await listarProvas()
        if (active) {
          setProvas(data)
          if (!provaInicial && data.length > 0) {
            setIdProva(String(data[0].id))
          }
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
  }, [provaInicial])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const redacao = await submeterRedacao({
        idProva: Number(idProva),
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
    <section className="contentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Submissao</p>
          <h2>Enviar redacao para correcao</h2>
        </div>
        <Link className="secondaryLinkButton" to="/candidato/provas">
          Ver provas
        </Link>
      </div>

      {loading ? (
        <Spinner label="Carregando formulario" />
      ) : (
        <form className="submissionForm" onSubmit={handleSubmit}>
          <label>
            Prova
            <select
              disabled={submitting || provas.length === 0}
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
            </select>
          </label>

          {provaSelecionada && (
            <div className="selectedExam">
              <strong>{provaSelecionada.cargo}</strong>
              <span>
                {provaSelecionada.banca} · {provaSelecionada.estado} · nota maxima{' '}
                {formatNumber(provaSelecionada.notaMaxima)}
              </span>
            </div>
          )}

          <label>
            Texto da redacao
            <textarea
              disabled={submitting}
              maxLength={MAX_TEXTO}
              onChange={(event) => setTexto(event.target.value)}
              placeholder="Digite sua redacao aqui..."
              required
              rows={14}
              value={texto}
            />
          </label>

          <div className="formFooter">
            <span className={texto.length > MAX_TEXTO * 0.9 ? 'counter counterWarn' : 'counter'}>
              {texto.length} / {MAX_TEXTO}
            </span>
            <button disabled={submitting || !idProva || texto.trim().length === 0} type="submit">
              {submitting ? <Spinner label="Enviando" /> : 'Enviar para correcao'}
            </button>
          </div>

          {error && <p className="formError">{error}</p>}
        </form>
      )}
    </section>
  )
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default SubmissaoRedacao

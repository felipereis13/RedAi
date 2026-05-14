import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listarProvas, submeterRedacao } from '../api/candidato'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import SkeletonLoader from '../components/SkeletonLoader'

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
  const [touched, setTouched] = useState({})

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
    setTouched({ idProva: true, texto: true })

    if (!idProva || texto.trim().length === 0) {
      return
    }

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

          {provaSelecionada && (
            <div className="selectedExam">
              <strong>{provaSelecionada.cargo}</strong>
              <span>
                {provaSelecionada.banca} · {provaSelecionada.estado} · nota maxima{' '}
                {formatNumber(provaSelecionada.notaMaxima)}
              </span>
            </div>
          )}

          <Input
            as="textarea"
            disabled={submitting}
            error={touched.texto && texto.trim().length === 0 ? 'Digite sua redacao antes de enviar.' : ''}
            label="Texto da redacao"
            maxLength={MAX_TEXTO}
            onBlur={() => setTouched((current) => ({ ...current, texto: true }))}
            onChange={(event) => setTexto(event.target.value)}
            required
            rows={14}
            value={texto}
          />

          <div className="formFooter">
            <span className={texto.length > MAX_TEXTO * 0.9 ? 'counter counterWarn' : 'counter'}>
              {texto.length} / {MAX_TEXTO}
            </span>
            <Button disabled={submitting || !idProva || texto.trim().length === 0} loading={submitting} type="submit">
              Enviar para correcao
            </Button>
          </div>

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

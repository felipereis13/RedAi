import { useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { atualizarProva, criarProva, desativarProva, listarProvasAdmin } from '../api/admin'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import SkeletonLoader from '../components/SkeletonLoader'
import { useToast } from '../components/useToast'

const criterioVazio = {
  nome: '',
  descricao: '',
  notaMaxima: '',
}

const formInicial = {
  cargo: '',
  banca: '',
  estado: '',
  descricao: '',
  notaMaxima: '',
  quantidadeLinhas: '30',
  criterios: [{ ...criterioVazio }],
}

function AdminProvas() {
  const [provas, setProvas] = useState([])
  const [form, setForm] = useState(formInicial)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [touched, setTouched] = useState({})
  const toast = useToast()

  const somaCriterios = useMemo(
    () => form.criterios.reduce((total, criterio) => total + toNumber(criterio.notaMaxima), 0),
    [form.criterios],
  )
  const notaMaximaProva = toNumber(form.notaMaxima)
  const somaExcedida = notaMaximaProva > 0 && somaCriterios > notaMaximaProva

  async function carregarProvas() {
    setLoading(true)
    try {
      setProvas(await listarProvasAdmin())
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel carregar as provas.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function carregarInicial() {
      try {
        const data = await listarProvasAdmin()
        if (active) {
          setProvas(data)
        }
      } catch {
        if (active) {
          setFeedback({ type: 'error', message: 'Nao foi possivel carregar as provas.' })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    carregarInicial()

    return () => {
      active = false
    }
  }, [])

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleCriterioChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      criterios: current.criterios.map((criterio, criterioIndex) =>
        criterioIndex === index ? { ...criterio, [field]: value } : criterio,
      ),
    }))
  }

  const adicionarCriterio = () => {
    setForm((current) => ({
      ...current,
      criterios: [...current.criterios, { ...criterioVazio }],
    }))
  }

  const removerCriterio = (index) => {
    setForm((current) => ({
      ...current,
      criterios:
        current.criterios.length === 1
          ? [{ ...criterioVazio }]
          : current.criterios.filter((_, criterioIndex) => criterioIndex !== index),
    }))
  }

  const limparFormulario = () => {
    setEditingId(null)
    setForm(formInicial)
    setTouched({})
  }

  const editarProva = (prova) => {
    setEditingId(prova.id)
    setForm({
      cargo: prova.cargo || '',
      banca: prova.banca || '',
      estado: prova.estado || '',
      descricao: prova.descricao || '',
      notaMaxima: String(prova.notaMaxima ?? ''),
      quantidadeLinhas: String(prova.quantidadeLinhas ?? 30),
      criterios: prova.criterios?.length
        ? prova.criterios.map((criterio) => ({
            nome: criterio.nome || '',
            descricao: criterio.descricao || '',
            notaMaxima: String(criterio.notaMaxima ?? ''),
          }))
        : [{ ...criterioVazio }],
    })
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ cargo: true, banca: true, estado: true, notaMaxima: true, quantidadeLinhas: true, criterios: true })

    if (somaExcedida) {
      setFeedback({
        type: 'error',
        message: 'A soma das notas dos criterios ultrapassa a nota maxima da prova.',
      })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const payload = buildPayload(form)

      if (editingId) {
        await atualizarProva(editingId, payload)
        setFeedback({ type: 'success', message: 'Prova atualizada com sucesso.' })
        toast?.showToast('Prova atualizada com sucesso.', 'success')
      } else {
        await criarProva(payload)
        setFeedback({ type: 'success', message: 'Prova criada com sucesso.' })
        toast?.showToast('Prova criada com sucesso.', 'success')
      }

      limparFormulario()
      await carregarProvas()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Nao foi possivel salvar a prova.',
      })
      toast?.showToast(error.response?.data?.message || 'Nao foi possivel salvar a prova.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDesativar = async (prova) => {
    const confirmed = window.confirm(`Desativar a prova "${prova.cargo}"?`)

    if (!confirmed) {
      return
    }

    try {
      await desativarProva(prova.id)
      setFeedback({ type: 'success', message: 'Prova desativada com sucesso.' })
      toast?.showToast('Prova desativada com sucesso.', 'success')
      await carregarProvas()
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel desativar a prova.' })
      toast?.showToast('Nao foi possivel desativar a prova.', 'error')
    }
  }

  return (
    <section className="contentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Configuracoes de prova</p>
          <h2>{editingId ? 'Editar prova' : 'Criar nova prova'}</h2>
        </div>
        {editingId && (
          <Button variant="secondary" onClick={limparFormulario}>
            Cancelar edicao
          </Button>
        )}
      </div>

      {feedback && (
        <p className={feedback.type === 'success' ? 'formSuccess' : 'formError'}>{feedback.message}</p>
      )}

      <Card as="form" className="adminForm" onSubmit={handleSubmit}>
        <div className="formGrid">
          <Input
            error={touched.cargo && !form.cargo ? 'Informe o cargo.' : ''}
            label="Cargo"
            onBlur={() => setTouched((current) => ({ ...current, cargo: true }))}
            onChange={(event) => handleFieldChange('cargo', event.target.value)}
            required
            type="text"
            value={form.cargo}
          />
          <Input
            error={touched.banca && !form.banca ? 'Informe a banca.' : ''}
            label="Banca"
            onBlur={() => setTouched((current) => ({ ...current, banca: true }))}
            onChange={(event) => handleFieldChange('banca', event.target.value)}
            required
            type="text"
            value={form.banca}
          />
          <Input
            error={touched.estado && form.estado.length !== 2 ? 'Use a sigla com 2 letras.' : ''}
            label="Estado"
            maxLength={2}
            onBlur={() => setTouched((current) => ({ ...current, estado: true }))}
            onChange={(event) => handleFieldChange('estado', event.target.value.toUpperCase())}
            required
            type="text"
            value={form.estado}
          />
          <Input
            error={touched.notaMaxima && notaMaximaProva <= 0 ? 'Informe uma nota maior que zero.' : ''}
            label="Nota maxima"
            min="0.1"
            onBlur={() => setTouched((current) => ({ ...current, notaMaxima: true }))}
            onChange={(event) => handleFieldChange('notaMaxima', event.target.value)}
            required
            step="0.1"
            type="number"
            value={form.notaMaxima}
          />
          <Input
            error={
              touched.quantidadeLinhas && !isQuantidadeLinhasValida(form.quantidadeLinhas)
                ? 'Informe entre 10 e 60 linhas.'
                : ''
            }
            label="Quantidade de linhas"
            max="60"
            min="10"
            onBlur={() => setTouched((current) => ({ ...current, quantidadeLinhas: true }))}
            onChange={(event) => handleFieldChange('quantidadeLinhas', event.target.value)}
            required
            step="1"
            type="number"
            value={form.quantidadeLinhas}
          />
        </div>

        <Input
          as="textarea"
          label="Descricao"
          onChange={(event) => handleFieldChange('descricao', event.target.value)}
          rows={4}
          value={form.descricao}
        />

        <div className={somaExcedida ? 'sumAlert sumAlertError' : 'sumAlert'}>
          Soma dos criterios: {formatNumber(somaCriterios)} / {formatNumber(notaMaximaProva)}
        </div>

        {somaExcedida && (
          <p className="formError">A soma das notas maximas dos criterios nao pode ultrapassar a nota maxima da prova.</p>
        )}

        <div className="criteriaHeader">
          <h3>Criterios de correcao</h3>
          <Button variant="secondary" onClick={adicionarCriterio}>
            Adicionar criterio
          </Button>
        </div>

        <div className="criteriaList">
          {form.criterios.map((criterio, index) => (
            <article className="criterionCard" key={index}>
              <div className="criterionTop">
                <strong>Criterio {index + 1}</strong>
                <Button variant="ghostDanger" onClick={() => removerCriterio(index)}>
                  Remover
                </Button>
              </div>
              <div className="formGrid">
                <Input
                  error={touched.criterios && !criterio.nome ? 'Informe o nome do criterio.' : ''}
                  label="Nome"
                  onChange={(event) => handleCriterioChange(index, 'nome', event.target.value)}
                  required
                  type="text"
                  value={criterio.nome}
                />
                <Input
                  error={touched.criterios && toNumber(criterio.notaMaxima) <= 0 ? 'Nota maior que zero.' : ''}
                  label="Nota maxima"
                  min="0.1"
                  onChange={(event) => handleCriterioChange(index, 'notaMaxima', event.target.value)}
                  required
                  step="0.1"
                  type="number"
                  value={criterio.notaMaxima}
                />
              </div>
              <Input
                as="textarea"
                error={touched.criterios && !criterio.descricao ? 'Descreva o criterio.' : ''}
                label="Descricao"
                onChange={(event) => handleCriterioChange(index, 'descricao', event.target.value)}
                required
                rows={3}
                value={criterio.descricao}
              />
            </article>
          ))}
        </div>

        <div className="formFooter">
          <span className="counter">
            {editingId ? `Editando prova #${editingId}` : 'Nova configuracao'}
          </span>
          <Button disabled={saving || somaExcedida} loading={saving} type="submit">
            {editingId ? 'Salvar alteracoes' : 'Criar prova'}
          </Button>
        </div>
      </Card>

      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Provas cadastradas</p>
          <h2>Gerenciar provas</h2>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : provas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma prova cadastrada."
          subtitle="Crie a primeira configuracao para liberar envios aos candidatos."
        />
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Banca</th>
                <th>Estado</th>
                <th>Linhas</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {provas.map((prova) => (
                <tr key={prova.id}>
                  <td>{prova.cargo}</td>
                  <td>{prova.banca}</td>
                  <td>{prova.estado}</td>
                  <td>{prova.quantidadeLinhas}</td>
                  <td>
                    <Badge status={prova.ativo ? 'CONCLUIDA' : 'ERRO'}>{prova.ativo ? 'Ativa' : 'Inativa'}</Badge>
                  </td>
                  <td>
                    <div className="tableActions">
                      <Button variant="secondary" onClick={() => editarProva(prova)}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        disabled={!prova.ativo}
                        onClick={() => handleDesativar(prova)}
                      >
                        Desativar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function buildPayload(form) {
  return {
    cargo: form.cargo.trim(),
    banca: form.banca.trim(),
    estado: form.estado.trim().toUpperCase(),
    descricao: form.descricao.trim(),
    notaMaxima: toNumber(form.notaMaxima),
    quantidadeLinhas: Number(form.quantidadeLinhas),
    criterios: form.criterios.map((criterio) => ({
      nome: criterio.nome.trim(),
      descricao: criterio.descricao.trim(),
      notaMaxima: toNumber(criterio.notaMaxima),
    })),
  }
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function isQuantidadeLinhasValida(value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 10 && number <= 60
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default AdminProvas

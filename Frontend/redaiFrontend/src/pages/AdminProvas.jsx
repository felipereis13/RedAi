import { useEffect, useMemo, useState } from 'react'
import { atualizarProva, criarProva, desativarProva, listarProvasAdmin } from '../api/admin'
import Spinner from '../components/Spinner'

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
  criterios: [{ ...criterioVazio }],
}

function AdminProvas() {
  const [provas, setProvas] = useState([])
  const [form, setForm] = useState(formInicial)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

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
  }

  const editarProva = (prova) => {
    setEditingId(prova.id)
    setForm({
      cargo: prova.cargo || '',
      banca: prova.banca || '',
      estado: prova.estado || '',
      descricao: prova.descricao || '',
      notaMaxima: String(prova.notaMaxima ?? ''),
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
      } else {
        await criarProva(payload)
        setFeedback({ type: 'success', message: 'Prova criada com sucesso.' })
      }

      limparFormulario()
      await carregarProvas()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Nao foi possivel salvar a prova.',
      })
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
      await carregarProvas()
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel desativar a prova.' })
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
          <button className="secondaryGhostButton" onClick={limparFormulario} type="button">
            Cancelar edicao
          </button>
        )}
      </div>

      {feedback && (
        <p className={feedback.type === 'success' ? 'formSuccess' : 'formError'}>{feedback.message}</p>
      )}

      <form className="adminForm" onSubmit={handleSubmit}>
        <div className="formGrid">
          <label>
            Cargo
            <input
              onChange={(event) => handleFieldChange('cargo', event.target.value)}
              required
              type="text"
              value={form.cargo}
            />
          </label>
          <label>
            Banca
            <input
              onChange={(event) => handleFieldChange('banca', event.target.value)}
              required
              type="text"
              value={form.banca}
            />
          </label>
          <label>
            Estado
            <input
              maxLength={2}
              onChange={(event) => handleFieldChange('estado', event.target.value.toUpperCase())}
              required
              type="text"
              value={form.estado}
            />
          </label>
          <label>
            Nota maxima
            <input
              min="0.1"
              onChange={(event) => handleFieldChange('notaMaxima', event.target.value)}
              required
              step="0.1"
              type="number"
              value={form.notaMaxima}
            />
          </label>
        </div>

        <label>
          Descricao
          <textarea
            onChange={(event) => handleFieldChange('descricao', event.target.value)}
            rows={4}
            value={form.descricao}
          />
        </label>

        <div className={somaExcedida ? 'sumAlert sumAlertError' : 'sumAlert'}>
          Soma dos criterios: {formatNumber(somaCriterios)} / {formatNumber(notaMaximaProva)}
        </div>

        {somaExcedida && (
          <p className="formError">A soma das notas maximas dos criterios nao pode ultrapassar a nota maxima da prova.</p>
        )}

        <div className="criteriaHeader">
          <h3>Criterios de correcao</h3>
          <button className="secondaryGhostButton" onClick={adicionarCriterio} type="button">
            Adicionar criterio
          </button>
        </div>

        <div className="criteriaList">
          {form.criterios.map((criterio, index) => (
            <article className="criterionCard" key={index}>
              <div className="criterionTop">
                <strong>Criterio {index + 1}</strong>
                <button className="dangerTextButton" onClick={() => removerCriterio(index)} type="button">
                  Remover
                </button>
              </div>
              <div className="formGrid">
                <label>
                  Nome
                  <input
                    onChange={(event) => handleCriterioChange(index, 'nome', event.target.value)}
                    required
                    type="text"
                    value={criterio.nome}
                  />
                </label>
                <label>
                  Nota maxima
                  <input
                    min="0.1"
                    onChange={(event) => handleCriterioChange(index, 'notaMaxima', event.target.value)}
                    required
                    step="0.1"
                    type="number"
                    value={criterio.notaMaxima}
                  />
                </label>
              </div>
              <label>
                Descricao
                <textarea
                  onChange={(event) => handleCriterioChange(index, 'descricao', event.target.value)}
                  required
                  rows={3}
                  value={criterio.descricao}
                />
              </label>
            </article>
          ))}
        </div>

        <div className="formFooter">
          <span className="counter">
            {editingId ? `Editando prova #${editingId}` : 'Nova configuracao'}
          </span>
          <button disabled={saving || somaExcedida} type="submit">
            {saving ? <Spinner label="Salvando" /> : editingId ? 'Salvar alteracoes' : 'Criar prova'}
          </button>
        </div>
      </form>

      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Provas cadastradas</p>
          <h2>Gerenciar provas</h2>
        </div>
      </div>

      {loading ? (
        <Spinner label="Carregando provas" />
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Banca</th>
                <th>Estado</th>
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
                  <td>
                    <span className={prova.ativo ? 'statusBadge statusCONCLUIDA' : 'statusBadge statusERRO'}>
                      {prova.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <div className="tableActions">
                      <button className="secondaryGhostButton" onClick={() => editarProva(prova)} type="button">
                        Editar
                      </button>
                      <button
                        className="dangerButton"
                        disabled={!prova.ativo}
                        onClick={() => handleDesativar(prova)}
                        type="button"
                      >
                        Desativar
                      </button>
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default AdminProvas

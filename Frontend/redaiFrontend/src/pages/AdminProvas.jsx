import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  FileText,
  FileType2,
  HelpCircle,
  Plus,
  Trash2,
  Trophy,
  Upload,
  X,
} from 'lucide-react'
import {
  atualizarProva,
  criarEspelhoProva,
  criarProva,
  desativarProva,
  excluirEspelhoProva,
  excluirProva,
  excluirRedacaoAdmin,
  listarEspelhosProva,
  listarProvasAdmin,
  listarRedacoesProva,
} from '../api/admin'
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
  const [espelhos, setEspelhos] = useState([])
  const [redacoes, setRedacoes] = useState([])
  const [loadingEspelhos, setLoadingEspelhos] = useState(false)
  const [loadingRedacoes, setLoadingRedacoes] = useState(false)
  const [removingItem, setRemovingItem] = useState(null)
  const [redacaoParaExcluir, setRedacaoParaExcluir] = useState(null)
  const [provaParaExcluir, setProvaParaExcluir] = useState(null)
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

  async function carregarEspelhos(idProva = editingId) {
    if (!idProva) {
      setEspelhos([])
      return
    }

    setLoadingEspelhos(true)
    try {
      setEspelhos(await listarEspelhosProva(idProva))
    } catch {
      toast?.showToast('Nao foi possivel carregar espelhos e modelos.', 'error')
    } finally {
      setLoadingEspelhos(false)
    }
  }

  async function carregarRedacoes(idProva = editingId) {
    if (!idProva) {
      setRedacoes([])
      return
    }

    setLoadingRedacoes(true)
    try {
      setRedacoes(await listarRedacoesProva(idProva))
    } catch {
      toast?.showToast('Nao foi possivel carregar as redacoes da prova.', 'error')
    } finally {
      setLoadingRedacoes(false)
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
    setEspelhos([])
    setRedacoes([])
  }

  const editarProva = (prova) => {
    setEditingId(prova.id)
    setForm(provaToForm(prova))
    setFeedback(null)
    carregarEspelhos(prova.id)
    carregarRedacoes(prova.id)
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
        const provaAtualizada = await atualizarProva(editingId, payload)
        setForm(provaToForm(provaAtualizada))
        setFeedback({ type: 'success', message: 'Prova atualizada com sucesso.' })
        toast?.showToast('Prova atualizada com sucesso.', 'success')
      } else {
        const provaCriada = await criarProva(payload)
        setEditingId(provaCriada.id)
        setForm(provaToForm(provaCriada))
        setFeedback({ type: 'success', message: 'Prova criada com sucesso. Agora voce pode adicionar espelhos e modelos.' })
        toast?.showToast('Prova criada com sucesso.', 'success')
        await carregarEspelhos(provaCriada.id)
        await carregarRedacoes(provaCriada.id)
      }

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

  const salvarReferencia = async (tipo, draft, onProgress) => {
    if (!editingId) {
      return
    }

    const formData = new FormData()
    formData.append('titulo', draft.titulo.trim())
    formData.append('tipo', tipo)

    if (draft.conteudoTexto?.trim()) {
      formData.append('conteudoTexto', draft.conteudoTexto.trim())
    }

    if (draft.arquivo) {
      formData.append('arquivo', draft.arquivo)
    }

    await criarEspelhoProva(editingId, formData, (event) => {
      if (!event.total) {
        return
      }
      onProgress(Math.round((event.loaded * 100) / event.total))
    })
    await carregarEspelhos(editingId)
  }

  const confirmarRemocao = async () => {
    if (!editingId || !removingItem) {
      return
    }

    setSaving(true)
    try {
      await excluirEspelhoProva(editingId, removingItem.id)
      toast?.showToast('Item removido com sucesso.', 'success')
      setRemovingItem(null)
      await carregarEspelhos(editingId)
    } catch {
      toast?.showToast('Nao foi possivel remover o item.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmarExclusaoRedacao = async () => {
    if (!redacaoParaExcluir) {
      return
    }

    setSaving(true)
    try {
      await excluirRedacaoAdmin(redacaoParaExcluir.id)
      setRedacoes((current) => current.filter((redacao) => redacao.id !== redacaoParaExcluir.id))
      setRedacaoParaExcluir(null)
      toast?.showToast('Redação excluída com sucesso', 'success')
    } catch (error) {
      setRedacaoParaExcluir(null)
      toast?.showToast(error.response?.data?.message || 'Nao foi possivel excluir a redacao.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmarExclusaoProva = async () => {
    if (!provaParaExcluir) {
      return
    }

    setSaving(true)

    try {
      await excluirProva(provaParaExcluir.id)
      setProvas((current) => current.filter((prova) => prova.id !== provaParaExcluir.id))
      if (editingId === provaParaExcluir.id) {
        limparFormulario()
      }
      setProvaParaExcluir(null)
      toast?.showToast('Prova excluída com sucesso.', 'success')
    } catch (error) {
      setProvaParaExcluir(null)
      toast?.showToast(error.response?.data?.message || 'Nao foi possivel excluir a prova.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDesativar = async (prova) => {
    const confirmed = window.confirm(`Desativar a prova "${prova.cargo}"?`)

    if (!confirmed) {
      return
    }

    setSaving(true)

    try {
      await desativarProva(prova.id)
      setFeedback({ type: 'success', message: 'Prova desativada com sucesso.' })
      toast?.showToast('Prova desativada com sucesso.', 'success')
      await carregarProvas()
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel desativar a prova.' })
      toast?.showToast('Nao foi possivel desativar a prova.', 'error')
    } finally {
      setSaving(false)
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
          <Button disabled={saving} variant="secondary" onClick={limparFormulario}>
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
            disabled={saving}
            error={touched.cargo && !form.cargo ? 'Informe o cargo.' : ''}
            label="Cargo"
            onBlur={() => setTouched((current) => ({ ...current, cargo: true }))}
            onChange={(event) => handleFieldChange('cargo', event.target.value)}
            required
            type="text"
            value={form.cargo}
          />
          <Input
            disabled={saving}
            error={touched.banca && !form.banca ? 'Informe a banca.' : ''}
            label="Banca"
            onBlur={() => setTouched((current) => ({ ...current, banca: true }))}
            onChange={(event) => handleFieldChange('banca', event.target.value)}
            required
            type="text"
            value={form.banca}
          />
          <Input
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
          disabled={saving}
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
          <Button disabled={saving} variant="secondary" onClick={adicionarCriterio}>
            Adicionar criterio
          </Button>
        </div>

        <div className="criteriaList">
          {form.criterios.map((criterio, index) => (
            <article className="criterionCard" key={index}>
              <div className="criterionTop">
                <strong>Criterio {index + 1}</strong>
                <Button disabled={saving} variant="ghostDanger" onClick={() => removerCriterio(index)}>
                  Remover
                </Button>
              </div>
              <div className="formGrid">
                <Input
                  disabled={saving}
                  error={touched.criterios && !criterio.nome ? 'Informe o nome do criterio.' : ''}
                  label="Nome"
                  onChange={(event) => handleCriterioChange(index, 'nome', event.target.value)}
                  required
                  type="text"
                  value={criterio.nome}
                />
                <Input
                  disabled={saving}
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
                disabled={saving}
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

        <div
          className="referenceCard"
          title={!editingId ? 'Salve a prova primeiro para adicionar espelhos e modelos' : undefined}
        >
          <ReferenceSection
            disabled={!editingId || saving}
            icon={FileText}
            info="O espelho orienta a IA sobre os criterios esperados pela banca. Adicione ate 2 espelhos por prova."
            items={espelhos.filter((item) => item.tipo === 'ESPELHO')}
            label="Espelho"
            loading={loadingEspelhos}
            onRemove={setRemovingItem}
            onSave={salvarReferencia}
            placeholder="Cole aqui o espelho de correcao disponibilizado pela banca..."
            title="Espelho de correcao da banca"
            tipo="ESPELHO"
          />

          <div className="referenceDivider" />

          <ReferenceSection
            disabled={!editingId || saving}
            icon={Trophy}
            info="Redacoes com nota maxima aumentam a precisao da correcao da IA. Adicione ate 2 redacoes modelo por prova."
            items={espelhos.filter((item) => item.tipo === 'REDACAO_MODELO')}
            label="Modelo"
            loading={loadingEspelhos}
            onRemove={setRemovingItem}
            onSave={salvarReferencia}
            placeholder="Cole aqui uma redacao que recebeu nota maxima..."
            title="Redacoes modelo (nota maxima)"
            tipo="REDACAO_MODELO"
          />
        </div>

        {editingId && (
          <section className="referenceCard">
            <div className="referenceHeader">
              <div className="referenceTitle">
                <FileText size={20} />
                <div>
                  <h3>Redações enviadas para esta prova</h3>
                  <span>{redacoes.length} redações encontradas</span>
                </div>
              </div>
            </div>

            {loadingRedacoes ? (
              <SkeletonLoader rows={3} />
            ) : redacoes.length === 0 ? (
              <p className="muted">Nenhuma redação enviada para esta prova.</p>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tema</th>
                      <th>Status</th>
                      <th>Nota</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redacoes.map((redacao) => (
                      <tr key={redacao.id}>
                        <td>{redacao.tema || redacao.titulo || `Redação #${redacao.id}`}</td>
                        <td>
                          <Badge status={redacao.status} pulse={redacao.status === 'PROCESSANDO'}>
                            {statusLabel(redacao.status)}
                          </Badge>
                        </td>
                        <td>{redacao.status === 'CONCLUIDA' ? formatNumber(redacao.notaTotal) : '-'}</td>
                        <td>{formatDateTime(redacao.createdAt)}</td>
                        <td>
                          <div className="tableActions">
                            <Button disabled={saving} variant="danger" onClick={() => setRedacaoParaExcluir(redacao)}>
                              <Trash2 size={16} />
                              Excluir
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
        )}

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
                      <Button disabled={saving} variant="secondary" onClick={() => editarProva(prova)}>
                        Editar
                      </Button>
                      <Button
                        variant="warning"
                        disabled={saving || !prova.ativo}
                        onClick={() => handleDesativar(prova)}
                      >
                        Desativar
                      </Button>
                      <Button
                        variant="danger"
                        disabled={saving}
                        onClick={() => setProvaParaExcluir(prova)}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removingItem && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="removeReferenceTitle">
          <Card className="quickModal">
            <div className="modalHeader">
              <div>
                <p className="eyebrow">Remover item</p>
                <h2 id="removeReferenceTitle">Tem certeza que deseja remover este item?</h2>
                <p className="muted">{removingItem.titulo}</p>
              </div>
              <Button aria-label="Fechar" disabled={saving} variant="ghost" onClick={() => setRemovingItem(null)}>
                <X size={18} />
              </Button>
            </div>
            <div className="buttonGroup">
              <Button disabled={saving} variant="secondary" onClick={() => setRemovingItem(null)}>
                Cancelar
              </Button>
              <Button disabled={saving} loading={saving} variant="danger" onClick={confirmarRemocao}>
                Remover
              </Button>
            </div>
          </Card>
        </div>
      )}

      {redacaoParaExcluir && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="deleteEssayTitle">
          <Card className="quickModal">
            <div className="modalHeader">
              <div>
                <p className="eyebrow">Excluir redação</p>
                <h2 id="deleteEssayTitle">Excluir redação</h2>
                <p className="muted">
                  Esta ação é irreversível. A redação e seu resultado de correção serão excluídos permanentemente.
                </p>
              </div>
              <Button aria-label="Fechar" disabled={saving} variant="ghost" onClick={() => setRedacaoParaExcluir(null)}>
                <X size={18} />
              </Button>
            </div>
            <div className="buttonGroup">
              <Button disabled={saving} variant="secondary" onClick={() => setRedacaoParaExcluir(null)}>
                Cancelar
              </Button>
              <Button disabled={saving} loading={saving} variant="danger" onClick={confirmarExclusaoRedacao}>
                Excluir permanentemente
              </Button>
            </div>
          </Card>
        </div>
      )}

      {provaParaExcluir && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="deleteExamTitle">
          <Card className="quickModal">
            <div className="modalHeader">
              <div>
                <p className="eyebrow">Excluir prova</p>
                <h2 id="deleteExamTitle">Excluir prova</h2>
                <p className="muted">
                  Esta ação é irreversível. A prova, critérios, espelhos e modelos serão excluídos permanentemente se não houver redações enviadas.
                </p>
              </div>
              <Button aria-label="Fechar" disabled={saving} variant="ghost" onClick={() => setProvaParaExcluir(null)}>
                <X size={18} />
              </Button>
            </div>
            <div className="buttonGroup">
              <Button disabled={saving} variant="secondary" onClick={() => setProvaParaExcluir(null)}>
                Cancelar
              </Button>
              <Button disabled={saving} loading={saving} variant="danger" onClick={confirmarExclusaoProva}>
                Excluir permanentemente
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}

function ReferenceSection({
  disabled,
  icon: Icon,
  info,
  items,
  label,
  loading,
  onRemove,
  onSave,
  placeholder,
  title,
  tipo,
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('texto')
  const [titulo, setTitulo] = useState('')
  const [conteudoTexto, setConteudoTexto] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const toast = useToast()
  const remaining = Math.max(0, 2 - items.length)
  const limitReached = remaining === 0
  const canAdd = !disabled && !limitReached

  const resetDraft = () => {
    setTitulo('')
    setConteudoTexto('')
    setArquivo(null)
    setMode('texto')
    setProgress(0)
    setError('')
  }

  const handleFile = (file) => {
    if (!file) {
      return
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF.')
      setArquivo(null)
      return
    }

    setError('')
    setArquivo(file)
  }

  const handleSubmit = async () => {
    const tituloValido = titulo.trim()
    const temTexto = mode === 'texto' && conteudoTexto.trim()
    const temArquivo = mode === 'pdf' && arquivo

    if (!tituloValido) {
      setError('Informe o titulo.')
      return
    }

    if (!temTexto && !temArquivo) {
      setError(mode === 'texto' ? 'Cole o texto antes de salvar.' : 'Selecione um PDF antes de salvar.')
      return
    }

    setSaving(true)
    setError('')
    setProgress(temArquivo ? 1 : 0)

    try {
      await onSave(
        tipo,
        {
          titulo,
          conteudoTexto: temTexto ? conteudoTexto : '',
          arquivo: temArquivo ? arquivo : null,
        },
        setProgress,
      )
      toast?.showToast(tipo === 'ESPELHO' ? 'Espelho salvo com sucesso.' : 'Redacao modelo salva com sucesso.', 'success')
      resetDraft()
      setOpen(false)
    } catch (saveError) {
      const message = saveError.response?.data?.message || 'Nao foi possivel salvar o item.'
      setError(message)
      toast?.showToast(message, 'error')
    } finally {
      setSaving(false)
      setProgress(0)
    }
  }

  return (
    <section className={['referenceSection', disabled ? 'referenceSection--disabled' : ''].filter(Boolean).join(' ')}>
      <div className="referenceHeader">
        <div className="referenceTitle">
          <Icon size={20} />
          <div>
            <h3>{title}</h3>
            <span>{items.length} de 2 adicionados - voce pode adicionar mais {remaining}</span>
          </div>
          <HelpCircle className="tooltipIcon" size={17} tabIndex={0} aria-label={info} title={info} />
        </div>
        <Button
          disabled={!canAdd || saving}
          variant="secondary"
          onClick={() => setOpen((current) => !current)}
          title={disabled ? 'Salve a prova primeiro para adicionar espelhos e modelos' : undefined}
        >
          <Plus size={17} />
          {label === 'Espelho' ? 'Adicionar espelho' : 'Adicionar modelo'}
        </Button>
      </div>

      {loading ? (
        <p className="muted">Carregando itens...</p>
      ) : items.length > 0 ? (
        <div className="referenceList">
          {items.map((item) => (
            <article className="referenceItem" key={item.id}>
              <div className="referenceItemIcon">
                {item.temArquivo ? <FileType2 size={18} /> : <FileText size={18} />}
              </div>
              <div>
                <strong>{item.titulo}</strong>
                <span>{item.temArquivo ? item.nomeArquivo || 'PDF enviado' : 'Texto colado'}</span>
              </div>
              <Badge status="processando">
                {label} {item.ordem}
              </Badge>
              <Button
                aria-label={`Remover ${item.titulo}`}
                disabled={disabled || saving}
                variant="ghostDanger"
                onClick={() => onRemove(item)}
              >
                <Trash2 size={17} />
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum item adicionado.</p>
      )}

      {open && canAdd && (
        <div className="referenceComposer">
          <Input
            disabled={saving}
            label="Titulo"
            onChange={(event) => setTitulo(event.target.value)}
            required
            type="text"
            value={titulo}
          />

          <div className="referenceTabs" role="tablist" aria-label={`Tipo de ${label.toLowerCase()}`}>
            <button
              className={mode === 'texto' ? 'referenceTab referenceTab--active' : 'referenceTab'}
              disabled={saving}
              type="button"
              onClick={() => setMode('texto')}
            >
              Colar texto
            </button>
            <button
              className={mode === 'pdf' ? 'referenceTab referenceTab--active' : 'referenceTab'}
              disabled={saving}
              type="button"
              onClick={() => setMode('pdf')}
            >
              Upload PDF
            </button>
          </div>

          {mode === 'texto' ? (
            <textarea
              className="referenceTextarea"
              disabled={saving}
              onChange={(event) => setConteudoTexto(event.target.value)}
              placeholder={placeholder}
              value={conteudoTexto}
            />
          ) : (
            <label
              className={['dropZone', dragging ? 'dropZone--dragging' : ''].filter(Boolean).join(' ')}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                handleFile(event.dataTransfer.files?.[0])
              }}
            >
              <Upload size={28} />
              <span>Arraste o PDF aqui ou clique para selecionar</span>
              {arquivo && <strong>{arquivo.name}</strong>}
              <input
                accept=".pdf,application/pdf"
                disabled={saving}
                hidden
                type="file"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>
          )}

          {progress > 0 && (
            <div className="uploadProgress">
              <span style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && <p className="fieldError">{error}</p>}

          <div className="buttonGroup">
            <Button disabled={saving} variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={saving} loading={saving} onClick={handleSubmit}>
              {label === 'Espelho' ? 'Salvar espelho' : 'Salvar modelo'}
            </Button>
          </div>
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

function provaToForm(prova) {
  return {
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

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
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

export default AdminProvas

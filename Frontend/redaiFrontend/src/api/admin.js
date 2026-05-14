import api from './axiosInstance'

export async function listarProvasAdmin() {
  const response = await api.get('/api/admin/provas')
  return response.data
}

export async function criarProva(payload) {
  const response = await api.post('/api/admin/provas', payload)
  return response.data
}

export async function atualizarProva(id, payload) {
  const response = await api.put(`/api/admin/provas/${id}`, payload)
  return response.data
}

export async function desativarProva(id) {
  await api.delete(`/api/admin/provas/${id}`)
}

export async function criarSugestaoTema(idProva, payload) {
  const response = await api.post(`/api/admin/provas/${idProva}/sugestoes`, payload)
  return response.data
}

export async function buscarDashboardResumo() {
  const response = await api.get('/api/admin/dashboard/resumo')
  return response.data
}

export async function buscarRedacoesPorDia() {
  const response = await api.get('/api/admin/dashboard/redacoes-por-dia')
  return response.data
}

export async function buscarRankingProvas() {
  const response = await api.get('/api/admin/dashboard/ranking-provas')
  return response.data
}

export async function buscarAtividadeRecente() {
  const response = await api.get('/api/admin/dashboard/atividade-recente')
  return response.data
}

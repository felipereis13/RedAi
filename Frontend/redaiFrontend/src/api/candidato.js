import api from './axiosInstance'

export async function listarProvas() {
  const response = await api.get('/api/candidato/provas')
  return response.data
}

export async function listarRedacoes() {
  const response = await api.get('/api/candidato/redacoes')
  return response.data
}

export async function submeterRedacao(payload) {
  const response = await api.post('/api/candidato/redacoes', payload)
  return response.data
}

export async function buscarRedacao(id) {
  const response = await api.get(`/api/candidato/redacoes/${id}`)
  return response.data
}

export async function buscarDashboardCandidatoResumo() {
  const response = await api.get('/api/candidato/dashboard/resumo')
  return response.data
}

export async function buscarDashboardCandidatoEvolucao() {
  const response = await api.get('/api/candidato/dashboard/evolucao')
  return response.data
}

export async function buscarDashboardCandidatoUltimasRedacoes() {
  const response = await api.get('/api/candidato/dashboard/ultimas-redacoes')
  return response.data
}

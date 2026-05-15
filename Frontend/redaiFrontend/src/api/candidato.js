import api from './axiosInstance'

export async function listarProvas() {
  const response = await api.get('/api/candidato/provas')
  return response.data
}

export async function listarSugestoesProva(idProva) {
  const response = await api.get(`/api/candidato/provas/${idProva}/sugestoes`)
  return response.data
}

export async function listarRedacoes() {
  const response = await api.get('/api/candidato/redacoes')
  return response.data
}

export async function listarHistoricoRedacoes({ idProva = '', status = '', pagina = 0, tamanho = 10 } = {}) {
  const response = await api.get('/api/candidato/redacoes/historico', {
    params: {
      idProva: idProva || undefined,
      status: status || undefined,
      pagina,
      tamanho,
    },
  })
  return response.data
}

export async function buscarEvolucaoNotas({ idProva = '' } = {}) {
  const response = await api.get('/api/candidato/redacoes/evolucao', {
    params: {
      idProva: idProva || undefined,
    },
  })
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

export async function reenviarRedacao(id) {
  const response = await api.post(`/api/candidato/redacoes/${id}/reenviar`)
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

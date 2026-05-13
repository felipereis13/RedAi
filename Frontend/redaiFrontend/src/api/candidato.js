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

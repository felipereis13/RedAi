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

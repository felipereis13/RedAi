import axios from 'axios'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('redai:token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (unauthorizedHandler) {
        unauthorizedHandler()
      } else {
        localStorage.removeItem('redai:token')
        localStorage.removeItem('redai:user')
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

export default api

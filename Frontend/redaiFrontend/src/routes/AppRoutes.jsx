import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import CandidatoLayout from '../components/CandidatoLayout'
import PrivateRoute from '../components/PrivateRoute'
import AdminProvas from '../pages/AdminProvas'
import ListaProvas from '../pages/ListaProvas'
import Login from '../pages/Login'
import PainelCandidato from '../pages/PainelCandidato'
import Registro from '../pages/Registro'
import ResultadoRedacao from '../pages/ResultadoRedacao'
import SubmissaoRedacao from '../pages/SubmissaoRedacao'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/candidato" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<PrivateRoute allowedRoles={['CANDIDATO']} />}>
        <Route element={<CandidatoLayout />}>
          <Route path="/candidato" element={<PainelCandidato />} />
          <Route path="/candidato/provas" element={<ListaProvas />} />
          <Route path="/candidato/redacoes/nova" element={<SubmissaoRedacao />} />
          <Route path="/candidato/redacoes/:id" element={<ResultadoRedacao />} />
        </Route>
      </Route>
      <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminProvas />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/candidato" replace />} />
    </Routes>
  )
}

export default AppRoutes

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function PrivateRoute({ allowedRoles }) {
  const { isAuthenticated, usuario } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(usuario?.role)) {
    return <Navigate to={usuario?.role === 'ADMIN' ? '/admin' : '/candidato'} replace />
  }

  return <Outlet />
}

export default PrivateRoute

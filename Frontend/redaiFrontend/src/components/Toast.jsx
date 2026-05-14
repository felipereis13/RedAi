import { CheckCircle2, XCircle } from 'lucide-react'

function Toast({ message, type = 'success' }) {
  const Icon = type === 'success' ? CheckCircle2 : XCircle

  return (
    <div className={`toast toast--${type}`} role="status">
      <Icon size={18} />
      <span>{message}</span>
    </div>
  )
}

export default Toast

import { FileText } from 'lucide-react'

function EmptyState({ icon: Icon = FileText, title, subtitle }) {
  return (
    <div className="emptyState">
      <span className="emptyStateIcon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <strong>{title}</strong>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

export default EmptyState

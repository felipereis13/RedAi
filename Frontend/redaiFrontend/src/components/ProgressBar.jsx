function ProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
  const tone = safeValue < 40 ? 'danger' : safeValue < 70 ? 'warning' : safeValue < 90 ? 'primary' : 'success'

  return (
    <div className="progress" aria-label={`Aproveitamento ${Math.round(safeValue)}%`}>
      <span className={`progressFill progressFill--${tone}`} style={{ width: `${safeValue}%` }} />
    </div>
  )
}

export default ProgressBar

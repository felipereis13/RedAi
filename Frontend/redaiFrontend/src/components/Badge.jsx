function Badge({ children, status = 'default', pulse = false }) {
  const normalized = String(status || 'default').toLowerCase()

  return (
    <span className={['badge', `badge--${normalized}`, pulse ? 'badge--pulse' : ''].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}

export default Badge

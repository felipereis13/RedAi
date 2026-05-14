function Spinner({ label = 'Carregando', size = 'md' }) {
  return (
    <span className={`spinnerWrap spinnerWrap--${size}`} role="status" aria-live="polite">
      <span className={`spinner spinner--${size}`} aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}

export default Spinner

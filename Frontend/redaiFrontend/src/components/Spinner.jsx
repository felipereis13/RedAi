function Spinner({ label = 'Carregando' }) {
  return (
    <span className="spinnerWrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label}
    </span>
  )
}

export default Spinner

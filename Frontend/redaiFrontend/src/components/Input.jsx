function Input({
  as: Component = 'input',
  error = '',
  id,
  label,
  className = '',
  required,
  ...props
}) {
  return (
    <label className={['field', error ? 'field--error' : '', className].filter(Boolean).join(' ')}>
      <span className="fieldControl">
        <Component
          id={id}
          className="fieldInput"
          placeholder=" "
          required={required}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        <span className="fieldLabel">
          {label}
          {required ? ' *' : ''}
        </span>
      </span>
      {error && <span className="fieldError">{error}</span>}
    </label>
  )
}

export default Input

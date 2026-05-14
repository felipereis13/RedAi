import Spinner from './Spinner'

function Button({
  as: Component = 'button',
  children,
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = ['uiButton', `uiButton--${variant}`, className].filter(Boolean).join(' ')
  const isButton = Component === 'button'

  return (
    <Component
      className={classes}
      disabled={isButton ? disabled || loading : undefined}
      type={isButton ? type : undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      {...props}
    >
      {loading ? <Spinner label="" size="sm" /> : children}
    </Component>
  )
}

export default Button

import Spinner from './Spinner'

function Button({
  as: Component = 'button',
  children,
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = ['uiButton', `uiButton--${variant}`, className].filter(Boolean).join(' ')
  const isButton = Component === 'button'
  const isDisabled = disabled || loading

  const handleClick = (event) => {
    if (!isButton && isDisabled) {
      event.preventDefault()
      return
    }

    onClick?.(event)
  }

  return (
    <Component
      className={classes}
      disabled={isButton ? isDisabled : undefined}
      type={isButton ? type : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      onClick={handleClick}
      {...props}
    >
      {loading ? <Spinner label="" size="sm" /> : children}
    </Component>
  )
}

export default Button

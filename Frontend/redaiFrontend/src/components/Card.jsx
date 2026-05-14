function Card({ as: Component = 'article', children, className = '', ...props }) {
  return (
    <Component className={['card', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Component>
  )
}

export default Card

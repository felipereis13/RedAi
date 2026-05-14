function SkeletonLoader({ rows = 3, variant = 'block' }) {
  return (
    <div className={`skeletonGroup skeletonGroup--${variant}`} role="status" aria-label="Carregando">
      {Array.from({ length: rows }, (_, index) => (
        <span className="skeleton" key={index} />
      ))}
    </div>
  )
}

export default SkeletonLoader

export function Brand() {
  return (
    <div className="brand" aria-label="WanderPlan">
      <svg className="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 4 39 14v20L24 44 9 34V14L24 4Z" fill="currentColor" opacity=".14" />
        <path d="m12 33 9-15 5 8 4-6 7 13H12Z" fill="currentColor" />
        <path d="M24 9v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span><strong>WanderPlan</strong></span>
    </div>
  )
}

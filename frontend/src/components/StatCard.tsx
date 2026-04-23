import type { Stat } from '../types/profile'

type StatCardProps = {
  stat?: Stat
  loading?: boolean
}

function StatCard({ stat, loading }: StatCardProps) {
  if (loading || !stat) {
    return (
      <article className="stat-card">
      <span className="skeleton skeleton-text small"/>
      <strong className="skeleton skeleton-text"/>
    </article>
    )
  }

  return (
    <article className="stat-card">
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      {/* <p>{stat.helper}</p> */}
    </article>
  )
}

export default StatCard

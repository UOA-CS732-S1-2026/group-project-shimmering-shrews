import type { Stat } from '../types/profile'

type StatCardProps = {
  stat: Stat
}

function StatCard({ stat }: StatCardProps) {
  return (
    <article className="stat-card">
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      <p>{stat.helper}</p>
    </article>
  )
}

export default StatCard

import type { Badge } from '../types/profile'

type BadgeCardProps = {
  badge: Badge
}

function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <article className={badge.earned ? 'badge-card badge-card--earned' : 'badge-card badge-card--locked'}>
      <div className="badge-card__icon" aria-hidden="true">
        {badge.icon}
      </div>
      <div>
        <h3>{badge.name}</h3>
        <p>{badge.description}</p>
      </div>
      <span>{badge.earned ? 'Earned' : 'Locked'}</span>
    </article>
  )
}

export default BadgeCard

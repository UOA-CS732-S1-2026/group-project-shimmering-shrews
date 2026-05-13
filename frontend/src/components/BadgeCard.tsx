import type { Badge } from '../types/profile'

type BadgeCardProps = {
  badge?: Badge
  loading?: boolean
}

// Displays a single badge card showing the badge icon, name, description and earned status.
// Shows a skeleton loading state when badge data is not yet available.
function BadgeCard({ badge, loading }: BadgeCardProps) {
  // Show skeleton placeholder while loading
  if (loading || !badge) {
    return (
      <article className='badge-card badge-card--locked'>
        <div className="badge-card__icon" aria-hidden="true">
        </div>
        <div>
          <h3 className="skeleton skeleton-text small"/>
          <p className="skeleton skeleton-text small"/>
        </div>
        <span className="skeleton skeleton-text"/>
      </article>
    )
  }

  return (
    // Apply earned or locked styling based on badge status
    <article className={badge.earned ? 'badge-card badge-card--earned' : 'badge-card badge-card--locked'}>
      <div className="badge-card__icon" aria-hidden="true">
        {/* Show active icon if earned, inactive (greyed out) icon if locked */}
        <img
          src={badge.earned ? badge.active_icon : badge.inactive_icon}
          alt={badge.name}
        />
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
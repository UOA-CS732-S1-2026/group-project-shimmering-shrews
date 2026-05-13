import type { UserProfile } from '../types/profile'
import XPProgress from './XPProgress'

type ProfileHeaderProps = {
  profile: UserProfile | null
  loading?: boolean
}

function ProfileHeader({ profile, loading }: ProfileHeaderProps) {
  if (loading || !profile) {
    return (
      <header className="profile-header">
        <div className="profile-header__identity">
          <img className="profile-header__avatar"
            src={'/profile-placeholder.svg'}
            alt={`profile avatar`}
          />
          <div>
            <h1 className="skeleton skeleton-text" />
            <div className="profile-header__level">
              <span className="skeleton skeleton-text" />
            </div>
          </div>
        </div>
        <div className="xp-progress" aria-hidden="true">
          <div className="xp-progress__meta">
            <span className="skeleton skeleton-text" />
            <span className="skeleton skeleton-text" />
          </div>
          <div className="xp-progress__track">
            <div className="xp-progress__bar" style={{ width: '40%' }} />
          </div>
          <p className="skeleton skeleton-text small" />
        </div>
      </header>
    )
  }

  return (
    <header className="profile-header">
      <div className="profile-header__identity">
        <img className="profile-header__avatar"
          src={profile.avatarUrl ?? '/profile-placeholder.svg'}
          alt={`${profile.username} avatar`}
          onError={(event) => {
            event.currentTarget.src = '/profile-placeholder.svg'
          }}
        />
        <div>
          <h1>{profile.username}</h1>
          <div className="profile-header__level">
            <span>Level {profile.level}</span>
            <span>{profile.xp_earned} XP</span>
          </div>
        </div>
      </div>

      <XPProgress
        currentXP={profile.xp_earned}
        levelStartXP={profile.xpForCurrentLevel}
        nextLevelXP={profile.xpForNextLevel}
      />
    </header>
  )
}

export default ProfileHeader

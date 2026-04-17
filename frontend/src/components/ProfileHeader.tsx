import type { UserProfile } from '../types/profile'
import XPProgress from './XPProgress'

type ProfileHeaderProps = {
  profile: UserProfile
}

function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <header className="profile-header">
      <div className="profile-header__identity">
        <img className="profile-header__avatar" src={profile.avatarUrl} alt={`${profile.name} avatar`} />
        <div>
          <h1>{profile.name}</h1>
          <div className="profile-header__level">
            <span>Level {profile.level}</span>
          </div>
        </div>
      </div>

      <XPProgress
        currentXP={profile.xp}
        levelStartXP={profile.xpForCurrentLevel}
        nextLevelXP={profile.xpForNextLevel}
      />
    </header>
  )
}

export default ProfileHeader

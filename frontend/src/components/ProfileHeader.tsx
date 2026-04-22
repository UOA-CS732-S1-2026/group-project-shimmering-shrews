import type { UserProfile } from '../types/profile'
// import XPProgress from './XPProgress'

type ProfileHeaderProps = {
  profile: UserProfile
}

function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <header className="profile-header">
      <div className="profile-header__identity">
        <img className="profile-header__avatar"
          src={profile.avatarUrl ?? '/profile-placeholder.svg'}
          alt={`${profile.username} avatar`}
        />
        <div>
          <h1>{profile.username}</h1>
          <div className="profile-header__level">
            <span>Level {profile.level}</span>
          </div>
        </div>
      </div>

      {/* <XPProgress
        currentXP={profile.xp_earned}
        levelStartXP={profile.xpForCurrentLevel}
        nextLevelXP={profile.xpForNextLevel}
      /> */}
    </header>
  )
}

export default ProfileHeader

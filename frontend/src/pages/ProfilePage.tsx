import { useEffect, useMemo, useState } from 'react'
import BadgeCard from '../components/BadgeCard'
import BottomNav from '../components/BottomNav'
import ProfileHeader from '../components/ProfileHeader'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { badges, historyItems, userProfile as mockUserProfile } from '../data/profileData'
import { getMyProfile, type LiveProfile } from '../services/profile'
import type { Stat, TabKey } from '../types/profile'
import { useAuth } from '../context/useAuth'

const tabs: TabKey[] = ['badges', 'history']

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('badges')
  const [profile, setProfile] = useState<LiveProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const { user, loading, logout } = useAuth()
  const isLoggedIn = !!user

  useEffect(() => {
    if (loading || !user) {
      setProfile(null)
      setProfileError(null)
      setProfileLoading(false)
      return
    }

    let isActive = true

    setProfileLoading(true)
    setProfileError(null)

    getMyProfile()
      .then((data) => {
        if (isActive) {
          setProfile(data)
        }
      })
      .catch((error) => {
        console.error(error)

        if (isActive) {
          setProfileError(error instanceof Error ? error.message : 'Could not load live profile data.')
        }
      })
      .finally(() => {
        if (isActive) {
          setProfileLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [loading, user])

  const currentProfile = useMemo(() => {
    if (!profile) {
      return {
        ...mockUserProfile,
        name: profileLoading ? 'Loading profile...' : 'Profile unavailable',
        level: 0,
        xp: 0,
        streak: 0,
        badges: 0,
        challengesCompleted: 0,
        xpForCurrentLevel: 0,
        xpForNextLevel: 500,
      }
    }

    return {
      ...mockUserProfile,
      ...profile,
    }
  }, [profile, profileLoading])

  const currentBadges = useMemo(() => {
    if (!profile) {
      return []
    }

    return profile.badgeItems
  }, [profile])

  const currentHistory = useMemo(() => {
    if (!profile) {
      return []
    }

    return profile.historyItems
  }, [profile])

  const currentStats = useMemo<Stat[]>(
    () => [
      {
        label: 'Streak',
        value: `${currentProfile.streak} 🔥`,
        helper: 'days in a row',
      },
      {
        label: 'Badges',
        value: currentProfile.badges,
        helper: 'earned so far',
      },
      {
        label: 'Challenges',
        value: currentProfile.challengesCompleted,
        helper: 'city quests done',
      },
    ],
    [currentProfile]
  )

  if (!loading && !isLoggedIn) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <nav className="topbar" aria-label="Main navigation">
            <a href="/" aria-label="CityQuest home">
              CityQuest
            </a>
            <a className="logout-button" href="/login">
              Login
            </a>
          </nav>

          <p className="logout-message">Please sign in to view your profile.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container page page-profile">
      <div className="shell shell-profile">
        <nav className="topbar" aria-label="Main navigation">
          <a href="/" aria-label="CityQuest home">
            CityQuest
          </a>
          <button className="logout-button" type="button" onClick={() => logout()}>
            Logout
          </button>
        </nav>

        <ProfileHeader profile={currentProfile} />

        <section className="stats-grid" aria-label="Profile stats">
          {currentStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </section>

        {profileLoading ? <p className="logout-message">Loading profile...</p> : null}
        {profileError ? <p className="logout-message">{profileError}</p> : null}

        <section className="profile-content" aria-live="polite">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {renderTabContent(activeTab, currentProfile.badges, currentBadges, currentHistory)}
        </section>

        {!loading && !isLoggedIn ? <p className="logout-message">You have been logged out.</p> : null}
      </div>
      <BottomNav />
    </main>
  )
}

function renderTabContent(
  activeTab: TabKey,
  badgeCount: number,
  badgeItems: typeof badges,
  liveHistoryItems: typeof historyItems
) {
  if (activeTab === 'history') {
    return (
      <div className="tab-panel" role="tabpanel">
        <div className="section-heading">
          <p className="eyebrow">Recent Activity</p>
          <h2>City quest history</h2>
        </div>
        {liveHistoryItems.length ? (
          <ul className="history-list">
            {liveHistoryItems.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span>+{item.xp} XP</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="logout-message">No recent challenge history yet.</p>
        )}
      </div>
    )
  }

  return (
    <div className="tab-panel" role="tabpanel">
      <div className="section-heading">
        <p className="eyebrow">Badge Vault</p>
        <h2>{badgeCount} earned badges</h2>
      </div>

      {badgeItems.length ? (
        <div className="badge-grid">
          {badgeItems.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <p className="logout-message">No badges available yet.</p>
      )}
    </div>
  )
}

export default ProfilePage

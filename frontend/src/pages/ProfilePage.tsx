import { useEffect, useMemo, useState } from 'react'
import BadgeCard from '../components/BadgeCard'
import BottomNav from '../components/BottomNav'
import ProfileHeader from '../components/ProfileHeader'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { getMyProfile, type LiveProfile } from '../services/profile'
import type { Badge, HistoryItem, Stat, TabKey, UserProfile } from '../types/profile'
import { useAuth } from '../context/useAuth'
import { useLogout } from "../hooks/useLogout"

const tabs: TabKey[] = ['badges', 'history']

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('badges')
  const { user, session, loading } = useAuth()
  const logout = useLogout()
  const isLoggedIn = !!user

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user || !session) {
      setProfile(null)
      setHistoryItems([])
      setProfileError(null)
      setProfileLoading(false)
      return
    }

    let isActive = true

    const fetchProfile = async () => {
      setProfileLoading(true)
      setProfileError(null)

      try {
        const liveProfile = await getMyProfile()

        if (!isActive) {
          return
        }

        setProfile(mapLiveProfileToUserProfile(liveProfile))
        setHistoryItems(liveProfile.historyItems)
      } catch (error) {
        console.error('Failed to load profile', error)

        if (isActive) {
          setProfile(null)
          setHistoryItems([])
          setProfileError(
            error instanceof Error ? error.message : 'Could not load live profile data.'
          )
        }
      } finally {
        if (isActive) {
          setProfileLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isActive = false
    }
  }, [loading, session, user])

  const profileStats = useMemo<Stat[]>(
    () =>
      profile
        ? [
            { label: 'Level', value: profile.level },
            { label: 'XP', value: profile.xp_earned },
            { label: 'Streak', value: profile.streak_count },
          ]
        : [],
    [profile]
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
          <button className="logout-button" type="button" onClick={logout}>
            Logout
          </button>
        </nav>

        <ProfileHeader profile={profile} loading={profileLoading} />

        <section className="stats-grid" aria-label="Profile stats">
          {profileLoading
            ? ['1', '2', '3'].map((i) => <StatCard key={i} loading />)
            : profileStats.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
            ))
          }
        </section>

        {profileLoading ? <p className="logout-message">Loading profile...</p> : null}
        {profileError ? <p className="logout-message">{profileError}</p> : null}

        <section className="profile-content" aria-live="polite">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {renderTabContent(activeTab, profileLoading, profile?.badges ?? [], historyItems)}
        </section>

        {!loading && !isLoggedIn ? <p className="logout-message">You have been logged out.</p> : null}
      </div>
      <BottomNav />
    </main>
  )
}

function renderTabContent(
  activeTab: TabKey,
  loading: boolean,
  badgeItems: Badge[],
  historyItems: HistoryItem[]
) {
  if (activeTab === 'history') {
    return (
      <div className="tab-panel" role="tabpanel">
        <div className="section-heading">
          <p className="eyebrow">Recent Activity</p>
          <h2>City quest history</h2>
        </div>
        {loading ? (
          <p className="logout-message">Loading history...</p>
        ) : historyItems.length ? (
          <ul className="history-list">
            {historyItems.map((item) => (
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
        <h2>{loading ? 'Loading badges...' : `${badgeItems.filter((badge) => badge.earned).length} earned badges`}</h2>
      </div>

      {loading ? (
        <div className="badge-grid">
          {['1', '2', '3', '4', '5'].map((key) => (
            <BadgeCard key={key} loading />
          ))}
        </div>
      ) : badgeItems.length ? (
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

function mapLiveProfileToUserProfile(profile: LiveProfile): UserProfile {
  return {
    username: profile.name,
    xp_earned: profile.xp,
    level: profile.level,
    streak_count: profile.streak,
    badges: profile.badgeItems,
    challengesCompleted: profile.challengesCompleted,
    xpForCurrentLevel: profile.xpForCurrentLevel,
    xpForNextLevel: profile.xpForNextLevel,
    avatarUrl: '/profile-placeholder.svg',
  }
}

export default ProfilePage

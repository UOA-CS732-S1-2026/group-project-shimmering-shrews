import { useEffect, useMemo, useState } from 'react'
import BadgeCard from '../components/BadgeCard'
import BottomNav from '../components/BottomNav'
import ProfileHeader from '../components/ProfileHeader'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { getMyProfile, getLeaderboard, type LiveProfile, type Leaderboard } from '../services/profile'
import type { Badge, HistoryItem, Stat, TabKey, UserProfile } from '../types/profile'
import { useAuth } from '../context/useAuth'
import { useLogout } from "../hooks/useLogout"
import { Link } from "react-router-dom"

const tabs: TabKey[] = ['badges', 'history', 'leaderboard']
const fallbackAvatarUrl = '/profile-placeholder.svg'

// Extracts the user's Google avatar URL from Supabase user metadata.
// Falls back to a placeholder if no avatar URL is found.
const getGoogleAvatarUrl = (metadata: Record<string, unknown> | undefined) => {
  const avatarUrl = metadata?.avatar_url
  const picture = metadata?.picture

  if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
    return avatarUrl
  }

  if (typeof picture === 'string' && picture.trim()) {
    return picture
  }

  return fallbackAvatarUrl
}

// Displays the user's profile including stats, badges, challenge history, and leaderboard.
// Fetches profile data on mount and leaderboard data lazily when the leaderboard tab is selected.
function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('badges')
  const { user, session, loading } = useAuth()
  const logout = useLogout()
  const isLoggedIn = !!user

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  // Fetch profile data when the user session is available
  useEffect(() => {
    if (loading) return
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
        if (!isActive) return
        setProfile(mapLiveProfileToUserProfile(liveProfile, getGoogleAvatarUrl(user.user_metadata)))
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
        if (isActive) setProfileLoading(false)
      }
    }

    fetchProfile()
    return () => { isActive = false }
  }, [loading, session, user])

  // Fetch leaderboard data lazily when the leaderboard tab is first opened
  useEffect(() => {
    if (activeTab !== 'leaderboard') return
    if (leaderboard) return

    let isActive = true
    setLeaderboardLoading(true)
    setLeaderboardError(null)

    getLeaderboard()
      .then((data) => { if (isActive) setLeaderboard(data) })
      .catch(() => { if (isActive) setLeaderboardError('Could not load leaderboard.') })
      .finally(() => { if (isActive) setLeaderboardLoading(false) })

    return () => { isActive = false }
  }, [activeTab, leaderboard])

  // Build stat cards from the profile data
  const profileStats = useMemo<Stat[]>(
    () =>
      profile
        ? [
            { label: 'Streak', value: `${profile.streak_count} 🔥`, helper: 'days in a row' },
            { label: 'Badges', value: profile.badges.filter((badge) => badge.earned).length, helper: 'earned so far' },
            { label: 'Challenges', value: profile.challengesCompleted, helper: 'city quests done' },
          ]
        : [],
    [profile]
  )

  if (!loading && !isLoggedIn) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <nav className="topbar" aria-label="Main navigation">
            <Link to="/" aria-label="CityQuest home">CityQuest</Link>
            <Link className="logout-button" to="/login">Login</Link>
          </nav>
          <p className="status-message">Please sign in to view your profile.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container page page-profile">
      <div className="shell shell-profile">
        <nav className="topbar" aria-label="Main navigation">
          <Link to="/" aria-label="CityQuest home">CityQuest</Link>
          <button className="logout-button" type="button" onClick={logout}>Logout</button>
        </nav>

        <ProfileHeader profile={profile} loading={profileLoading} />

        <section className="stats-grid" aria-label="Profile stats">
          {profileLoading
            ? ['1', '2', '3'].map((i) => <StatCard key={i} loading />)
            : profileStats.map((stat) => <StatCard key={stat.label} stat={stat} />)
          }
        </section>

        {profileLoading ? <p className="status-message">Loading...</p> : null}
        {profileError ? <p className="status-message">{profileError}</p> : null}

        <section className="profile-content" aria-live="polite">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {renderTabContent(
            activeTab,
            profileLoading,
            profile?.badges ?? [],
            historyItems,
            leaderboard,
            leaderboardLoading,
            leaderboardError,
          )}
        </section>

        {!loading && !isLoggedIn ? <p className="status-message">You have been logged out.</p> : null}
      </div>
      <BottomNav />
    </main>
  )
}

// Renders the content for the active tab — leaderboard, history, or badges.
function renderTabContent(
  activeTab: TabKey,
  loading: boolean,
  badgeItems: Badge[],
  historyItems: HistoryItem[],
  leaderboard: Leaderboard | null,
  leaderboardLoading: boolean,
  leaderboardError: string | null,
) {
  if (activeTab === 'leaderboard') {
    return (
      <div className="tab-panel" role="tabpanel">
        <div className="section-heading">
          <p className="eyebrow">Top Players</p>
          <h2>Leaderboard</h2>
        </div>

        {leaderboardLoading && <p className="status-message">Loading leaderboard...</p>}
        {leaderboardError && <p className="status-message">{leaderboardError}</p>}

        {!leaderboardLoading && leaderboard && (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {leaderboard.topUsers.map((entry) => (
                <li
                  key={entry.rank}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    background: entry.isCurrentUser ? '#e8f5e9' : '#f5f7fa',
                    border: entry.isCurrentUser ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', width: '32px', textAlign: 'center' }}>
                    {entry.rank === 1 ? '👑' : `#${entry.rank}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{entry.username}{entry.isCurrentUser ? ' (You)' : ''}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Level {entry.level}</div>
                  </div>
                  <span style={{
                    background: '#4caf50',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}>
                    {entry.xp_earned} XP
                  </span>
                </li>
              ))}
            </ul>

            {leaderboard.currentUserRank && (
              <>
                <p style={{ textAlign: 'center', color: '#999', fontSize: '0.85rem', margin: '8px 0' }}>
                  • • •
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#e8f5e9',
                  border: '2px solid #4caf50',
                }}>
                  <span style={{ fontSize: '1.2rem', width: '32px', textAlign: 'center' }}>
                    #{leaderboard.currentUserRank.rank}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{leaderboard.currentUserRank.username} (You)</strong>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Level {leaderboard.currentUserRank.level}</div>
                  </div>
                  <span style={{
                    background: '#4caf50',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}>
                    {leaderboard.currentUserRank.xp_earned} XP
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    )
  }

  if (activeTab === 'history') {
    return (
      <div className="tab-panel" role="tabpanel">
        <div className="section-heading">
          <p className="eyebrow">Recent Activity</p>
          <h2>City quest history</h2>
        </div>
        {loading ? (
          <p className="status-message">Loading history...</p>
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
          <p className="status-message">No recent challenge history yet.</p>
        )}
      </div>
    )
  }

  return <BadgeTab loading={loading} badgeItems={badgeItems} />
}

type BadgeTabProps = {
  loading: boolean;
  badgeItems: Badge[];
};

function BadgeTab({ loading, badgeItems }: BadgeTabProps) {

  const sortedBadgeItems = useMemo(() => {
    const safe = Array.isArray(badgeItems) ? badgeItems : [];
    
    return [...safe].sort((a, b) => {
      if (a.earned !== b.earned) {
        return Number(b.earned) - Number(a.earned);
      }
      return Number(a.id) - Number(b.id);
    });

  }, [badgeItems]);

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
          {sortedBadgeItems.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <p className="status-message">No badges available yet.</p>
      )}
    </div>
  )  
}

function mapLiveProfileToUserProfile(profile: LiveProfile, avatarUrl: string): UserProfile {
  return {
    username: profile.name,
    xp_earned: profile.xp,
    level: profile.level,
    streak_count: profile.streak,
    badges: profile.badgeItems,
    challengesCompleted: profile.challengesCompleted,
    xpForCurrentLevel: profile.xpForCurrentLevel,
    xpForNextLevel: profile.xpForNextLevel,
    avatarUrl,
  }
}

export default ProfilePage
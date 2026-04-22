import { useState, useEffect } from 'react'
import BadgeCard from '../components/BadgeCard'
import BottomNav from '../components/BottomNav'
import ProfileHeader from '../components/ProfileHeader'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { historyItems } from '../data/profileData'
import type { Badge, TabKey, UserProfile } from '../types/profile'
import { useAuth } from '../context/useAuth'
import { useLogout } from "../hooks/useLogout"

const tabs: TabKey[] = ['badges', 'history']
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('badges')
  const { user, session } = useAuth()
  const logout = useLogout()
  const isLoggedIn = !!user

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const profileStats = profile
  ? [
      { label: 'Level', value: profile.level },
      { label: 'XP', value: profile.xp_earned },
      { label: 'Streak', value: profile.streak_count },
    ]
  : []

  useEffect(() => {
    const fetchProfile = async() => {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/profile-info`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`, // adjust to your auth
          },
        })
        const profileData = await res.json()
        setProfile(profileData.data);
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }

    if (session) fetchProfile()
  }, [session])

  if (loading || !profile) {
    return <p>Loading profile...</p>
  }
  
  function renderTabContent(activeTab: TabKey) {
    if (activeTab === 'history') {
      return (
        <div className="tab-panel" role="tabpanel">
          <div className="section-heading">
            <p className="eyebrow">Recent Activity</p>
            <h2>City quest history</h2>
          </div>
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
        </div>
      )
    }
  
    return (
      <div className="tab-panel" role="tabpanel">
        <div className="section-heading">
          <p className="eyebrow">Badge Vault</p>
          <h2>{profile?.badges?.length ?? 0} earned badges</h2>
        </div>
  
        <div className="badge-grid">
          {profile?.badges?.map((badge: Badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
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

        <ProfileHeader profile={profile} />

        <section className="stats-grid" aria-label="Profile stats">
          {profileStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </section>

        <section className="profile-content" aria-live="polite">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {renderTabContent(activeTab)}
        </section>

        {!isLoggedIn ? <p className="logout-message">You have been logged out.</p> : null}
      </div>
      <BottomNav />
    </main>
  )
}


export default ProfilePage

import { useState } from 'react'
import BadgeCard from '../components/BadgeCard'
import BottomNav from '../components/BottomNav'
import ProfileHeader from '../components/ProfileHeader'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { badges, historyItems, profileStats, userProfile } from '../data/profileData'
import type { TabKey } from '../types/profile'
import { useAuth } from '../context/useAuth'
import { useLogout } from "../hooks/useLogout"

const tabs: TabKey[] = ['badges', 'history']

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('badges')
  const { user } = useAuth()
  const logout = useLogout()
  const isLoggedIn = !!user

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

        <ProfileHeader profile={userProfile} />

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
        <h2>{userProfile.badges} earned badges</h2>
      </div>

      <div className="badge-grid">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  )
}

export default ProfilePage

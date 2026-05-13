import type { TabKey } from '../types/profile'

// Maps tab keys to their display labels
const tabLabels: Record<TabKey, string> = {
  badges: 'Badges',
  history: 'History',
  leaderboard: 'Leaderboard',
}

type TabsProps = {
  tabs: TabKey[]
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}

// Renders a tab bar for switching between profile sections.
// Applies an active class to the currently selected tab.
function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Profile sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={tab === activeTab ? 'tabs__button tabs__button--active' : 'tabs__button'}
          type="button"
          role="tab"
          aria-selected={tab === activeTab}
          onClick={() => onChange(tab)}
        >
          {tabLabels[tab]}
        </button>
      ))}
    </div>
  )
}

export default Tabs

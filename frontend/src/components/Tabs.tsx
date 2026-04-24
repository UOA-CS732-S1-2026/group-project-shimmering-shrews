import type { TabKey } from '../types/profile'

const tabLabels: Record<TabKey, string> = {
  badges: 'Badges',
  history: 'History',
}

type TabsProps = {
  tabs: TabKey[]
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}

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

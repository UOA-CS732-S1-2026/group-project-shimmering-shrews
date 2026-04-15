import type { Badge, HistoryItem, Stat, UserProfile } from '../types/profile'

export const userProfile: UserProfile = {
  name: 'John Doe',
  xp: 1280,
  level: 5,
  streak: 3,
  badges: 7,
  challengesCompleted: 12,
  xpForCurrentLevel: 1000,
  xpForNextLevel: 1500,
  avatarUrl: '/profile-placeholder.svg',
}

export const profileStats: Stat[] = [
  {
    label: 'Streak',
    value: `${userProfile.streak} 🔥`,
    helper: 'days in a row',
  },
  {
    label: 'Badges',
    value: userProfile.badges,
    helper: 'earned so far',
  },
  {
    label: 'Challenges',
    value: userProfile.challengesCompleted,
    helper: 'city quests done',
  },
]

export const badges: Badge[] = [
  {
    id: 1,
    name: 'Complete Tutorial',
    description: 'Finished the CityQuest starter route.',
    icon: 'T',
    earned: true,
  },
  {
    id: 2,
    name: 'Visited 5 Cafes',
    description: 'Checked in at five neighborhood cafes.',
    icon: 'C',
    earned: true,
  },
  {
    id: 3,
    name: 'Explored 3 Parks',
    description: 'Discovered three green spaces nearby.',
    icon: 'P',
    earned: true,
  },
  {
    id: 4,
    name: 'Museum Explorer',
    description: 'Visited a local museum exhibit.',
    icon: 'M',
    earned: true,
  },
  {
    id: 5,
    name: 'Street Art Scout',
    description: 'Found a public mural or art wall.',
    icon: 'A',
    earned: true,
  },
  {
    id: 6,
    name: 'Early Explorer',
    description: 'Checked in at a city stop before 9 AM.',
    icon: 'E',
    earned: true,
  },
  {
    id: 7,
    name: 'Market Wanderer',
    description: 'Explored a weekend market route.',
    icon: 'N',
    earned: true,
  },
  {
    id: 8,
    name: 'Bridge Walker',
    description: 'Cross three landmark bridges.',
    icon: 'B',
    earned: false,
  },
  {
    id: 9,
    name: 'Transit Rider',
    description: 'Complete quests using three transit lines.',
    icon: 'R',
    earned: false,
  },
  {
    id: 10,
    name: 'City Legend',
    description: 'Complete twenty city exploration quests.',
    icon: 'L',
    earned: false,
  },
]

export const historyItems: HistoryItem[] = [
  {
    id: 1,
    title: 'Museum Mile',
    detail: 'Checked in at the city history exhibit',
    xp: 140,
  },
  {
    id: 2,
    title: 'Cafe Crawl',
    detail: 'Visited two independent coffee spots',
    xp: 90,
  },
  {
    id: 3,
    title: 'Park Loop',
    detail: 'Completed a waterfront walking route',
    xp: 60,
  },
]

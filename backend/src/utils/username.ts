const EXPLORER_PREFIXES = [
  'City',
  'Metro',
  'Urban',
  'Harbor',
  'Laneway',
  'Skyline',
  'Civic',
  'Signal',
  'Hidden',
  'Trail',
  'Street',
  'Map',
  'Quest',
  'Neon',
  'Compass',
  'Beacon',
]

const EXPLORER_ROLES = [
  'Scout',
  'Ranger',
  'Seeker',
  'Explorer',
  'Pathfinder',
  'Wayfinder',
  'Navigator',
  'Nomad',
  'Wanderer',
  'Voyager',
  'Tracker',
  'Roamer',
  'Guide',
  'Strider',
  'Surveyor',
  'Adventurer',
]

const EXPLORATORY_USERNAME_PATTERN = /^[A-Z][a-z]+_[A-Z][a-z]+-\d{2}$/

const randomItem = (items: string[]) => {
  return items[Math.floor(Math.random() * items.length)]
}

const randomTwoDigitNumber = () => {
  return Math.floor(Math.random() * 100).toString().padStart(2, '0')
}

export const generateExploratoryUsername = () => {
  return `${randomItem(EXPLORER_PREFIXES)}_${randomItem(EXPLORER_ROLES)}-${randomTwoDigitNumber()}`
}

export const isExploratoryUsername = (username: string) => {
  return EXPLORATORY_USERNAME_PATTERN.test(username)
}

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

// Returns a random element from an array.
const randomItem = (items: string[]) => {
  return items[Math.floor(Math.random() * items.length)]
}

// Generates a random two-digit number as a padded string.
const randomTwoDigitNumber = () => {
  return Math.floor(Math.random() * 100).toString().padStart(2, '0')
}

// Generates a random exploratory username in the format Prefix_Role-##.
export const generateExploratoryUsername = () => {
  return `${randomItem(EXPLORER_PREFIXES)}_${randomItem(EXPLORER_ROLES)}-${randomTwoDigitNumber()}`
}

// Checks if a username matches the exploratory username pattern.
export const isExploratoryUsername = (username: string) => {
  return EXPLORATORY_USERNAME_PATTERN.test(username)
}

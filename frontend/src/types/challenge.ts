export type Challenge = {
  id: number
  name: string
  description: string | null
  xp_worth: number
  challenge_category: {
    id?: number
    name: string
    icon?: string | null
  }
  location: {
    id?: number
    name: string
    latitude?: number | string
    longitude?: number | string
  }
}

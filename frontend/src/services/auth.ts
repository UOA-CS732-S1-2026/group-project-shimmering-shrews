const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface GoogleProfile {
  email?: string
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
  sub?: string
}

export interface GoogleExchangeResult {
  profile: GoogleProfile
  backendConnected: boolean
  raw?: unknown
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return window.atob(padded)
}

export function decodeGoogleCredential(credential: string): GoogleProfile {
  const [, payload] = credential.split('.')

  if (!payload) {
    throw new Error('Google credential payload was missing.')
  }

  return JSON.parse(decodeBase64Url(payload)) as GoogleProfile
}

export async function exchangeGoogleCredential(
  credential: string,
): Promise<GoogleExchangeResult> {
  const profile = decodeGoogleCredential(credential)

  try {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
    })

    if (!response.ok) {
      throw new Error(`Backend auth failed with status ${response.status}.`)
    }

    const raw = (await response.json()) as unknown

    return {
      profile,
      backendConnected: true,
      raw,
    }
  } catch {
    return {
      profile,
      backendConnected: false,
    }
  }
}

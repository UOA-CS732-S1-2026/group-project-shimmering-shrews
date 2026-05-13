import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AuthCallback from './AuthCallback'
import { getSupabaseClient } from '../lib/supabase'
import { syncUser } from '../services/auth'

vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}))

vi.mock('../services/auth', () => ({
  syncUser: vi.fn(),
}))

const mockGetSupabaseClient = vi.mocked(getSupabaseClient)
const mockSyncUser = vi.mocked(syncUser)
const mockUnsubscribe = vi.fn()

function CurrentPath() {
  const location = useLocation()
  return <p>Current path: {location.pathname}</p>
}

function mockSupabaseSession(session: unknown, getSessionError?: Error) {
  mockGetSupabaseClient.mockReturnValue({
    auth: {
      getSession: vi.fn(() => {
        if (getSessionError) {
          return Promise.reject(getSessionError)
        }

        return Promise.resolve({ data: { session } })
      }),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      })),
    },
  } as unknown as ReturnType<typeof getSupabaseClient>)
}

function renderAuthCallback() {
  render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/challenges" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AuthCallback', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    sessionStorage.setItem('redirectAfterLogin', '/challenges')
    mockSyncUser.mockResolvedValue(undefined)
  })

  it('renders the callback loading UI', () => {
    mockSupabaseSession(null)

    renderAuthCallback()

    expect(screen.getByText('Signing you in...')).toBeInTheDocument()
  })

  it('syncs the user and navigates to the stored redirect after a mocked auth success', async () => {
    mockSupabaseSession({ access_token: 'mock-token', user: { id: 'user-1' } })

    renderAuthCallback()

    expect(await screen.findByText('Current path: /challenges')).toBeInTheDocument()
    expect(mockSyncUser).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('redirectAfterLogin')).toBeNull()
  })

  it('still navigates after sync failure and logs the sync error', async () => {
    mockSupabaseSession({ access_token: 'mock-token', user: { id: 'user-1' } })
    mockSyncUser.mockRejectedValue(new Error('Sync failed'))

    renderAuthCallback()

    expect(await screen.findByText('Current path: /challenges')).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to sync user after login:',
      expect.any(Error)
    )
  })

  it('keeps the fallback UI and logs when finishing the callback fails', async () => {
    mockSupabaseSession(null, new Error('Session lookup failed'))

    renderAuthCallback()

    expect(screen.getByText('Signing you in...')).toBeInTheDocument()
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to finish login callback:',
        expect.any(Error)
      )
    })
  })
})

// Auth callback tests use mocked Supabase/session responses only; real OAuth, tokens, and backend sync belong in integration tests.

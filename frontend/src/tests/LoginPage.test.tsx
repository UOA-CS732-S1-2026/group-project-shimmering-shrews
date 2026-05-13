import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from '../pages/LoginPage'
import { loginWithGoogle } from '../services/auth'

vi.mock('../services/auth', () => ({
  loginWithGoogle: vi.fn(),
}))

const mockLoginWithGoogle = vi.mocked(loginWithGoogle)

type Deferred<T> = {
  promise: Promise<T>
  reject: (reason?: unknown) => void
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve: Deferred<T>['resolve']
  let reject: Deferred<T>['reject']
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve: resolve!, reject: reject! }
}

describe('LoginPage Google auth flow', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.history.pushState({}, '', '/login')
  })

  it('renders the Google login button', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /sign in \/ create account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('calls the Google login service when the button is clicked', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined)

    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1)
    })
  })

  it('stores the expected post-login redirect target after a successful mocked login start', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined)
    window.history.pushState({}, '', '/login?from=/challenges')

    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    await waitFor(() => {
      expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/challenges')
    })
  })

  it('shows an error message when Google login fails', async () => {
    mockLoginWithGoogle.mockRejectedValue(new Error('OAuth unavailable'))

    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not start Google login. Please try again.'
    )
  })

  it('disables the Google login button while login is pending', async () => {
    const pendingLogin = createDeferred<void>()
    mockLoginWithGoogle.mockReturnValue(pendingLogin.promise)

    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    const loadingButton = await screen.findByRole('button', { name: /signing in/i })
    expect(loadingButton).toBeDisabled()

    pendingLogin.resolve(undefined)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue with google/i })).not.toBeDisabled()
    })
  })
})

// Frontend auth tests mock the OAuth service only; real Google OAuth, tokens, and backend sync belong in integration tests.

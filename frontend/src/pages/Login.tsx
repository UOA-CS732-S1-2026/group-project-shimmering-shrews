import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import '../App.css'
import { exchangeGoogleCredential } from '../services/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('Plan your next adventure and sign in to continue.')
  const [hasError, setHasError] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(true)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    let isMounted = true

    const mountGoogleButton = () => {
      if (!isMounted || !googleButtonRef.current || !window.google || !googleClientId) {
        return
      }

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            setHasError(true)
            setMessage('Google sign-in did not return a credential. Please try again.')
            return
          }

          setIsGoogleLoading(true)

          try {
            const result = await exchangeGoogleCredential(credential)
            const displayName =
              result.profile.given_name ||
              result.profile.name ||
              result.profile.email ||
              'traveler'

            setHasError(false)
            setMessage(
              result.backendConnected
                ? `Welcome back, ${displayName}. Your Google sign-in is connected.`
                : `Google sign-in worked for ${displayName}. Backend session setup is the next step.`,
            )
          } catch (error) {
            setHasError(true)
            setMessage(
              error instanceof Error
                ? error.message
                : 'Google sign-in failed. Please try again.',
            )
          } finally {
            setIsGoogleLoading(false)
          }
        },
        ux_mode: 'popup',
      })

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.min(googleButtonRef.current.clientWidth, 360),
        logo_alignment: 'left',
      })

      setIsGoogleReady(true)
      setIsGoogleLoading(false)
    }

    if (!googleClientId) {
      setIsGoogleLoading(false)
      setHasError(true)
      setMessage('Add VITE_GOOGLE_CLIENT_ID to your frontend environment to enable Google sign-in.')
      return () => {
        isMounted = false
      }
    }

    if (window.google) {
      mountGoogleButton()
      return () => {
        isMounted = false
      }
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      mountGoogleButton()
    }
    script.onerror = () => {
      if (!isMounted) {
        return
      }

      setIsGoogleLoading(false)
      setHasError(true)
      setMessage('Google Identity Services could not load. Check your network and try again.')
    }

    document.head.appendChild(script)

    return () => {
      isMounted = false
    }
  }, [googleClientId])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setHasError(true)
      setMessage('Enter both username and password to continue your journey.')
      return
    }

    setHasError(false)
    setMessage('Password sign-in is still a UI stub. Google sign-in is ready to test.')
  }

  return (
    <div className="login-shell">
      <div className="travel-orb travel-orb-one" />
      <div className="travel-orb travel-orb-two" />
      <div className="travel-route" />

      <main className="phone-stage">
        <section className="phone-frame" aria-label="CityQuest sign in">
          <div className="hero-map" />

          <header className="login-hero">
            <div className="brand-mark" aria-hidden="true">
              CQ
            </div>
            <p className="eyebrow">Roam. Discover. Belong.</p>
            <h1>CityQuest</h1>
            <p className="subcopy">
              Sign in to unlock walking trails, local challenges, and hidden stories
              around the city.
            </p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Username</span>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <div className="helper-row">
              <span className="helper-chip">Travel mode enabled</span>
              <button className="text-link" type="button">
                Forgot password
              </button>
            </div>

            <div className="social-stack">
              <button className="social-button facebook" type="button">
                <span className="social-icon" aria-hidden="true">
                  f
                </span>
                <span>Sign in with Facebook</span>
              </button>

              <div className="google-signin-card">
                <div className="google-card-header">
                  <span className="social-icon google-chip" aria-hidden="true">
                    G
                  </span>
                  <div>
                    <p className="google-card-title">Continue with Google</p>
                    <p className="google-card-copy">
                      Use the official Google button for secure sign-in.
                    </p>
                  </div>
                </div>

                <div className="google-button-slot" ref={googleButtonRef} />

                {isGoogleLoading ? (
                  <p className="google-status">Preparing Google sign-in...</p>
                ) : null}

                {!isGoogleReady && googleClientId ? (
                  <p className="google-status">Google sign-in is unavailable right now.</p>
                ) : null}
              </div>

              <button className="social-button apple" type="button">
                <span className="social-icon" aria-hidden="true">
                  A
                </span>
                <span>Sign in with Apple</span>
              </button>
            </div>

            <div className="divider">or continue</div>

            <button className="primary-action" type="submit">
              Sign In
            </button>
            <button className="secondary-action" type="button">
              Forgot Password
            </button>
            <button className="outline-action" type="button">
              Create Account
            </button>

            <p className={`feedback${hasError ? ' is-error' : ''}`}>{message}</p>
          </form>

          <div className="journey-strip" aria-hidden="true">
            <span className="journey-chip">Sunrise routes</span>
            <span className="journey-chip">Hidden laneways</span>
            <span className="journey-chip">Night markets</span>
          </div>
        </section>
      </main>
    </div>
  )
}

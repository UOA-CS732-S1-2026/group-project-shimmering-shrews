import { loginWithGoogle } from "../services/auth"

const LoginPage = () => {
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (err) {
      console.error("Login failed:", err)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Sign In / Create Account</h1>
        <p>Sign in with Google</p>

        <button onClick={handleGoogleLogin} style={styles.button}>
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default LoginPage

const styles: Record<string, React.CSSProperties> = {}
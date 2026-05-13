/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly VITE_E2E_AUTH?: string
  readonly VITE_GEOAPIFY_KEY?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface GoogleCredentialResponse {
  credential?: string
  select_by?: string
}

interface GoogleIdConfiguration {
  callback: (response: GoogleCredentialResponse) => void
  client_id: string
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  ux_mode?: 'popup' | 'redirect'
}

interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?:
    | 'signin_with'
    | 'signup_with'
    | 'continue_with'
    | 'signin'
  shape?: 'pill' | 'rectangular' | 'circle' | 'square'
  width?: number
  logo_alignment?: 'left' | 'center'
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void
  prompt: () => void
  renderButton: (
    parent: HTMLElement,
    options: GoogleButtonConfiguration,
  ) => void
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId
    }
  }
}

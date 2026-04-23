const MAX_USERNAME_LENGTH = 50
const FALLBACK_USERNAME = 'user'

const sanitizeUsernamePart = (value: string) => {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')

  return sanitized || FALLBACK_USERNAME
}

export const buildUsernameFromAuth = (email: string, authId: string) => {
  const emailPrefix = email.split('@')[0] ?? ''
  const base = sanitizeUsernamePart(emailPrefix)
  const suffix = authId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase() || 'acct'
  const separator = '-'
  const maxBaseLength = MAX_USERNAME_LENGTH - suffix.length - separator.length
  const trimmedBase = base.slice(0, Math.max(1, maxBaseLength))

  return `${trimmedBase}${separator}${suffix}`
}

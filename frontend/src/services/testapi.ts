export const getTestDb = async () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  const res = await fetch(`${BACKEND_URL}/test-db`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}
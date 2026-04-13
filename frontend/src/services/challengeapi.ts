export const getChallenges = async () => {
  const res = await fetch('http://localhost:5000/challenges')
  if (!res.ok) throw new Error('API error')
  const json = await res.json()
  return json.data
}
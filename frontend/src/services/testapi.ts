export const getTestDb = async () => {
    const res = await fetch('http://localhost:5000/test-db')
    if (!res.ok) throw new Error('API error')
    return res.json()
  }
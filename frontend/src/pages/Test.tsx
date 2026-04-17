import { useState, useEffect } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import '../App.css'
import { getTestDb } from '../services/testapi'

export default function Test() {
    const [data, setData] = useState<unknown>(null)
    const [count, setCount] = useState(0)
    useEffect(() => {
      getTestDb().then(setData)
    }, [])

  return (
    <>
      <section id="center">
  <div className="hero">
    <img src={heroImg} className="base" width="170" height="179" alt="" />
    <img src={reactLogo} className="framework" alt="React logo" />
    <img src={viteLogo} className="vite" alt="Vite logo" />
  </div>

  <div>
    <h1>Get started</h1>
    <p>
      Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
    </p>
  </div>

  <button
    className="counter"
    onClick={() => setCount((count) => count + 1)}
  >
    Count is {count}
  </button>

  
  <div style={{ marginTop: '2rem', width: '100%' }}>
    <h2>Backend Response</h2>

    {data ? (
      <pre
        style={{
          textAlign: 'left',
          background: '#111',
          padding: '1rem',
          borderRadius: '8px',
          overflowX: 'auto',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    ) : (
      <p>Loading...</p>
    )}
  </div>
</section>
    </>
  )
}

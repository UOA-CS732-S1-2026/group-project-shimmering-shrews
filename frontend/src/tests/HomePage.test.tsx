import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import HomePage from '../pages/HomePage'

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    loading: false,
    logout: vi.fn(),
    session: null,
    user: null,
  }),
}))

describe('HomePage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the main homepage content', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(screen.getAllByText('CityQuest')).not.toHaveLength(0)
    expect(screen.getByText(/GPS-based adventure game/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Discover' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Complete Quests' })).not.toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Earn Rewards' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /start your adventure/i })).toHaveLength(2)
  })
})

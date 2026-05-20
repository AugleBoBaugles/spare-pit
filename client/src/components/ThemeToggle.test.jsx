import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders the flashlight icon', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
    expect(screen.getByTestId('flashlight-off')).toBeInTheDocument()
  })

  it('applies data-theme="dark" when clicked from light mode', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('removes dark theme on second click', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })

  it('shows flashlight-off in light mode and flashlight-on in dark mode', () => {
    render(<ThemeToggle />)
    expect(screen.getByTestId('flashlight-off')).toBeInTheDocument()
    expect(screen.queryByTestId('flashlight-on')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('flashlight-on')).toBeInTheDocument()
    expect(screen.queryByTestId('flashlight-off')).not.toBeInTheDocument()
  })
})

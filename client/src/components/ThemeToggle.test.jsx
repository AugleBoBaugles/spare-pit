import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ThemeToggle from './ThemeToggle'

function mockMatchMedia(prefersDark) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: prefersDark && query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

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

  it('switches back to light mode on second click', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('shows flashlight-off in light mode and flashlight-on in dark mode', () => {
    render(<ThemeToggle />)
    expect(screen.getByTestId('flashlight-off')).toBeInTheDocument()
    expect(screen.queryByTestId('flashlight-on')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('flashlight-on')).toBeInTheDocument()
    expect(screen.queryByTestId('flashlight-off')).not.toBeInTheDocument()
  })

  it('initializes to dark mode when prefers-color-scheme is dark', () => {
    mockMatchMedia(true)
    render(<ThemeToggle />)
    expect(screen.getByTestId('flashlight-on')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
  })
})

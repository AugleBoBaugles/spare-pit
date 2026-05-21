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
    expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument()
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

  it('shows both icons always and reflects mode via button class', () => {
    render(<ThemeToggle />)
    expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument()
    expect(screen.getByTestId('light-mode-icon')).toBeInTheDocument()
    expect(screen.getByRole('button')).not.toHaveClass('theme-toggle--dark')

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveClass('theme-toggle--dark')
  })

  it('initializes to dark mode when prefers-color-scheme is dark', () => {
    mockMatchMedia(true)
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toHaveClass('theme-toggle--dark')
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
  })
})

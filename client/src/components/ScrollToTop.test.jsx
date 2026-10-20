import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ScrollToTop from './ScrollToTop'

function mockMatchMedia(reduceMotion) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: reduceMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
    })),
  })
}

function scrollWindowTo(y) {
  act(() => {
    window.scrollY = y
    fireEvent.scroll(window)
  })
}

describe('ScrollToTop', () => {
  beforeEach(() => {
    mockMatchMedia(false)
    window.innerHeight = 800
    window.scrollY = 0
    window.scrollTo = vi.fn()
  })

  it('is hidden near the top of the page', () => {
    render(<ScrollToTop />)
    expect(screen.queryByRole('button', { name: /scroll to top/i })).not.toBeInTheDocument()
  })

  it('appears after scrolling past one screen height', () => {
    render(<ScrollToTop />)
    scrollWindowTo(1200)
    expect(screen.getByRole('button', { name: /scroll to top/i })).toBeInTheDocument()
  })

  it('hides again when scrolled back up', () => {
    render(<ScrollToTop />)
    scrollWindowTo(1200)
    scrollWindowTo(100)
    expect(screen.queryByRole('button', { name: /scroll to top/i })).not.toBeInTheDocument()
  })

  it('smooth-scrolls to the top when clicked', () => {
    render(<ScrollToTop />)
    scrollWindowTo(1200)
    fireEvent.click(screen.getByRole('button', { name: /scroll to top/i }))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('jumps instantly when the user prefers reduced motion', () => {
    mockMatchMedia(true)
    render(<ScrollToTop />)
    scrollWindowTo(1200)
    fireEvent.click(screen.getByRole('button', { name: /scroll to top/i }))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })
})

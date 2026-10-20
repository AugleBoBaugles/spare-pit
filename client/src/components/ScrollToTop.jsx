import { useState, useEffect } from 'react'
import '../styles/ScrollToTop.css'

function ArrowUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7"/>
      <path d="M12 19V5"/>
    </svg>
  )
}

// Shows once the user has scrolled more than one viewport height down the page.
export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > window.innerHeight)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleClick() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={handleClick}
      className="scroll-to-top"
      aria-label="Scroll to top"
    >
      <ArrowUpIcon />
    </button>
  )
}

import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import './TradeNavbar.css'

const links = [
  { to: '/trade', label: 'Home', exact: true },
  { to: '/trade/about-us', label: 'About' },
  { to: '/trade/trade-export', label: 'Export' },
  { to: '/trade/trade-procedures', label: 'Procedures' },
  { to: '/trade/contact-us', label: 'Contact' },
]

export default function TradeNavbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    const updateNavbar = () => setScrolled(window.scrollY > 28)
    updateNavbar()
    window.addEventListener('scroll', updateNavbar, { passive: true })
    return () => window.removeEventListener('scroll', updateNavbar)
  }, [])

  const isActive = ({ to, exact }) => exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <header className={`trade-navbar ${location.pathname === '/trade' ? 'trade-navbar--home' : 'trade-navbar--inner'} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="shell trade-nav-inner">
        <Link to="/trade" className="trade-brand" aria-label="Grand Store Trade home">
          <img src="/logo.png" alt="The Grand Store" />
        </Link>

        <nav className={`trade-nav-center ${menuOpen ? 'is-open' : ''}`} aria-label="Trade navigation">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={`trade-nav-link ${isActive(link) ? 'active' : ''}`}>
              {link.label}
            </Link>
          ))}
          <Link to="/trade/partner-enquiry" className="trade-partner-btn trade-mobile-enquiry">
            Partner with us <ArrowUpRight size={16} />
          </Link>
        </nav>

        <Link to="/trade/partner-enquiry" className="trade-partner-btn trade-desktop-enquiry">
          Partner with us <ArrowUpRight size={16} />
        </Link>

        <button
          type="button"
          className="trade-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close trade navigation' : 'Open trade navigation'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  )
}

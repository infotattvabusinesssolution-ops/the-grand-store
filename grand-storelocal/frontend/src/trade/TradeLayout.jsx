import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TradeNavbar from './TradeNavbar'
import './TradePortal.css'

export default function TradeLayout() {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="trade-portal">
      <TradeNavbar />
      {/* Outlet renders the matched child route, e.g., TradePage or TradeAbout */}
      <Outlet />
    </div>
  )
}

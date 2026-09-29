import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Truck,
  MapPin,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Package,
  Printer,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  calculateLiveRates,
  searchPostalCodes,
  submitWaybill,
  getWaybillTracking,
  POPULAR_SA_SUBURBS,
} from '../services/aramexService'

export default function ShippingAndCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}) {
  const [suburbSearch, setSuburbSearch] = useState('Sandton')
  const [selectedDestination, setSelectedDestination] = useState(POPULAR_SA_SUBURBS[0])
  const [isSearchingSuburbs, setIsSearchingSuburbs] = useState(false)
  const [suburbOptions, setSuburbOptions] = useState(POPULAR_SA_SUBURBS)

  const [loadingRates, setLoadingRates] = useState(false)
  const [rateResult, setRateResult] = useState(null)
  const [selectedService, setSelectedService] = useState('ONP') // 'ONP' or 'PEC'

  // Order Fulfillment & Tracking Modal State
  const [isFulfilling, setIsFulfilling] = useState(false)
  const [fulfilledOrder, setFulfilledOrder] = useState(null)
  const [trackingData, setTrackingData] = useState(null)
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [activeTab, setActiveTab] = useState('cart') // 'cart', 'fulfillment', 'tracking'
  const [customWaybillInput, setCustomWaybillInput] = useState('')

  // Calculate live rates whenever cartItems or selectedDestination changes
  useEffect(() => {
    if (cartItems.length > 0 && selectedDestination) {
      fetchRates()
    } else {
      setRateResult(null)
    }
  }, [cartItems, selectedDestination])

  const fetchRates = async () => {
    setLoadingRates(true)
    try {
      const res = await calculateLiveRates({
        destination: selectedDestination,
        cartItems,
      })
      setRateResult(res)
    } catch (e) {
      console.error('Rate calculation error:', e)
    } finally {
      setLoadingRates(false)
    }
  }

  const handleSuburbSearchChange = async (e) => {
    const val = e.target.value
    setSuburbSearch(val)
    setIsSearchingSuburbs(true)
    const results = await searchPostalCodes(val)
    setSuburbOptions(results)
    setIsSearchingSuburbs(false)
  }

  const handleSelectSuburb = (item) => {
    setSelectedDestination(item)
    setSuburbSearch(`${item.suburb}, ${item.postal_code}`)
  }

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const p = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
    return sum + p * (item.qty || 1)
  }, 0)

  const activeRateObj = rateResult?.rates?.find((r) => r.service_type === selectedService)
  const shippingFee = activeRateObj ? activeRateObj.rate : 0
  const finalTotal = subtotal + shippingFee

  // Generate Waybill (SubmitWaybill V4)
  const handleFulfillOrder = async () => {
    setIsFulfilling(true)
    try {
      const orderId = `GS-${Math.floor(100000 + Math.random() * 900000)}`
      const waybillRes = await submitWaybill({
        orderId,
        customer: {
          name: 'Jan Van Der Merwe',
          mobile: '+27 82 123 4567',
          suburb: selectedDestination.suburb,
          postal_code: selectedDestination.postal_code,
        },
        cartItems,
        serviceType: selectedService,
      })

      setFulfilledOrder(waybillRes)
      setActiveTab('fulfillment')
    } catch (err) {
      console.error('Fulfillment error:', err)
    } finally {
      setIsFulfilling(false)
    }
  }

  // Load Tracking Details
  const handleTrackWaybill = async (wbNumber) => {
    setLoadingTracking(true)
    setActiveTab('tracking')
    try {
      const data = await getWaybillTracking(wbNumber)
      setTrackingData(data)
    } catch (err) {
      console.error('Tracking fetch error:', err)
    } finally {
      setLoadingTracking(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="shipping-drawer-overlay">
      <div className="shipping-drawer-backdrop" onClick={onClose} />
      <div className="shipping-drawer-panel">
        {/* Drawer Header */}
        <div className="shipping-drawer-header">
          <div className="drawer-header-title">
            <ShoppingBag size={20} className="text-gold" />
            <h3>
              {activeTab === 'cart' && `Your Bag (${cartItems.reduce((s, i) => s + (i.qty || 1), 0)})`}
              {activeTab === 'fulfillment' && 'Order Dispatched (Waybill Created)'}
              {activeTab === 'tracking' && 'Aramex Track & Trace'}
            </h3>
          </div>
          <div className="drawer-header-actions">
            {activeTab !== 'cart' && (
              <button
                type="button"
                className="drawer-pill-button"
                onClick={() => setActiveTab('cart')}
              >
                Back to Bag
              </button>
            )}
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="shipping-drawer-body">
          {activeTab === 'cart' && (
            <>
              {/* Empty Bag State */}
              {cartItems.length === 0 ? (
                <div className="drawer-empty-state">
                  <div className="empty-icon-wrap">
                    <ShoppingBag size={48} />
                  </div>
                  <h4>Your bag is currently empty</h4>
                  <p>Explore our single malt whiskies, estate tequilas, and rare cognacs.</p>
                  <button type="button" className="drawer-action-btn" onClick={onClose}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Item List */}
                  <div className="cart-items-section">
                    <h4 className="section-label">Selected Bottles</h4>
                    <div className="cart-items-list">
                      {cartItems.map((item) => {
                        const priceNum = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
                        return (
                          <div key={item.id} className="cart-item-row">
                            <div className="cart-item-img">
                              <img src={item.image} alt={item.name} />
                            </div>
                            <div className="cart-item-info">
                              <div className="cart-item-top">
                                <h5>{item.name}</h5>
                                <span className="item-price">R{(priceNum * (item.qty || 1)).toLocaleString()}</span>
                              </div>
                              <p className="item-meta">
                                {item.size} • {item.shipping?.weight_kg || 1.45} kg
                              </p>
                              <div className="cart-item-controls">
                                <div className="qty-selector">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQty(item.id, (item.qty || 1) - 1)}
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span>{item.qty || 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQty(item.id, (item.qty || 1) + 1)}
                                    aria-label="Increase quantity"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="remove-btn"
                                  onClick={() => onRemoveItem(item.id)}
                                  title="Remove item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Aramex Live Shipping Rate Calculator */}
                  <div className="aramex-shipping-box">
                    <div className="shipping-box-header">
                      <div className="shipping-title-group">
                        <Truck size={18} className="text-gold" />
                        <h4>Aramex Live Rate Calculator</h4>
                      </div>
                      <span className="aramex-badge">Official South Africa API</span>
                    </div>

                    {/* Suburb Autocomplete Input */}
                    <div className="suburb-input-container">
                      <label>Delivery Suburb & Postal Code</label>
                      <div className="input-with-icon">
                        <MapPin size={16} />
                        <input
                          type="text"
                          value={suburbSearch}
                          onChange={handleSuburbSearchChange}
                          placeholder="e.g. Sandton, Rosebank, Camps Bay..."
                        />
                      </div>

                      {/* Quick Metro Chips */}
                      <div className="metro-chips-scroll">
                        {POPULAR_SA_SUBURBS.slice(0, 5).map((m) => (
                          <button
                            key={m.suburb}
                            type="button"
                            className={`metro-chip ${
                              selectedDestination.suburb === m.suburb ? 'active' : ''
                            }`}
                            onClick={() => handleSelectSuburb(m)}
                          >
                            {m.suburb}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Telemetry info */}
                    {rateResult && (
                      <div className="telemetry-banner">
                        <Package size={14} />
                        <span>
                          Chargeable Volumetric Weight: <strong>{rateResult.chargeable_weight} kg</strong> (Actual: {rateResult.actual_weight} kg)
                        </span>
                      </div>
                    )}

                    {/* Shipping Tier Selection */}
                    <div className="shipping-tier-cards">
                      {loadingRates ? (
                        <div className="shipping-loading">
                          <RefreshCw size={20} className="spin" />
                          <span>Calculating live rates via Aramex...</span>
                        </div>
                      ) : (
                        rateResult?.rates?.map((tier) => (
                          <label
                            key={tier.service_type}
                            className={`shipping-tier-card ${
                              selectedService === tier.service_type ? 'selected' : ''
                            }`}
                          >
                            <div className="tier-radio">
                              <input
                                type="radio"
                                name="service_tier"
                                checked={selectedService === tier.service_type}
                                onChange={() => setSelectedService(tier.service_type)}
                              />
                            </div>
                            <div className="tier-details">
                              <div className="tier-header-row">
                                <span className="tier-name">{tier.service_name}</span>
                                <span className="tier-badge">{tier.badge}</span>
                              </div>
                              <p className="tier-desc">{tier.description}</p>
                              <div className="tier-delivery-row">
                                <Calendar size={13} />
                                <span>Est. Arrival: <strong>{tier.expected_delivery_date}</strong></span>
                              </div>
                            </div>
                            <div className="tier-price">
                              <strong>R{tier.rate.toFixed(2)}</strong>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Order Summary & Totals */}
                  <div className="drawer-summary-card">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>R{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Aramex Shipping ({selectedService === 'ONP' ? 'Overnight' : 'Economy'})</span>
                      <span>R{shippingFee.toFixed(2)}</span>
                    </div>
                    {activeRateObj && (
                      <div className="summary-row text-muted text-xs">
                        <span>Included Fuel Surcharge & VAT (15%)</span>
                        <span>R{(activeRateObj.fuel_surcharge + activeRateObj.tax).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="summary-divider" />
                    <div className="summary-row total-row">
                      <strong>Total (ZAR)</strong>
                      <strong className="text-gold">R{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <button
                      type="button"
                      className="drawer-checkout-btn"
                      onClick={handleFulfillOrder}
                      disabled={isFulfilling}
                    >
                      {isFulfilling ? (
                        <>
                          <RefreshCw size={18} className="spin" />
                          <span>Generating Aramex Waybill...</span>
                        </>
                      ) : (
                        <>
                          <span>Dispatch & Print Label</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                    <p className="checkout-guarantee">
                      <ShieldCheck size={14} /> Full Transit Insurance Covered up to R3,000.00
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {/* Fulfillment & Waybill Confirmation Tab */}
          {activeTab === 'fulfillment' && fulfilledOrder && (
            <div className="fulfillment-view">
              <div className="success-banner">
                <CheckCircle2 size={44} className="text-green" />
                <h4>Waybill Successfully Generated</h4>
                <p>Shipment is recorded with Aramex South Africa Hub.</p>
              </div>

              <div className="waybill-details-card">
                <div className="wb-row">
                  <span className="label">Order Reference:</span>
                  <span className="val">{fulfilledOrder.order_id}</span>
                </div>
                <div className="wb-row">
                  <span className="label">Aramex Waybill No:</span>
                  <span className="val highlight">{fulfilledOrder.waybill_number}</span>
                </div>
                <div className="wb-row">
                  <span className="label">Service Speed:</span>
                  <span className="val">
                    {fulfilledOrder.service_type === 'ONP' ? 'Overnight Express (ONP)' : 'Economy Road (PEC)'}
                  </span>
                </div>
                <div className="wb-row">
                  <span className="label">Print Template:</span>
                  <span className="val">{fulfilledOrder.print_template}</span>
                </div>

                {/* Printable Label Mockup */}
                <div className="thermal-label-preview">
                  <div className="label-header">
                    <span className="brand-tag">ARAMEX SOUTH AFRICA</span>
                    <span className="tier-tag">{fulfilledOrder.service_type}</span>
                  </div>
                  <div className="label-barcode">
                    <div className="barcode-bars" />
                    <span className="barcode-num">*{fulfilledOrder.waybill_number}*</span>
                  </div>
                  <div className="label-addresses">
                    <p><strong>FROM:</strong> GrandStore Sandton Central, Johannesburg</p>
                    <p><strong>TO:</strong> {selectedDestination.suburb}, {selectedDestination.postal_code}, ZA</p>
                  </div>
                </div>

                <div className="label-actions">
                  <a
                    href={fulfilledOrder.label_print_url}
                    target="_blank"
                    rel="noreferrer"
                    className="label-download-btn"
                  >
                    <Printer size={16} />
                    <span>Print 4" x 6" Label</span>
                  </a>
                  <button
                    type="button"
                    className="track-shipment-btn"
                    onClick={() => handleTrackWaybill(fulfilledOrder.waybill_number)}
                  >
                    <Truck size={16} />
                    <span>Live Track & Trace</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Track & Trace Tab */}
          {activeTab === 'tracking' && (
            <div className="tracking-view">
              <div className="tracking-search-bar">
                <input
                  type="text"
                  placeholder="Enter 11-digit Waybill Number..."
                  value={customWaybillInput || trackingData?.waybill_number || ''}
                  onChange={(e) => setCustomWaybillInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleTrackWaybill(customWaybillInput || '31298456123')}
                >
                  <Search size={16} />
                </button>
              </div>

              {loadingTracking ? (
                <div className="tracking-loading">
                  <RefreshCw size={24} className="spin" />
                  <span>Fetching live milestone events...</span>
                </div>
              ) : trackingData ? (
                <div className="tracking-result-card">
                  <div className="tracking-status-header">
                    <div>
                      <span className="status-label">Current Status</span>
                      <h4 className="status-val">{trackingData.current_status}</h4>
                    </div>
                    <span className="waybill-tag">#{trackingData.waybill_number}</span>
                  </div>

                  <div className="route-tags">
                    <span>{trackingData.origin}</span>
                    <ArrowRight size={14} />
                    <span>{trackingData.destination}</span>
                  </div>

                  {/* Milestone Stepper */}
                  <div className="milestones-timeline">
                    {trackingData.tracking_information.map((evt, idx) => (
                      <div key={idx} className="timeline-item completed">
                        <div className="timeline-marker">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-time">{evt.action_date}</div>
                          <div className="timeline-title">{evt.customer_description}</div>
                          <div className="timeline-loc">{evt.location}, {evt.update_country}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

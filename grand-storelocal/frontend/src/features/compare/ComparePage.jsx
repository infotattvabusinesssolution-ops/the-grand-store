import { useProducts } from '../../context/ProductContext'
import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShoppingBag, ArrowRight, ArrowLeft, Minus, Plus, Trash2, Heart, ZoomIn, CheckCircle2, Truck, RotateCcw, ShieldCheck, Mail, MessageCircle, Share2, X, Gift, SlidersHorizontal, Grid3X3, GitCompareArrows, MapPin, Calendar, Clock, CreditCard, Droplets } from 'lucide-react';
import { brandyBrands, brands, menuCategories, tequilaBrands } from '../../data';
import { useWishlist } from '../../wishlistContext';
import ProductCard from '../../components/ProductCard';

export default function ComparePage({ compareItems, onCompare, onRemove, onClear, onAdd }) {
  const { products } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Compare Bottles — The Grand Store'
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => { document.title = 'The Grand Store — Luxury Wines & Spirits' }
  }, [])

  const suggestions = products.filter((product) => !compareItems.some((item) => item.id === product.id)).slice(0, 3)
  const rows = [
    ['Category', (product) => product.category],
    ['Brand', (product) => product.brand],
    ['Origin', (product) => product.origin],
    ['Bottle size', (product) => product.size],
    ['Case', (product) => product.options?.[0] || 'Single bottle'],
    ['Style', (product) => product.details?.style || product.category],
    ['Price', (product) => product.price],
  ]

  return (
    <main className="compare-page">
      <section className="compare-hero">
        <div className="shell compare-hero-inner">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-ivory-muted)] hover:text-white mb-6 transition-colors uppercase tracking-widest text-xs font-bold">
              <ArrowLeft size={16} /> Back
            </button>
            <p className="eyebrow">Bottle by bottle</p>
            <h1>Compare the collection.</h1>
          </div>
          <p>Place provenance, style and price side by side before choosing the bottle for your cabinet.</p>
        </div>
      </section>

      <section className="compare-section section">
        <div className="shell">
          {compareItems.length ? (
            <>
              <div className="compare-toolbar">
                <p><strong>{compareItems.length}</strong> of 4 bottles selected</p>
                <div>
                  <Link className="text-link arrow-link" to="/shop">Add another bottle <Plus size={16} /></Link>
                  <button type="button" onClick={onClear}>Clear comparison</button>
                </div>
              </div>

              <div className="compare-table-wrap">
                <table className="compare-table">
                  <caption className="sr-only">Selected bottles comparison</caption>
                  <tbody>
                    <tr className="compare-product-row">
                      <th scope="row">Bottle</th>
                      {compareItems.map((product) => (
                        <td key={product.id}>
                          <div className="compare-product-head">
                            <button type="button" onClick={() => onRemove(product)} aria-label={`Remove ${product.name} from comparison`}><Trash2 size={17} /></button>
                            <Link to={`/product/${product.slug || product.id || product._id}`}>
                              <img 
                                src={product.image} 
                                alt={product.fullName || product.name}
                                style={{ maxHeight: '180px', width: 'auto', margin: '0 auto', objectFit: 'contain' }}
                              />
                            </Link>
                            <p style={{ marginTop: '16px' }}>{product.brand}</p>
                            <h2><Link to={`/product/${product.slug || product.id || product._id}`}>{product.fullName || product.name}</Link></h2>
                          </div>
                        </td>
                      ))}
                    </tr>
                    {rows.map(([label, getValue]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        {compareItems.map((product) => <td className={label === 'Price' ? 'compare-price' : ''} key={product.id}>{getValue(product)}</td>)}
                      </tr>
                    ))}
                    <tr className="compare-action-row">
                      <th scope="row">Action</th>
                      {compareItems.map((product) => (
                        <td key={product.id}>
                          <button className="compare-add-button" type="button" onClick={() => onAdd(product)}>Add to bag <ShoppingBag size={17} /></button>
                          <Link to={`/product/${product.slug || product.id || product._id}`}>View bottle <ArrowRight size={15} /></Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="compare-empty">
              <span><GitCompareArrows size={31} /></span>
              <p className="eyebrow">Your shortlist is empty</p>
              <h2>Choose bottles worth considering.</h2>
              <p>Add up to four bottles and we will place every important detail side by side.</p>
              <Link className="button button-gold" to="/shop">Explore the cellar <ArrowRight size={17} /></Link>
            </div>
          )}

          {compareItems.length < 4 && (
            <div className="compare-suggestions">
              <div className="compare-suggestion-heading">
                <p className="eyebrow">Complete the shortlist</p>
                <h2>{compareItems.length ? 'Add another perspective.' : 'Begin with a cellar favourite.'}</h2>
              </div>
              <div className="compare-suggestion-grid">
                {suggestions.map((product) => (
                  <article key={product.id}>
                    <img 
                      src={product.image} 
                      alt={product.name}
                      style={{ maxHeight: '140px', width: 'auto', margin: '0 auto', objectFit: 'contain' }}
                    />
                    <div><p>{product.brand}</p><h3>{product.name}</h3><strong>{product.price}</strong></div>
                    <button type="button" onClick={() => onCompare(product)} aria-label={`Compare ${product.name}`}><Plus size={18} /></button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
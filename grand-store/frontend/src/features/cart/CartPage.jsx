import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { getProductPrice } from '../../data';
import { useAuth } from '../../context/AuthContext';
import Price from '../../components/ui/Price';

export default function CartPage({ cartItems, onUpdateQuantity, onRemove, onClear, onNotify }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutClick = (e) => {
    e.preventDefault();
    if (user) {
      const nonCustomerRoles = ['admin', 'super_admin', 'accountant', 'product_manager'];
      if (user.role && (user.role.startsWith('vendor') || nonCustomerRoles.includes(user.role))) {
        onNotify("Vendors and admins cannot checkout. Please login as a customer to buy.");
        navigate('/register');
        return;
      }
    }
    navigate('/customer/checkout');
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (getProductPrice(item.price) * item.quantity), 0);

  const groupedCart = cartItems.reduce((acc, item) => {
    const vId = item.storeId || item.vendorId || 'grand-store';
    const vName = item.storeName || item.vendor?.name || 'The Grand Store';
    if (!acc[vId]) {
      acc[vId] = { vendorId: vId, vendorName: vName, items: [], subtotal: 0, count: 0 };
    }
    acc[vId].items.push(item);
    acc[vId].subtotal += (getProductPrice(item.price) * item.quantity);
    acc[vId].count += item.quantity;
    return acc;
  }, {});
  
  const vendorGroups = Object.values(groupedCart);

  useEffect(() => {
    document.title = 'Shopping Cart – Review Items and Complete Your Purchase at The Grand Store'
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => { document.title = 'The Grand Store — Luxury Wines & Spirits' }
  }, [])

  return (
    <main className="cart-page">
      <section className="cart-hero">
        <div className="shell cart-hero-inner">
          <div className="cart-hero-copy">
            <div className="cart-breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} /><span>My Cart</span></div>
            <p className="eyebrow">Your private selection</p>
            <h1>Your Cart</h1>
            <p className="cart-hero-description">Review your bottles and complete each shipment through our secure checkout.</p>
          </div>
          <div className="cart-hero-count">
            <strong>{String(itemCount).padStart(2, '0')}</strong>
            <span>{itemCount === 1 ? 'Item selected' : 'Items selected'}</span>
          </div>
        </div>
      </section>

      {cartItems.length === 0 ? (
        <section className="cart-empty-section">
          <div className="cart-empty">
            <span className="cart-empty-icon"><ShoppingBag size={32} /></span>
            <p className="eyebrow">Your selection awaits</p>
            <h2>Your Cart is empty.</h2>
            <p>Explore our cellar and choose a bottle worthy of the occasion.</p>
            <Link className="button button-gold" to="/shop">Add Products <ArrowRight size={16} /></Link>
          </div>
        </section>
      ) : (
        <section className="cart-content-section">
          <div className="shell cart-layout">
            <div className="cart-items-panel">
              {vendorGroups.map((group, index) => (
                <div className="cart-vendor-group" key={group.vendorId}>
                  <div className="cart-panel-heading">
                    <div>
                      <p className="eyebrow">Shipment {index + 1} – {group.vendorName}</p>
                      <h2>{group.count} {group.count === 1 ? 'item' : 'items'} in this shipment</h2>
                    </div>
                  </div>

                  <div className="cart-item-list">
                    {group.items.map((item) => (
                      <article className="cart-item" key={`${item.id}-${item.option}`}>
                        <Link className="cart-item-image" to={`/product/${item.slug || item.id || item._id}`} aria-label={`View ${item.name}`}>
                          <img src={item.image} alt={item.name} />
                        </Link>
                        <div className="cart-item-copy">
                          <p>{item.brand} – {item.origin}</p>
                          <h3><Link to={`/product/${item.slug || item.id || item._id}`}>{item.fullName || item.name}</Link></h3>
                          <dl>
                            <div><dt>Format</dt><dd>{item.option}</dd></div>
                            <div><dt>SKU ID</dt><dd>{item.sku}</dd></div>
                            <div><dt>Unit Price</dt><dd><Price amount={getProductPrice(item.price)} /></dd></div>
                          </dl>
                        </div>
                          <div className="cart-item-purchase">
                            <div className="flex flex-col mb-4">
                              <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Item total</span>
                              <div className="text-2xl font-semibold leading-none text-[#e1bd70]">
                                <Price amount={getProductPrice(item.price) * item.quantity} presentation="product" />
                              </div>
                            </div>
                            <div className="cart-item-controls">
                            <div className="cart-quantity-picker" aria-label={`Quantity for ${item.name}`}>
                              <button type="button" onClick={() => onUpdateQuantity(item.id, item.option, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={15} /></button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => onUpdateQuantity(item.id, item.option, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={15} /></button>
                            </div>
                            <button className="cart-remove-button" type="button" onClick={() => onRemove(item)}><Trash2 size={15} /> Remove</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary-card">
              <p className="eyebrow">Order summary</p>
              <h2>Cart Total</h2>
              <dl>
                {cartItems.map((item, idx) => (
                  <div key={item.id || item._id || `${item.name}-${idx}`}>
                    <dt className="truncate max-w-[200px] xl:max-w-[250px]" title={item.fullName || item.name}>
                      {item.quantity} &times; {item.fullName || item.name}
                    </dt>
                    <dd>
                      <Price amount={getProductPrice(item.price) * item.quantity} />
                    </dd>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-white/10" style={{ marginTop: '1rem', paddingTop: '1rem' }}><dt>Subtotal</dt><dd><Price amount={cartTotal} /></dd></div>
                <div><dt>Delivery</dt><dd>Calculated at checkout</dd></div>
                <div className="cart-summary-total"><dt>Total</dt><dd><Price amount={cartTotal} /></dd></div>
              </dl>
              <p className="cart-tax-note">Taxes included where applicable.</p>
              <button className="cart-checkout-button" onClick={handleCheckoutClick}>
                Proceed to Checkout <ArrowRight size={17} className="inline ml-2" />
              </button>
              <Link className="cart-continue-link" to="/shop"><ChevronLeft size={15} /> Continue Shopping</Link>
              <div className="cart-assurance-list">
                <p><ShieldCheck size={17} /><span><strong>Secure checkout</strong>Your details stay protected.</span></p>
                <p><Truck size={17} /><span><strong>Considered delivery</strong>Complimentary over R1,500.</span></p>
                <p><PackageCheck size={17} /><span><strong>Cellar-safe packaging</strong>Prepared for a safe arrival.</span></p>
              </div>
            </aside>
          </div>
          <div className="shell cart-clear-row">
            <button type="button" onClick={onClear} className="cart-clear-button">Clear Entire Cart</button>
          </div>
        </section>
      )}
    </main>
  )
}

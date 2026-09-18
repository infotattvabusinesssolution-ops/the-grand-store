import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck, Sparkles } from 'lucide-react';
import { getProductPrice } from '../../data';
import { useAuth } from '../../context/AuthContext';
import Price from '../../components/ui/Price';
import ProteaEmblem from '../home/components/ProteaEmblem';
import ArrivalsMandala from '../home/components/ArrivalsMandala';
import TribalCardBorder from '../home/components/TribalCardBorder';
import CardChakra from '../home/components/CardChakra';

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
    const vName = item.storeName || item.vendor?.name || 'The Grand Store Cellars';
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
    document.title = 'Shopping Cart – Review Items and Complete Your Purchase at The Grand Store';
    window.scrollTo({ top: 0, behavior: 'auto' });
    return () => { document.title = 'The Grand Store — Luxury Wines & Spirits'; };
  }, []);

  return (
    <main className="cart-page min-h-screen bg-[#090a0c] text-[#eee8dd] relative overflow-hidden">
      {/* Background Ambient Glows & Mandala Watermarks */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,rgba(202,164,88,0.08),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_left,rgba(202,164,88,0.05),transparent_70%)] pointer-events-none -z-10" />

      {/* Cart Hero Header with South African Luxury Styling */}
      <section className="cart-hero relative bg-[#0c0d10] border-b border-[#caa458]/25 overflow-hidden">
        {/* Floating Sacred Mandala Watermark in Hero */}
        <ArrivalsMandala 
          gradientId="mandala-cart-hero" 
          position="top-right" 
          className="opacity-25 md:opacity-30 pointer-events-none" 
        />

        <div className="shell cart-hero-inner relative z-10 flex items-end justify-between min-h-[140px] py-8 sm:py-10">
          <div className="cart-hero-copy min-w-0">
            <div className="cart-breadcrumb flex items-center gap-2 text-xs text-[#8a8479] mb-3">
              <Link to="/" className="hover:text-[#caa458] transition-colors">Home</Link>
              <ChevronRight size={13} className="text-[#caa458]/60" />
              <span className="text-[#caa458]">My Cart</span>
            </div>

            <div className="inline-flex items-center gap-2 mb-2">
              <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
              <p className="eyebrow m-0 text-xs font-bold tracking-[0.22em] uppercase text-[#caa458]">
                Your Private Cellar Selection
              </p>
            </div>

            <h1 className="m-0 font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f5eee2]">
              Your Cellar Cart
            </h1>
            <p className="cart-hero-description mt-2.5 max-w-[620px] text-sm sm:text-[15px] text-[#a39b8f] leading-relaxed">
              Review your curated bottles and complete each temperature-controlled shipment through our secure cellar checkout.
            </p>
          </div>

          <div className="cart-hero-count shrink-0 flex flex-col items-end pl-6 sm:pl-10 border-l border-[#caa458]/35">
            <strong className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-none text-[#caa458]">
              {String(itemCount).padStart(2, '0')}
            </strong>
            <span className="mt-1 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#918a7f]">
              {itemCount === 1 ? 'Vintage Selected' : 'Vintages Selected'}
            </span>
          </div>
        </div>
      </section>

      {/* Cart Content: Empty State or Active Cart List */}
      {cartItems.length === 0 ? (
        <section className="cart-empty-section py-16 sm:py-24 px-4 relative">
          <div className="cart-empty relative max-w-[640px] mx-auto p-8 sm:p-14 text-center bg-[#0e0e0c] border border-[#caa458]/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Centered Mandala Watermark in Empty State Card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20" aria-hidden="true">
              <ArrivalsMandala gradientId="mandala-cart-empty" position="top-right" className="w-[500px] h-[500px] -right-20 -top-20" />
            </div>

            {/* Glowing Golden Circle Emblem */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-[#181714] border border-[#caa458]/45 flex items-center justify-center text-[#caa458] shadow-[0_0_30px_rgba(202,164,88,0.25)]">
              <ShoppingBag size={30} strokeWidth={1.8} />
            </div>

            <div className="relative z-10 inline-flex items-center gap-2 mb-3">
              <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
              <p className="eyebrow m-0 text-xs font-bold tracking-[0.22em] uppercase text-[#caa458]">
                Your Private Cellar Awaits
              </p>
            </div>

            <h2 className="relative z-10 m-0 font-serif text-3xl sm:text-4xl text-[#f3ecdf] font-normal mb-3 leading-tight">
              Your Cart is Empty
            </h2>

            <p className="relative z-10 max-w-[460px] mx-auto mb-8 text-sm sm:text-base text-[#9d9589] leading-relaxed">
              Explore our prestigious collection of rare South African vintages, private estate wines, and artisanal spirits worthy of your cellar.
            </p>

            <div className="relative z-10">
              <Link 
                className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#caa458] hover:bg-[#d8b566] text-black font-bold text-xs uppercase tracking-[0.16em] transition-all hover:scale-105 shadow-[0_4px_25px_rgba(202,164,88,0.4)] no-underline cursor-pointer font-sans" 
                to="/shop"
              >
                Explore The Cellar <ArrowRight size={16} />
              </Link>
            </div>

            {/* Decorative Tribal Border Accent at Bottom of Card */}
            <div className="mt-8 -mx-8 sm:-mx-14 -mb-8 sm:-mb-14">
              <TribalCardBorder className="opacity-50" />
            </div>
          </div>
        </section>
      ) : (
        <section className="cart-content-section py-10 sm:py-14 relative">
          <div className="shell cart-layout grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 xl:gap-10 items-start">
            
            {/* Left Column: Shipment & Item Cards */}
            <div className="cart-items-panel flex flex-col gap-8 min-w-0">
              {vendorGroups.map((group, index) => (
                <div 
                  className="cart-vendor-group bg-[#0e0e0c] border border-[#caa458]/25 shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden relative" 
                  key={group.vendorId}
                >
                  {/* Subtle Card Tribal Top Border */}
                  <TribalCardBorder className="opacity-45" />

                  <div className="cart-panel-heading px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4 bg-[#121210]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
                        <p className="eyebrow m-0 text-[11px] font-bold tracking-[0.18em] uppercase text-[#caa458]">
                          Shipment {index + 1} &bull; {group.vendorName}
                        </p>
                      </div>
                      <h2 className="m-0 font-serif text-2xl sm:text-3xl text-[#eee8dd] font-medium">
                        {group.count} {group.count === 1 ? 'Vintage' : 'Vintages'} in this shipment
                      </h2>
                    </div>
                  </div>

                  {/* Items in this Shipment */}
                  <div className="cart-item-list divide-y divide-white/10 p-6">
                    {group.items.map((item) => (
                      <article 
                        className="cart-item py-6 first:pt-2 last:pb-2 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start sm:items-center justify-between" 
                        key={`${item.id}-${item.option}`}
                      >
                        {/* Thumbnail with gold luxury border */}
                        <Link 
                          className="cart-item-image shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded bg-[#141412] border border-[#caa458]/30 flex items-center justify-center p-2 hover:border-[#caa458] transition-colors overflow-hidden" 
                          to={`/product/${item.slug || item.id || item._id}`} 
                          aria-label={`View ${item.name}`}
                        >
                          <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                        </Link>

                        {/* Details */}
                        <div className="cart-item-copy flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-wider text-[#caa458] font-semibold mb-1">
                            {item.brand} &bull; {item.origin || 'South Africa'}
                          </p>
                          <h3 className="text-lg sm:text-xl font-serif text-[#eee8dd] mb-2 leading-snug">
                            <Link to={`/product/${item.slug || item.id || item._id}`} className="hover:text-[#caa458] transition-colors">
                              {item.fullName || item.name}
                            </Link>
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8e887d]">
                            <span><strong className="text-[#bbb]">Format:</strong> {item.option}</span>
                            {item.sku && <span><strong className="text-[#bbb]">SKU:</strong> {item.sku}</span>}
                            <span><strong className="text-[#bbb]">Unit Price:</strong> <Price amount={getProductPrice(item.price)} /></span>
                          </div>
                        </div>

                        {/* Purchase & Quantity controls */}
                        <div className="cart-item-purchase flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase tracking-widest text-[#8e887d] block mb-0.5">Item Total</span>
                            <div className="text-xl sm:text-2xl font-serif font-bold text-[#caa458]">
                              <Price amount={getProductPrice(item.price) * item.quantity} presentation="product" />
                            </div>
                          </div>

                          <div className="cart-item-controls flex items-center gap-3">
                            <div className="cart-quantity-picker inline-flex items-center border border-[#caa458]/35 bg-[#141412] rounded overflow-hidden" aria-label={`Quantity for ${item.name}`}>
                              <button 
                                type="button" 
                                onClick={() => onUpdateQuantity(item.id, item.option, item.quantity - 1)} 
                                aria-label={`Decrease ${item.name} quantity`}
                                className="px-2.5 py-1.5 hover:bg-[#caa458]/15 text-[#caa458] transition-colors cursor-pointer"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="px-3 text-xs font-bold text-white font-sans">{item.quantity}</span>
                              <button 
                                type="button" 
                                onClick={() => onUpdateQuantity(item.id, item.option, item.quantity + 1)} 
                                aria-label={`Increase ${item.name} quantity`}
                                className="px-2.5 py-1.5 hover:bg-[#caa458]/15 text-[#caa458] transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <button 
                              className="cart-remove-button inline-flex items-center gap-1 text-xs text-[#8e887d] hover:text-red-400 transition-colors cursor-pointer p-1" 
                              type="button" 
                              onClick={() => onRemove(item)}
                            >
                              <Trash2 size={14} /> <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary Card with South African Luxury Touch */}
            <aside className="cart-summary-card bg-[#0e0e0c] border border-[#caa458]/35 shadow-[0_20px_50px_rgba(0,0,0,0.75)] p-6 sm:p-8 relative overflow-hidden sticky top-28">
              {/* Subtle Card Chakra Watermark in top right of card */}
              <div className="absolute -top-10 -right-10 w-44 h-44 opacity-15 pointer-events-none" aria-hidden="true">
                <CardChakra className="w-full h-full text-[#caa458]" />
              </div>

              {/* Decorative Tribal Top Line */}
              <div className="-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6">
                <TribalCardBorder className="opacity-50" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
                  <p className="eyebrow m-0 text-xs font-bold tracking-[0.22em] uppercase text-[#caa458]">
                    Cellar Order Summary
                  </p>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#f5eee2] font-normal mb-6">
                  Cart Total
                </h2>

                {/* Breakdown */}
                <dl className="space-y-3 text-sm text-[#bbb] border-b border-white/10 pb-5 mb-5">
                  {cartItems.map((item, idx) => (
                    <div key={item.id || item._id || `${item.name}-${idx}`} className="flex justify-between items-baseline gap-2">
                      <dt className="truncate max-w-[210px] text-xs text-[#9d9589]" title={item.fullName || item.name}>
                        {item.quantity} &times; {item.fullName || item.name}
                      </dt>
                      <dd className="font-medium text-[#eee8dd] shrink-0 font-sans text-xs">
                        <Price amount={getProductPrice(item.price) * item.quantity} />
                      </dd>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                    <dt className="text-sm font-semibold text-[#ddd]">Subtotal</dt>
                    <dd className="text-sm font-bold text-[#eee8dd] font-sans">
                      <Price amount={cartTotal} />
                    </dd>
                  </div>

                  <div className="flex justify-between items-baseline text-xs text-[#8e887d]">
                    <dt>Cellar Courier</dt>
                    <dd className="text-[#caa458] font-medium">Calculated at checkout</dd>
                  </div>

                  <div className="pt-3 border-t border-[#caa458]/20 flex justify-between items-baseline">
                    <dt className="text-base font-serif font-bold text-white">Estimated Total</dt>
                    <dd className="text-xl sm:text-2xl font-serif font-bold text-[#caa458]">
                      <Price amount={cartTotal} />
                    </dd>
                  </div>
                </dl>

                <p className="cart-tax-note text-[11px] text-[#7a7469] mb-5">
                  Regional taxes and customs duties included where applicable.
                </p>

                {/* Proceed to Checkout CTA */}
                <button 
                  className="cart-checkout-button w-full py-4 px-6 bg-[#caa458] hover:bg-[#d8b566] text-black font-bold text-xs uppercase tracking-[0.16em] transition-all hover:scale-[1.02] shadow-[0_4px_20px_rgba(202,164,88,0.35)] cursor-pointer flex items-center justify-center gap-2 mb-4 font-sans" 
                  onClick={handleCheckoutClick}
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>

                <Link 
                  className="cart-continue-link inline-flex items-center justify-center w-full gap-1.5 text-xs text-[#caa458] hover:text-[#f7e1a0] transition-colors font-medium mb-6" 
                  to="/shop"
                >
                  <ChevronLeft size={14} /> Continue Exploring Cellar
                </Link>

                {/* Luxury Sommelier Assurances */}
                <div className="cart-assurance-list pt-5 border-t border-white/10 space-y-3.5 text-xs text-[#9d9589]">
                  <p className="flex items-start gap-2.5 m-0">
                    <ShieldCheck size={16} className="text-[#caa458] shrink-0 mt-0.5" />
                    <span><strong className="text-[#ddd] block font-semibold">Encrypted Sommelier Checkout</strong>Your private details and allocation stay protected.</span>
                  </p>
                  <p className="flex items-start gap-2.5 m-0">
                    <Truck size={16} className="text-[#caa458] shrink-0 mt-0.5" />
                    <span><strong className="text-[#ddd] block font-semibold">Temperature-Controlled Courier</strong>Complimentary cellar delivery over R 1,800.</span>
                  </p>
                  <p className="flex items-start gap-2.5 m-0">
                    <PackageCheck size={16} className="text-[#caa458] shrink-0 mt-0.5" />
                    <span><strong className="text-[#ddd] block font-semibold">Cellar-Safe Impact Crating</strong>Prepared with wax-sealed authenticity guarantee.</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Clear Cart Action */}
          <div className="shell cart-clear-row mt-10 pt-6 border-t border-white/10 flex justify-end">
            <button 
              type="button" 
              onClick={onClear} 
              className="cart-clear-button text-xs uppercase tracking-wider text-[#8e887d] hover:text-[#caa458] transition-colors cursor-pointer py-2 px-4 border border-white/10 hover:border-[#caa458]/40"
            >
              Clear Entire Selection
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

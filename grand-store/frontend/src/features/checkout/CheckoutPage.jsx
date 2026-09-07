import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Lock,
  CreditCard,
  Loader2,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  MapPin,
  FileText,
  Download,
  Plus,
  Minus,
  Trash2,
  Phone,
  Sparkles,
  Gift,
  Coins,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProductPrice } from '../../data';
import LocationInput from '../../components/LocationInput';
import CityInput from '../../components/CityInput';
import PostalCodeInput from '../../components/PostalCodeInput';
import PaymentForm from './PaymentForm';
import SecurePaymentBadges from '../../components/checkout/SecurePaymentBadges';
import Price from '../../components/ui/Price';
import StoreBankDetailsCard from '../../components/StoreBankDetailsCard';
import api from '../../api';

const POSTNET_AVAILABLE_CITIES = [
  { name: 'Sandton', postalCode: '2196', lat: -26.1076, lng: 28.0567 },
  { name: 'Johannesburg', postalCode: '2000', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town', postalCode: '8001', lat: -33.9249, lng: 18.4241 },
  { name: 'Durban', postalCode: '4001', lat: -29.8587, lng: 31.0218 },
  { name: 'Pretoria', postalCode: '0002', lat: -25.7479, lng: 28.2293 },
  { name: 'Stellenbosch', postalCode: '7600', lat: -33.9321, lng: 18.8602 },
  { name: 'Centurion', postalCode: '0157', lat: -25.8603, lng: 28.1895 },
  { name: 'Gqeberha', postalCode: '6001', lat: -33.9608, lng: 25.6022 },
  { name: 'Bloemfontein', postalCode: '9301', lat: -29.0852, lng: 26.1596 },
  { name: 'East London', postalCode: '5201', lat: -33.0153, lng: 27.9116 }
];

export default function CheckoutPage({
  cartItems,
  updateCartQuantity,
  removeFromCart,
  onClearCart,
  clearVendorCart,
  onNotify
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get('vendor');
  const vendorCartItems = vendorId
    ? cartItems.filter((item) => (item.storeId || item.vendorId || 'grand-store') === vendorId)
    : cartItems;

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // 4-Step Wizard: 1 = Details, 2 = Delivery Method, 3 = Payment, 4 = Proof Upload
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [quote, setQuote] = useState(null);
  const [dutiesAccepted, setDutiesAccepted] = useState(false);
  const [deliveryPreference, setDeliveryPreference] = useState('home'); // 'home' or 'postnet'
  const [applyRewards, setApplyRewards] = useState(false);
  const [useSuperCoins, setUseSuperCoins] = useState(true);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    email: user ? user.email : '',
    firstName: user ? user.name.split(' ')[0] : '',
    lastName: user && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : '',
    phone: user ? (user.phone || user.phoneNumber || '') : '',
    address: '',
    city: '',
    postalCode: '',
    country: 'South Africa',
    lat: null,
    lng: null
  });

  const [postnetPreview, setPostnetPreview] = useState({
    loading: false,
    stores: [],
    searchedCity: '',
    hasCityMatch: false,
    usingNearestCity: false,
    error: ''
  });
  const [preferredPostnetStore, setPreferredPostnetStore] = useState(null);
  const [showAllPostnetBranches, setShowAllPostnetBranches] = useState(false);
  const [showAllPostnetCities, setShowAllPostnetCities] = useState(false);

  const [paymentData, setPaymentData] = useState(null);
  const [payfastUrl, setPayfastUrl] = useState(null);

  const cartSubtotal = vendorCartItems.reduce(
    (sum, item) => sum + getProductPrice(item.price) * item.quantity,
    0
  );
  const cartItemCount = vendorCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Super Coin discount calculation
  const superCoinDiscount = useSuperCoins && quote?.superCoins
    ? (quote.superCoins.maxDiscountRand || 0)
    : 0;

  const placeOrderBaseTotal = quote ? quote.aggregatedTotals.totalToPay : cartSubtotal;
  const referralRewardDiscount = applyRewards ? (user?.rewardBalance || 0) : 0;
  const displayedTotal = Math.max(0, parseFloat((placeOrderBaseTotal - superCoinDiscount - referralRewardDiscount).toFixed(2)));

  const handleUpdateQuantity = (productId, option, newQuantity) => {
    if (updateCartQuantity) updateCartQuantity(productId, option, newQuantity);
    setQuote(null);
    setDutiesAccepted(false);
  };

  const handleRemoveItem = (item) => {
    if (removeFromCart) removeFromCart(item);
    setQuote(null);
    setDutiesAccepted(false);
  };

  useEffect(() => {
    document.title = 'Checkout – The Grand Store';
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (user && user.role && (user.role.startsWith('vendor') || user.role === 'admin')) {
      onNotify('Vendors and admins cannot checkout. Please login as a customer to buy.');
      navigate('/register');
    }
  }, [user, navigate, onNotify]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email || '',
        firstName: prev.firstName || (user.name ? user.name.split(' ')[0] : ''),
        lastName: prev.lastName || (user.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : ''),
        phone: prev.phone || user.phone || user.phoneNumber || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (['address', 'city', 'postalCode', 'country'].includes(name)) {
      setQuote(null);
      setDutiesAccepted(false);
    }
  };

  const handleCityChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      postalCode: '',
      lat: null,
      lng: null
    }));
    setPreferredPostnetStore(null);
    setPostnetPreview({
      loading: false,
      stores: [],
      searchedCity: value,
      hasCityMatch: false,
      usingNearestCity: false,
      error: ''
    });
    setQuote(null);
    setDutiesAccepted(false);
  };

  const selectDeliveryPreference = (preference) => {
    if (deliveryPreference === preference) return;
    setDeliveryPreference(preference);
    setQuote(null);
    setDutiesAccepted(false);
    if (preference === 'postnet') {
      setFormData((current) => ({ ...current, country: 'South Africa' }));
    }
  };

  // PostNet Store Locator effect
  useEffect(() => {
    const isSouthAfricanCity = ['south africa', 'za', 'rsa'].includes(String(formData.country || '').trim().toLowerCase());
    const shouldFindPostnet = user
      && deliveryPreference === 'postnet'
      && isSouthAfricanCity
      && formData.city;

    if (!shouldFindPostnet) return undefined;

    let cancelled = false;
    setPostnetPreview((current) => ({ ...current, loading: true, error: '', stores: [], searchedCity: formData.city }));

    api.get('/postnet/locator', {
      params: {
        address: `${formData.city}, South Africa`,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng
      }
    }).then((response) => {
      if (cancelled) return;
      const stores = response.data?.stores || [];
      setPostnetPreview({
        loading: false,
        stores,
        searchedCity: response.data?.searchedCity || formData.city,
        hasCityMatch: Boolean(response.data?.hasCityMatch),
        usingNearestCity: Boolean(response.data?.usingNearestCity),
        error: ''
      });
      // Default to nearest store if none selected yet
      if (stores.length > 0 && !preferredPostnetStore) {
        setPreferredPostnetStore(stores[0]);
      }
    }).catch((error) => {
      if (cancelled) return;
      setPostnetPreview({
        loading: false,
        stores: [],
        searchedCity: formData.city,
        hasCityMatch: false,
        usingNearestCity: false,
        error: error.response?.data?.message || 'PostNet branches could not be loaded. Please try again.'
      });
    });

    return () => {
      cancelled = true;
    };
  }, [deliveryPreference, formData.city, formData.country, formData.lat, formData.lng, user]);

  const postnetPostalCodes = useMemo(() => (
    [...new Set(postnetPreview.stores.filter((store) => store.isInSelectedCity).map((store) => (
      store.postalCode || String(store.address || '').match(/\b\d{4}\b/)?.[0]
    )).filter(Boolean))]
  ), [postnetPreview.stores]);

  const fetchQuote = async (shippingAddress = formData) => {
    if (!user) {
      onNotify('Please log in to continue checkout');
      navigate('/login?redirect=/customer/checkout');
      return null;
    }

    setQuoteLoading(true);

    try {
      const payload = {
        cartItems: vendorCartItems.map((item) => ({
          product: item.id || item._id,
          name: item.fullName || item.name,
          quantity: item.quantity,
          option: item.option,
          image: item.image
        })),
        shippingAddress: {
          address: deliveryPreference === 'postnet' && preferredPostnetStore
            ? preferredPostnetStore.address
            : (shippingAddress.address || 'PostNet Pickup Branch'),
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode || '0001',
          country: shippingAddress.country || 'South Africa',
          lat: shippingAddress.lat,
          lng: shippingAddress.lng
        },
        deliveryPreference,
        preferredPostnetStore
      };

      const res = await api.post('/checkout/quote', payload);
      const data = res.data;

      if (preferredPostnetStore) {
        data.shipments = data.shipments.map((shipment) => ({
          ...shipment,
          selectedPickupStore: preferredPostnetStore
        }));
      }

      setQuote(data);
      return data;
    } catch (error) {
      console.error('Quote fetch error:', error);
      onNotify(error.response?.data?.message || error.message || 'Failed to get shipping quote. Check address details.');
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleCourierSelect = (shipmentIndex, courierOption) => {
    if (!quote) return;

    const newShipments = [...quote.shipments];
    newShipments[shipmentIndex] = {
      ...newShipments[shipmentIndex],
      selectedCourier: courierOption,
      selectedPickupStore: courierOption.deliveryType === 'pickup'
        ? (newShipments[shipmentIndex].selectedPickupStore || preferredPostnetStore)
        : null
    };

    const newShippingTotal = newShipments.reduce(
      (sum, shp) => sum + (shp.selectedCourier ? shp.selectedCourier.cost : 0),
      0
    );

    setQuote({
      ...quote,
      shipments: newShipments,
      aggregatedTotals: {
        ...quote.aggregatedTotals,
        shipping: newShippingTotal,
        totalToPay: parseFloat((quote.globalSubtotal + newShippingTotal).toFixed(2))
      }
    });
  };

  const handlePreferredPostnetStoreSelect = (store) => {
    setPreferredPostnetStore(store);
    if (quote) {
      setQuote((currentQuote) => ({
        ...currentQuote,
        shipments: currentQuote.shipments.map((shipment) => ({
          ...shipment,
          selectedPickupStore: store
        }))
      }));
    }
  };

  // Step 1 -> Step 2 validation
  const handleProceedToDeliveryMethod = async (e) => {
    if (e) e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email) {
      onNotify('Please fill in your recipient contact details including email address.');
      return;
    }

    if (!isAgeConfirmed) {
      onNotify('You must confirm that you are 18 years of age or older to purchase alcoholic beverages.');
      return;
    }

    if (deliveryPreference === 'home' && (!formData.address || !formData.city || !formData.postalCode)) {
      onNotify('Please provide your complete street address, city, and postal code for door delivery.');
      return;
    }

    if (deliveryPreference === 'postnet' && (!formData.city || !preferredPostnetStore)) {
      onNotify('Please search for a city and select your preferred PostNet collection branch.');
      return;
    }

    const currentQuote = quote || await fetchQuote();
    if (currentQuote) {
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 -> Step 3 validation
  const handleProceedToPayment = () => {
    if (!quote) {
      onNotify('Please calculate your delivery quote first.');
      return;
    }

    if (deliveryPreference === 'postnet' && !preferredPostnetStore) {
      onNotify('Please select a PostNet collection store.');
      return;
    }

    if (quote.hasInternational && !dutiesAccepted) {
      onNotify('Please accept the International Duties acknowledgment.');
      return;
    }

    setCheckoutStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [paymentMethod, setPaymentMethod] = useState('payfast');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  // Submit Final Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!quote) {
      onNotify('Please calculate and select a delivery option first.');
      return;
    }

    if (!isAgeConfirmed) {
      onNotify('You must confirm that you are 18 years of age or older to purchase alcoholic beverages.');
      return;
    }

    setLoading(true);

    try {
      const isGuest = !user;
      const guestName = `${formData.firstName} ${formData.lastName}`.trim();
      const orderData = {
        quote,
        isGuest,
        guestEmail: formData.email,
        guestName: guestName || 'Guest Customer',
        guestPhone: formData.phone || '',
        isAgeConfirmed: isAgeConfirmed,
        shippingAddress: {
          name: guestName,
          email: formData.email,
          address: deliveryPreference === 'postnet' && preferredPostnetStore
            ? preferredPostnetStore.address
            : formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone || user?.phone || user?.phoneNumber || '',
          phoneNumber: formData.phone || user?.phone || user?.phoneNumber || ''
        },
        deliveryPreference,
        selectedPostnetStore: preferredPostnetStore,
        paymentMethod: paymentMethod === 'payfast' ? 'PayFast' : 'Bank Transfer',
        isGift,
        giftRecipientName,
        giftMessage,
        applyRewards,
        useSuperCoins
      };

      const res = await api.post('/orders', orderData);
      const data = res.data;
      setCreatedOrderId(data._id);

      if (paymentMethod === 'payfast') {
        const pfRes = await api.post('/payfast/generate-shop', { orderId: data._id });
        setPayfastUrl(pfRes.data.url);
        setPaymentData(pfRes.data.data);
      } else {
        // Step 4: Bank Transfer Proof Upload Screen
        setCheckoutStep(4);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Failed to place order';
      onNotify(msg);
      if (msg.includes('expired')) {
        setCheckoutStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofUrl) {
      onNotify('Please provide a link to the proof of payment document.');
      return;
    }
    setUploadingProof(true);
    try {
      await api.post(`/orders/${createdOrderId}/bank-transfer/upload`, { proofUrl });
      onNotify('Proof uploaded successfully. Awaiting verification.');
      if (onClearCart) onClearCart(vendorId);
      navigate(user ? `/customer/order/${createdOrderId}` : `/order-success/${createdOrderId}`);
    } catch (error) {
      onNotify(error.response?.data?.message || error.message || 'Failed to upload proof');
    } finally {
      setUploadingProof(false);
    }
  };

  if (vendorCartItems.length === 0) {
    return (
      <main className="pt-32 pb-16 min-h-screen bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-20 border border-white/10 bg-black/40 rounded-3xl">
            <ShoppingCart size={48} className="text-white/20" />
            <div>
              <h2 className="text-3xl font-serif text-white mb-2">Your cart is empty</h2>
              <p className="text-sm text-[var(--color-ivory-muted)]">Discover our curated reserve of luxury bottles.</p>
            </div>
            <Link to="/shop" className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
              Explore Collection
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-36 min-h-screen bg-[#050505] md:pt-32 md:pb-16 text-white">
      <div className="max-w-6xl mx-auto px-4 mb-8 sm:px-6 md:mb-12">
        {/* Top Breadcrumb & Step Indicator */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (checkoutStep > 1 && checkoutStep < 4) setCheckoutStep(checkoutStep - 1);
              else navigate(-1);
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-[var(--color-gold)] transition-colors text-xs font-medium uppercase tracking-wider"
          >
            <ArrowRight size={14} className="rotate-180" /> Back
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-emerald-400 font-medium tracking-widest uppercase bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
            <Lock size={11} /> 256-Bit Encrypted Luxury Checkout
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        {checkoutStep !== 4 && (
          <nav aria-label="Checkout Progress" className="mb-8 overflow-x-auto pb-2">
            <div className="flex items-center min-w-max justify-between gap-2 border-b border-white/10 pb-4">
              {[
                { step: 1, label: 'Delivery Details', icon: MapPin },
                { step: 2, label: 'Delivery Method', icon: Truck },
                { step: 3, label: 'Payment', icon: CreditCard },
                { step: 4, label: 'Confirmation', icon: CheckCircle2 }
              ].map((item) => {
                const ItemIcon = item.icon;
                const isActive = checkoutStep === item.step;
                const isCompleted = checkoutStep > item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    disabled={item.step > checkoutStep && item.step !== 2}
                    onClick={() => {
                      if (item.step < checkoutStep) setCheckoutStep(item.step);
                    }}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 font-medium'
                        : isCompleted
                        ? 'text-white/80 hover:text-white cursor-pointer'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isCompleted
                          ? 'bg-[var(--color-gold)] text-black'
                          : isActive
                          ? 'border border-[var(--color-gold)] text-[var(--color-gold)]'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={14} /> : item.step}
                    </span>
                    <span className="text-xs uppercase tracking-wider">{item.label}</span>
                    {item.step < 4 && <ChevronRight size={14} className="text-white/20 ml-2" />}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className="flex flex-col lg:flex-row-reverse lg:items-start gap-8 w-full md:gap-12 xl:gap-16">
          {/* Right Column - Itemised Order Summary */}
          {checkoutStep !== 4 && (
            <div className="w-full lg:w-[420px] xl:w-[450px] lg:sticky lg:top-32 shrink-0">
              <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 md:p-7 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-60"></div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-gold)] mb-1">Your Order</p>
                    <h2 className="text-xl font-serif text-white">Summary</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-[var(--color-ivory-muted)]">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Mobile Toggle */}
                <button
                  type="button"
                  onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                  className="mb-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-white md:hidden"
                >
                  <span>{mobileSummaryOpen ? 'Hide bottle details' : 'Show bottle details'}</span>
                  {mobileSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Items List */}
                <div className={`${mobileSummaryOpen ? 'block' : 'hidden'} md:block space-y-3 border-b border-white/10 pb-4`}>
                  {vendorCartItems.map((item) => (
                    <div key={`${item.id || item._id}-${item.option || ''}`} className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-lg border border-white/10 bg-black/50 p-1 flex items-center justify-center shrink-0">
                          <img src={item.image} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate font-medium">{item.fullName || item.name}</p>
                          <p className="text-[11px] text-[var(--color-ivory-muted)]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-xs font-serif text-[var(--color-gold)] shrink-0">
                        <Price amount={getProductPrice(item.price) * item.quantity} />
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-3 pt-4 text-xs">
                  <div className="flex justify-between text-[var(--color-ivory-muted)]">
                    <span>Merchandise Subtotal</span>
                    <span className="text-white"><Price amount={cartSubtotal} /></span>
                  </div>

                  <div className="flex justify-between text-[var(--color-ivory-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Truck size={13} className="text-[var(--color-gold)]" />
                      {deliveryPreference === 'postnet' ? 'PostNet Collection' : 'PostNet Delivery'}
                    </span>
                    <span className="text-white">
                      {quote ? (
                        quote.aggregatedTotals.shipping > 0 ? (
                          <Price amount={quote.aggregatedTotals.shipping} />
                        ) : (
                          <span className="text-emerald-400 font-medium uppercase text-[10px]">Free</span>
                        )
                      ) : (
                        'Calculated next'
                      )}
                    </span>
                  </div>

                  {/* Super Coins Deduction in Summary */}
                  {superCoinDiscount > 0 && (
                    <div className="flex justify-between items-center text-amber-300 bg-amber-400/10 px-2.5 py-1.5 rounded-lg border border-amber-400/20">
                      <span className="flex items-center gap-1">
                        <Coins size={12} /> Super Coins Applied
                      </span>
                      <span>-<Price amount={superCoinDiscount} /></span>
                    </div>
                  )}

                  {/* Referral Rewards Deduction */}
                  {referralRewardDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                      <span>Referral Credits</span>
                      <span>-<Price amount={referralRewardDiscount} /></span>
                    </div>
                  )}
                </div>

                {/* Total To Pay */}
                <div className="flex items-end justify-between border-t border-white/10 pt-4 mt-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)]">Total to Pay</p>
                    <p className="text-[10px] text-white/40">Includes VAT & delivery</p>
                  </div>
                  <span className="text-2xl font-serif text-gold-gradient">
                    <Price amount={displayedTotal} />
                  </span>
                </div>

                {/* Potential Super Coins Earned Banner */}
                {quote?.superCoins?.potentialCoinsToEarn > 0 && (
                  <div className="mt-4 rounded-xl border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5 p-3 text-[11px] text-[var(--color-ivory)] flex items-center gap-2.5">
                    <Sparkles size={16} className="text-[var(--color-gold)] shrink-0" />
                    <span>
                      Earn <strong className="text-[var(--color-gold)]">+{quote.superCoins.potentialCoinsToEarn} Super Coins</strong> (R{(quote.superCoins.potentialCoinsToEarn * 0.1).toFixed(2)}) upon order delivery!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Left Column - 4-Step Content */}
          <div className="w-full lg:w-auto flex-1 flex flex-col min-w-0">
            {/* ========================================================================= */}
            {/* STEP 1: DELIVERY DETAILS & LOCATION CHOICE                               */}
            {/* ========================================================================= */}
            {checkoutStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-serif text-white mb-1">1. Delivery Location</h2>
                  <p className="text-xs text-[var(--color-ivory-muted)]">Choose how and where you want your luxury order delivered.</p>
                </div>

                {/* Express Guest Checkout Banner */}
                {!user && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">Express Guest Checkout</p>
                        <p className="text-[11px] text-[var(--color-ivory-muted)]">
                          No password required to order. You can claim 100 Super Coins in 1 click after payment.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/login?redirect=/customer/checkout"
                      className="text-xs text-[var(--color-gold)] hover:underline shrink-0 font-medium tracking-wider uppercase flex items-center gap-1"
                    >
                      Already have an account? Log in <ChevronRight size={12} />
                    </Link>
                  </div>
                )}

                {/* Delivery Location Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => selectDeliveryPreference('home')}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      deliveryPreference === 'home'
                        ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                        : 'border-white/10 bg-[#0d0d0d] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`p-2 rounded-xl ${deliveryPreference === 'home' ? 'bg-[var(--color-gold)] text-black' : 'bg-white/5 text-white/60'}`}>
                        <Truck size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">Deliver to my address</p>
                        <p className="text-[11px] text-[var(--color-ivory-muted)]">Direct door-to-door courier delivery</p>
                      </div>
                    </div>
                    {deliveryPreference === 'home' && <CheckCircle2 size={16} className="absolute right-4 top-4 text-[var(--color-gold)]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => selectDeliveryPreference('postnet')}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      deliveryPreference === 'postnet'
                        ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                        : 'border-white/10 bg-[#0d0d0d] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`p-2 rounded-xl ${deliveryPreference === 'postnet' ? 'bg-[var(--color-gold)] text-black' : 'bg-white/5 text-white/60'}`}>
                        <Store size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">Collect from a PostNet Store</p>
                        <p className="text-[11px] text-[var(--color-ivory-muted)]">Pick up at over 450+ PostNet branches</p>
                      </div>
                    </div>
                    {deliveryPreference === 'postnet' && <CheckCircle2 size={16} className="absolute right-4 top-4 text-[var(--color-gold)]" />}
                  </button>
                </div>

                {/* Recipient Details */}
                <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium">Recipient Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">Email Address (For Invoices & Tracking Updates) *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="e.g. yourname@example.com"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                          <Phone size={12} className="text-[var(--color-gold)]" /> Mobile Number (Required for PostNet SMS alerts) *
                        </label>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="e.g. +27 82 123 4567"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* If Home Delivery: Street Address Inputs */}
                {deliveryPreference === 'home' && (
                  <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium">Delivery Address Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">Street Address</label>
                        <LocationInput
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          onPlaceDetails={({ address, city, postalCode, country, lat, lng }) => {
                            setFormData((current) => ({
                              ...current,
                              address: address || current.address,
                              city: city || current.city,
                              postalCode: postalCode || current.postalCode,
                              country: country || current.country,
                              lat: lat ?? current.lat,
                              lng: lng ?? current.lng
                            }));
                            setQuote(null);
                          }}
                          required
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                          placeholder="Street number and name..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">City / Suburb</label>
                        <CityInput
                          name="city"
                          value={formData.city}
                          onChange={handleCityChange}
                          onCityDetails={({ city, country, lat, lng }) => {
                            setFormData((current) => ({
                              ...current,
                              city,
                              postalCode: '',
                              country: country || current.country,
                              lat,
                              lng
                            }));
                            setQuote(null);
                          }}
                          required
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                          placeholder="e.g. Sandton"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">Postal Code</label>
                        <PostalCodeInput
                          name="postalCode"
                          value={formData.postalCode}
                          city={formData.city}
                          cityLat={formData.lat}
                          cityLng={formData.lng}
                          suggestedPostalCodes={postnetPostalCodes}
                          onChange={handleChange}
                          onPostalDetails={({ postalCode }) => {
                            setFormData((current) => ({ ...current, postalCode }));
                            setQuote(null);
                          }}
                          required
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                          placeholder="e.g. 2196"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* If PostNet Store Collection: Branch Search & Selection */}
                {deliveryPreference === 'postnet' && (
                  <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Choose Your Preferred PostNet Store</h3>
                        <p className="text-xs text-[var(--color-ivory-muted)]">Search your suburb or city to find the nearest collection point.</p>
                      </div>
                    </div>

                    {/* Quick City Selection: Top 3 cities by default with Show More / Less */}
                    <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                          Available PostNet Hubs & Cities
                        </span>
                        {POSTNET_AVAILABLE_CITIES.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAllPostnetCities(!showAllPostnetCities)}
                            className="text-[11px] text-[var(--color-gold)] hover:underline flex items-center gap-1 font-semibold"
                          >
                            {showAllPostnetCities
                              ? 'Show Fewer Cities ▴'
                              : `Show More Cities (+${POSTNET_AVAILABLE_CITIES.length - 3} More) ▾`}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(showAllPostnetCities ? POSTNET_AVAILABLE_CITIES : POSTNET_AVAILABLE_CITIES.slice(0, 3)).map((city) => {
                          const isSelected = String(formData.city || '').trim().toLowerCase() === city.name.toLowerCase();
                          return (
                            <button
                              key={city.name}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  city: city.name,
                                  postalCode: city.postalCode,
                                  lat: city.lat,
                                  lng: city.lng
                                }));
                                setPreferredPostnetStore(null);
                                setQuote(null);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? 'bg-[var(--color-gold)] text-black font-bold shadow-md'
                                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                              }`}
                            >
                              📍 {city.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">City / Suburb</label>
                        <CityInput
                          name="city"
                          value={formData.city}
                          onChange={handleCityChange}
                          onCityDetails={({ city, lat, lng }) => {
                            setFormData((current) => ({
                              ...current,
                              city,
                              lat,
                              lng
                            }));
                            setQuote(null);
                          }}
                          restrictToSouthAfrica={true}
                          required
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                          placeholder="Search suburb or city..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">Postal Code</label>
                        <PostalCodeInput
                          name="postalCode"
                          value={formData.postalCode}
                          city={formData.city}
                          cityLat={formData.lat}
                          cityLng={formData.lng}
                          suggestedPostalCodes={postnetPostalCodes}
                          onChange={handleChange}
                          onPostalDetails={({ postalCode }) => {
                            setFormData((current) => ({ ...current, postalCode }));
                            setQuote(null);
                          }}
                          restrictToSouthAfrica={true}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                          placeholder="Postal code..."
                        />
                      </div>
                    </div>

                    {/* Selected Store Banner */}
                    {preferredPostnetStore && (
                      <div className="rounded-xl border border-[var(--color-gold)] bg-[var(--color-gold)]/10 p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <MapPin size={20} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-0.5">Your Collection Point</p>
                            <p className="text-sm font-bold text-white">{preferredPostnetStore.name}</p>
                            <p className="text-xs text-[var(--color-ivory-muted)] mt-0.5">{preferredPostnetStore.address}</p>
                            {preferredPostnetStore.distance !== null && preferredPostnetStore.distance !== undefined && (
                              <p className="text-[11px] text-white/50 mt-1">📍 {preferredPostnetStore.distance} km away</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreferredPostnetStore(null)}
                          className="text-[11px] text-[var(--color-gold)] hover:text-white uppercase font-bold tracking-wider underline shrink-0"
                        >
                          Change location
                        </button>
                      </div>
                    )}

                    {/* Nearby Stores List (shown if no store selected or changing) */}
                    {!preferredPostnetStore && formData.city && (
                      <div className="space-y-3 mt-4">
                        {postnetPreview.loading ? (
                          <div className="flex items-center justify-center p-6 bg-black/40 rounded-xl border border-white/5">
                            <Loader2 size={24} className="animate-spin text-[var(--color-gold)] mr-3" />
                            <span className="text-xs text-[var(--color-ivory-muted)]">Locating nearest PostNet branches...</span>
                          </div>
                        ) : postnetPreview.stores.length > 0 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2.5">
                              {(showAllPostnetBranches ? postnetPreview.stores : postnetPreview.stores.slice(0, 3)).map((store) => (
                                <div
                                  key={store.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-[var(--color-gold)]/50 transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-white">{store.name}</p>
                                      {store.distance !== null && (
                                        <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                                          📍 {store.distance} km away
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[var(--color-ivory-muted)] mt-0.5">{store.address}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handlePreferredPostnetStoreSelect(store)}
                                    className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-[var(--color-gold)] hover:text-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                                  >
                                    Select This Store
                                  </button>
                                </div>
                              ))}
                            </div>
                            {postnetPreview.stores.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setShowAllPostnetBranches(!showAllPostnetBranches)}
                                className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-[var(--color-gold)]/40 bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--color-gold)] flex items-center justify-center gap-2 transition-all mt-1"
                              >
                                {showAllPostnetBranches ? (
                                  <>
                                    <span>Show Fewer Branches</span>
                                    <ChevronUp size={14} />
                                  </>
                                ) : (
                                  <>
                                    <span>Show More Branches (+{postnetPreview.stores.length - 3} more)</span>
                                    <ChevronDown size={14} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--color-ivory-muted)] p-4 text-center">
                            Start typing your suburb or city above to list nearby PostNet stores.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 18+ Legal Age Verification Gate */}
                <div className="bg-[#0d0d0d] border border-amber-500/20 rounded-2xl p-4 md:p-5 flex items-start gap-3.5 shadow-lg">
                  <input
                    type="checkbox"
                    id="ageVerification"
                    checked={isAgeConfirmed}
                    onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-black/50 accent-[var(--color-gold)] focus:ring-[var(--color-gold)] cursor-pointer"
                    required
                  />
                  <label htmlFor="ageVerification" className="text-xs text-white/90 leading-relaxed cursor-pointer select-none">
                    <strong className="text-amber-400 font-semibold block sm:inline">Legal Age Verification (18+): </strong>
                    I certify that I am 18 years of age or older and legally authorized to purchase alcoholic beverages under South African liquor legislation.
                  </label>
                </div>

                {/* Continue to Step 2 Button */}
                <button
                  type="button"
                  onClick={handleProceedToDeliveryMethod}
                  disabled={quoteLoading}
                  className="w-full bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {quoteLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Calculating Rates...</>
                  ) : (
                    <>Continue to Delivery Method <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DELIVERY METHOD & ALCOHOL CONFIDENCE SECTION                    */}
            {/* ========================================================================= */}
            {checkoutStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif text-white mb-1">2. Delivery Method</h2>
                    <p className="text-xs text-[var(--color-ivory-muted)]">Choose your preferred shipping service level.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="text-xs text-[var(--color-gold)] uppercase font-bold tracking-wider hover:underline"
                  >
                    Edit Details
                  </button>
                </div>

                {/* Delivery Options Card */}
                <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium">Available Shipping Services</h3>

                  {quote?.shipments.map((shp, shpIndex) => (
                    <div key={shpIndex} className="space-y-3">
                      {quote.shipments.length > 1 && (
                        <p className="text-xs font-semibold text-[var(--color-gold)] flex items-center gap-2">
                          <Truck size={14} /> Shipment {shpIndex + 1}: {shp.vendorName}
                        </p>
                      )}

                      <div className="space-y-2.5">
                        {shp.shippingQuotes.map((opt, optIndex) => {
                          const isSelected = shp.selectedCourier?.serviceLevel === opt.serviceLevel;
                          return (
                            <label
                              key={optIndex}
                              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-[0_0_15px_rgba(212,175,55,0.08)]'
                                  : 'border-white/10 bg-black/40 hover:border-white/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`shipping-opt-${shpIndex}`}
                                  checked={isSelected}
                                  onChange={() => handleCourierSelect(shpIndex, opt)}
                                  className="accent-[var(--color-gold)] w-4 h-4"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-white">{opt.serviceLevel}</p>
                                  <p className="text-xs text-[var(--color-ivory-muted)] mt-0.5">
                                    Estimated delivery: {opt.estimatedDays}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-[var(--color-gold)] font-serif">
                                {opt.cost > 0 ? <Price amount={opt.cost} /> : 'FREE'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 🔒 THE CONFIDENCE SECTION (Alcohol Compliance & Security) */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#121212] to-[#0a0a0a] p-5 md:p-6 space-y-4 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        🔒 Secure & Insured Delivery
                      </h4>
                      <p className="text-xs text-[var(--color-ivory-muted)] mt-1 leading-relaxed">
                        Your luxury order is securely packaged and tracked from vendor vault to handover.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px] text-white/70">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Trackable delivery</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> SMS notifications</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Secure handling</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Direct handover</span>
                  </div>

                  {/* 18+ Legal Drinking Age Notice */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">18+ Alcohol Compliance Verification:</strong>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/80">
                        In accordance with South African liquor regulations, valid identification (National ID or Passport) must be presented upon courier delivery or PostNet branch collection.
                      </p>
                    </div>
                  </div>
                </div>

                {/* International Duties Notice if applicable */}
                {quote?.hasInternational && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle size={18} /> Important: International Customs & Duties
                    </h4>
                    <p className="text-xs text-rose-200/80 leading-relaxed">
                      Import duties and taxes are determined by the destination customs authority. Delivery charge covers transportation only.
                    </p>
                    <label className="flex items-center gap-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={dutiesAccepted}
                        onChange={(e) => setDutiesAccepted(e.target.checked)}
                        className="accent-rose-500 w-4 h-4 rounded"
                      />
                      <span className="text-xs font-medium text-white">I accept responsibility for destination import charges.</span>
                    </label>
                  </div>
                )}

                {/* Continue to Step 3 Button */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  Continue to Payment <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: PAYMENT & SUPER COINS REDEMPTION                                  */}
            {/* ========================================================================= */}
            {checkoutStep === 3 && (
              <form onSubmit={handlePlaceOrder} className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif text-white mb-1">3. Payment & Rewards</h2>
                    <p className="text-xs text-[var(--color-ivory-muted)]">Apply your Super Coins and choose your preferred payment method.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="text-xs text-[var(--color-gold)] uppercase font-bold tracking-wider hover:underline"
                  >
                    Edit Delivery
                  </button>
                </div>

                {/* ⭐ SUPER COINS REDEMPTION CARD */}
                {quote?.superCoins && quote.superCoins.availableCoins > 0 && (
                  <div className="bg-gradient-to-br from-[#161309] to-[#0d0d0d] border border-[var(--color-gold)]/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                          <Coins size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Grand Store Super Coins
                          </h3>
                          <p className="text-xs text-[var(--color-ivory-muted)]">
                            You have <strong className="text-[var(--color-gold)]">{quote.superCoins.availableCoins.toLocaleString()} Super Coins</strong> (Value: R{(quote.superCoins.availableCoins * quote.superCoins.coinValue).toFixed(2)})
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSuperCoins}
                          onChange={(e) => setUseSuperCoins(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-gold)]"></div>
                      </label>
                    </div>

                    {useSuperCoins && (
                      <div className="pt-3 border-t border-[var(--color-gold)]/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Margin-Safe Deduction: -R{quote.superCoins.maxDiscountRand.toFixed(2)} ({quote.superCoins.maxRedeemableCoins} coins)
                        </span>
                        {quote.superCoins.isMarginCapped && (
                          <span className="text-amber-300/90 text-[11px]">
                            {quote.superCoins.marginMessage}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy Referral Rewards if available */}
                {user?.rewardBalance > 0 && (
                  <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Apply Referral Credits</p>
                      <p className="text-[11px] text-[var(--color-ivory-muted)]">Available: <Price amount={user.rewardBalance} /></p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyRewards}
                        onChange={(e) => setApplyRewards(e.target.checked)}
                        className="accent-[var(--color-gold)] w-4 h-4 rounded"
                      />
                      <span className="text-xs text-white">Apply</span>
                    </label>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium">Choose Payment Method</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label
                      className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
                        paymentMethod === 'payfast'
                          ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                          : 'border-white/10 bg-black/40 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="payfast"
                        checked={paymentMethod === 'payfast'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between mb-3">
                        <CreditCard size={22} className="text-[var(--color-gold)]" />
                        {paymentMethod === 'payfast' && <CheckCircle2 size={16} className="text-[var(--color-gold)]" />}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">PayFast Instant</h4>
                      <p className="text-[11px] text-[var(--color-ivory-muted)]">Cards, Instant EFT, SnapScan, Zapper</p>
                    </label>

                    <label
                      className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                          : 'border-white/10 bg-black/40 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between mb-3">
                        <ShieldCheck size={22} className="text-[var(--color-gold)]" />
                        {paymentMethod === 'bank_transfer' && <CheckCircle2 size={16} className="text-[var(--color-gold)]" />}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">Direct Bank Transfer</h4>
                      <p className="text-[11px] text-[var(--color-ivory-muted)]">Manual EFT with deposit reference</p>
                    </label>
                  </div>

                  {paymentMethod === 'bank_transfer' && (
                    <div className="mt-4 animate-fadeIn">
                      <StoreBankDetailsCard
                        compact={true}
                        reference="ORDER-REF-ON-SUBMIT"
                        referenceLabel="Payment Reference"
                        title="Grand Store Settlement Account"
                        subtitle="EFT details will be designated with your unique order reference upon submission"
                        onNotify={onNotify}
                      />
                    </div>
                  )}
                </div>

                {/* Final Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !quote}
                  className="w-full bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-sm py-4 rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing Order...</>
                  ) : (
                    <>Pay <Price amount={displayedTotal} /> <ArrowRight size={18} /></>
                  )}
                </button>

                <SecurePaymentBadges />
                <PaymentForm paymentData={paymentData} payfastUrl={payfastUrl} />
              </form>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: BANK TRANSFER PROOF SUBMISSION (If EFT selected)                  */}
            {/* ========================================================================= */}
            {checkoutStep === 4 && (
              <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[var(--color-gold)]/20 shadow-2xl rounded-2xl p-6 md:p-10 text-center relative overflow-hidden animate-fadeIn">
                <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-gold)] text-black flex items-center justify-center mb-4">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-serif text-[var(--color-gold)] mb-2">Order Created Successfully!</h3>
                <p className="text-sm text-[var(--color-ivory-muted)] mb-6 max-w-md mx-auto">
                  Order <span className="text-white font-mono font-bold">{createdOrderId}</span> is awaiting payment. Please transfer exactly <strong className="text-white font-serif"><Price amount={displayedTotal} /></strong> to our official bank account.
                </p>

                <StoreBankDetailsCard
                  reference={createdOrderId?.slice(-6).toUpperCase()}
                  referenceLabel="Order Reference"
                  className="max-w-xl mx-auto mb-6"
                  onNotify={onNotify}
                />

                <form onSubmit={handleUploadProof} className="max-w-sm mx-auto text-left space-y-3">
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)]">
                    Proof of Payment URL (Image or PDF)
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    required
                    placeholder="https://..."
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={uploadingProof}
                    className="w-full bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    {uploadingProof ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : 'Submit Proof'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(user ? `/customer/order/${createdOrderId}` : `/order-success/${createdOrderId}`)}
                    className="w-full text-xs text-white/50 hover:text-white uppercase tracking-wider py-2 transition-colors"
                  >
                    {user ? 'I will upload later from My Orders' : 'View Order Confirmation'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

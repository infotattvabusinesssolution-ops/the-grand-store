import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Agentation } from 'agentation'
import VendorPortalPage from './vendor-portal/VendorPortalPage'
import TradePage from './TradePage'
import TradeLayout from './trade/TradeLayout'
import TradeAbout from './trade/TradeAbout'
import TradeExport from './trade/TradeExport'
import TradeProcedures from './trade/TradeProcedures'
import TradeContact from './trade/TradeContact'
import TradePartnerEnquiry from './trade/TradePartnerEnquiry'
import './trade/TradeProfessional.css'
import WineFarmPage from './features/wine-farm/WineFarmPage'
import Hero from './features/home/components/Hero'
import Arrivals from './features/home/components/Arrivals'
import WhiskyShowcase from './features/home/components/WhiskyShowcase'
import TastingCampaign from './features/home/components/TastingCampaign'
import TequilaShowcase from './features/home/components/TequilaShowcase'
import WineCategoryShowcase from './features/home/components/WineCategoryShowcase'
import BrandyShowcase from './features/home/components/BrandyShowcase'
import CategoryShowcase from './features/home/components/CategoryShowcase'
import PrivateCollection from './features/home/components/PrivateCollection'
import EventAdvertisements from './features/home/components/EventAdvertisements'
import AdvertisedProductsSection from './features/home/components/AdvertisedProductsSection'
import PartnerDestinations from './features/home/components/PartnerDestinations'
import WhyChooseUs from './features/home/components/WhyChooseUs'
import Testimonials from './features/home/components/Testimonials'
import LuxuryBannerSection from './features/home/components/LuxuryBannerSection'
import AuctionCampaign from './features/home/components/AuctionCampaign'
import AdminProducts from './features/admin/AdminProducts'
import AdminOrders from './features/admin/AdminOrders'
import AdminOrderDetail from './features/admin/AdminOrderDetail'
import LatestBlogs from './features/home/components/LatestBlogs'
import AppPromoSection from './features/home/components/AppPromoSection'
import DownloadAppRedirect from './pages/DownloadAppRedirect'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import SEO from './components/SEO'
import VendorApprovalPopup from './features/vendor/VendorApprovalPopup'
import SiteMotion from './components/SiteMotion'
import ProductCard from './components/ProductCard'
import ProductQuickView from './components/ProductQuickView'
import IconButton from './components/IconButton'
import AgeGate from './components/AgeGate'
import Header from './components/Header'
import StoreFront from './features/shop/StoreFront'
import ComparePage from './features/compare/ComparePage'
import CartPage from './features/cart/CartPage'
import ProductPage from './features/product/ProductPage'
import ShopPage from './features/shop/ShopPage'
import AuctionPage from './features/auction/AuctionPage'
import AuctionLotDetail from './features/auction/AuctionLotDetail'
import AuctionCheckout from './features/auction/AuctionCheckout'
import AuctionVipCheckout from './features/auction/AuctionVipCheckout'
import AuctionWinnerHomeAlert from './features/auction/components/AuctionWinnerHomeAlert'
import AdminAuctionPanel from './features/admin/AdminAuctionPanel'
import AdminEventsPanel from './features/admin/AdminEventsPanel'
import TastingPage from './features/tasting/TastingPage'
import PremiumLiquorsBlogPage from './features/blog/PremiumLiquorsBlogPage'
import BrandyBlogPage from './features/blog/BrandyBlogPage'
import WhiskeyBlogPage from './features/blog/WhiskeyBlogPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import VerifyEmail from './features/auth/VerifyEmail'
import ForgotPassword from './features/auth/ForgotPassword'
import ResetPassword from './features/auth/ResetPassword'
import ProfilePage from './features/customer/ProfilePage'
import CustomerBankDetails from './features/customer/CustomerBankDetails'
import CustomerCalendar from './features/customer/CustomerCalendar'
import ReferralsTab from './features/customer/ReferralsTab'
import CustomerOrdersPage from './features/customer/CustomerOrdersPage'
import SuperCoinsWallet from './features/customer/SuperCoinsWallet'
import UserAuctionDashboard from './features/customer/UserAuctionDashboard'
import CustomerLayout from './features/customer/CustomerLayout'
import OnboardingWizard from './features/vendor/OnboardingWizard'
import AuctionSubmission from './features/vendor/AuctionSubmission'
import VendorDashboard from './features/vendor/VendorDashboard'
import VendorProfile from './features/vendor/VendorProfile'
import AddProduct from './features/vendor/AddProduct'
import EventAdd from './features/vendor/EventAdd'
import VendorEvents from './features/vendor/VendorEvents'
import EventsHub from './features/events/EventsHub'
import EventDetails from './features/events/EventDetails'
import EventSuccessPage from './features/events/EventSuccessPage'
import NotFound from './pages/NotFound'
import MyTickets from './features/customer/MyTickets'
import VendorProducts from './features/vendor/VendorProducts'
import EditProduct from './features/vendor/EditProduct'
import VendorLayout from './features/vendor/VendorLayout'
import EventHostLayout from './features/hosting/EventHostLayout'
import EventHostDashboard from './features/hosting/EventHostDashboard'
import EventHostWallet from './features/hosting/EventHostWallet'
import AuctionHostLayout from './features/hosting/AuctionHostLayout'
import AuctionHostDashboard from './features/hosting/AuctionHostDashboard'
import AuctionHostWallet from './features/hosting/AuctionHostWallet'
import VendorStore from './features/vendor/VendorStore'
import EstateBuilder from './features/vendor/EstateBuilder'
import EstateDetail from './features/wine-farm/EstateDetail'
import EventAttendees from './features/vendor/EventAttendees'
import VendorInventory from './features/vendor/VendorInventory'
import VendorWallet from './features/vendor/VendorWallet'
import VendorBankDetails from './features/vendor/VendorBankDetails'
import VendorOrders from './features/vendor/VendorOrders'
import VendorShippingProfile from './features/vendor/VendorShippingProfile'
import AdminLoginPage from './features/admin/AdminLoginPage'
import AdminLayout from './features/admin/AdminLayout'
import AdminDashboard from './features/admin/AdminDashboard'
import AdminUsers from './features/admin/AdminUsers'
import AdminStaff from './features/admin/AdminStaff'
import AdminVendors from './features/admin/AdminVendors'
import AdminVendorDetail from './features/admin/AdminVendorDetail'
import AdminCoupons from './features/admin/AdminCoupons'
import AdminExpertReviews from './features/admin/AdminExpertReviews'
import AdminSettings from './features/admin/AdminSettings'
import AdminTestimonials from './features/admin/AdminTestimonials'
import AdminFinancials from './features/admin/AdminFinancials'
import AdminBankTransfers from './features/admin/AdminBankTransfers'
import AdminAccessories from './features/admin/AdminAccessories'
import AdminCategories from './features/admin/AdminCategories'
import AdminMarquees from './features/admin/AdminMarquees'
import AdminTradeEnquiries from './features/admin/AdminTradeEnquiries'
import AdminCigarEnquiries from './features/admin/AdminCigarEnquiries'
import AdminCigarEnquiryDetail from './features/admin/AdminCigarEnquiryDetail'
import AdminWineEnquiries from './features/admin/AdminWineEnquiries'
import AdminWineEnquiryDetail from './features/admin/AdminWineEnquiryDetail'
import AdminAttributes from './features/admin/AdminAttributes'
import AdminAdvertisementRequests from './features/admin/AdminAdvertisementRequests'
import AdminAdvertisementRequestDetail from './features/admin/AdminAdvertisementRequestDetail'
import AdminKycManagement from './features/admin/AdminKycManagement'
import AdvertisementFormPage from './features/advertisement/AdvertisementFormPage'
import AdvertisedProductDetail from './features/advertisement/AdvertisedProductDetail'
import AccessoriesPage from './features/shop/AccessoriesPage'
import VendorMarketing from './features/vendor/VendorMarketing'
import VendorAcademy from './features/vendor/VendorAcademy'
import AdminVendorAcademy from './features/admin/AdminVendorAcademy'
import CheckoutPage from './features/checkout/CheckoutPage'
import OrderSuccessPage from './features/checkout/OrderSuccessPage'
import GlobalWinesPage from './features/global/GlobalWinesPage'
import CountryPavilionPage from './features/global/CountryPavilionPage'
import BrandLandingPage from './features/shop/BrandLandingPage'
import VendorPaymentGate from './features/vendor/VendorPaymentGate'
import CommunityPage from './pages/CommunityPage'
import AboutPage from './pages/AboutPage'
import BlogsPage from './pages/BlogsPage'
import CocktailsPage from './pages/CocktailsPage'
import ContactUsPage from './pages/ContactUsPage'
import ReferEarnPage from './pages/ReferEarnPage'
import GlossaryPage from './pages/GlossaryPage'
import OffersPage from './pages/OffersPage'
import WinePairingTool from './features/tools/WinePairingTool'
import WhiskyFinder from './features/tools/WhiskyFinder'
import CollectionLandingPage from './features/shop/CollectionLandingPage'
import AdminGlossary from './features/admin/AdminGlossary'
import AdminNewsletter from './features/admin/AdminNewsletter'
import AdminChatbot from './features/admin/AdminChatbot'
import ChatbotWidget from './components/ChatbotWidget'

// Host Applications
import HostAuctionPage from "./features/hosting/HostAuctionPage";
import HostEventPage from "./features/hosting/HostEventPage";
import AdminHostApplications from "./features/admin/AdminHostApplications";

import TermsConditions from "./features/legal/TermsConditions";
import TermsOfService from "./features/legal/TermsOfService";
import PrivacyPolicy from "./features/legal/PrivacyPolicy";
import FAQPage from "./features/legal/FAQPage";

import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Camera,
  Gift,
  GitCompareArrows,
  Grid3X3,
  Heart,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  CalendarDays,
  MapPin,
  Wine,
  Truck,
  Trash2,
  UsersRound,
  X,
  ZoomIn,
} from "lucide-react";
import { brandyBrands, brands, menuCategories, tequilaBrands } from "./data";
import { useProducts } from "./context/ProductContext";
import WishlistPage from "./WishlistPage";
import { useWishlist } from "./wishlistContext";

gsap.registerPlugin(ScrollTrigger);

const homePageSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://grandstoreglobal.com/#website',
      'url': 'https://grandstoreglobal.com',
      'name': 'The Grand Store',
      'description': 'Premier Luxury Wines, Fine Spirits, Rare Whiskies & Estate Tastings Marketplace',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://grandstoreglobal.com/shop?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'Organization',
      '@id': 'https://grandstoreglobal.com/#organization',
      'name': 'The Grand Store',
      'url': 'https://grandstoreglobal.com',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://grandstoreglobal.com/assets/logo.png'
      },
      'sameAs': [
        'https://www.instagram.com/grandstoreglobal',
        'https://www.facebook.com/grandstoreglobal'
      ]
    }
  ]
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { wishlistCount, toggleWishlist } = useWishlist();
  const { products, loading } = useProducts();

  const [cartItems, setCartItems] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (products.length > 0 && !isInitialized) {
      try {
        const storedItems = JSON.parse(
          window.localStorage.getItem("grand-store-cart") || "[]",
        );
        setCartItems(
          storedItems
            .map((storedItem) => {
              const product = products.find(
                (item) =>
                  item.id === storedItem.id || item._id === storedItem.id,
              );
              if (!product) return null;
              return {
                ...product,
                quantity: Math.max(1, Number(storedItem.quantity) || 1),
                option:
                  storedItem.option || product.options?.[0] || "Pack of 1",
              };
            })
            .filter(Boolean),
        );

        const storedIds = JSON.parse(
          window.localStorage.getItem("grand-store-compare") || "[]",
        );
        setCompareItems(
          storedIds
            .map((id) =>
              products.find(
                (product) => product.id === id || product._id === id,
              ),
            )
            .filter(Boolean)
            .slice(0, 4),
        );
      } catch (e) {
        console.error("Error loading cart/compare from storage", e);
      }
      setIsInitialized(true);
    }
  }, [products, isInitialized]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(
      "grand-store-cart",
      JSON.stringify(
        cartItems.map((item) => ({
          id: item.id || item._id,
          quantity: item.quantity,
          option: item.option,
        })),
      ),
    );
  }, [cartItems, isInitialized]);
  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(
      "grand-store-compare",
      JSON.stringify(compareItems.map((product) => product.id || product._id)),
    );
  }, [compareItems, isInitialized]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const addToCart = (
    product,
    quantity = 1,
    option = product.options?.[0] || "Pack of 1",
    redirect = true
  ) => {
    setCartItems((items) => {
      const prodId = product.id || product._id;
      const existingItem = items.find(
        (item) => (item.id || item._id) === prodId && item.option === option,
      );
      if (existingItem) {
        return items.map((item) =>
          (item.id || item._id) === prodId && item.option === option
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...items, { ...product, quantity, option }];
    });
    showToast(
      `${quantity > 1 ? `${quantity} × ` : ""}${product.name} added to your bag`,
    );
    if (redirect) {
      navigate("/customer/cart");
    }
  };

  const updateCartQuantity = (productId, option, quantity) => {
    if (quantity < 1) {
      setCartItems((items) =>
        items.filter(
          (item) =>
            !((item.id || item._id) === productId && item.option === option),
        ),
      );
      return;
    }
    setCartItems((items) =>
      items.map((item) =>
        (item.id || item._id) === productId && item.option === option
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const removeFromCart = (product) => {
    const prodId = product.id || product._id;
    setCartItems((items) =>
      items.filter(
        (item) =>
          !((item.id || item._id) === prodId && item.option === product.option),
      ),
    );
    showToast(`${product.name} removed from your bag`);
  };

  const clearCart = () => {
    setCartItems([]);
    showToast("Your cart has been cleared");
  };

  const clearVendorCart = (vendorId) => {
    setCartItems((items) =>
      items.filter((item) => (item.storeId || item.vendorId) !== vendorId),
    );
  };

  const handleWishlist = (product) => {
    const added = toggleWishlist(product);
    showToast(
      `${product.name} ${added ? "saved to" : "removed from"} your wishlist`,
    );
  };

  const addToCompare = (product) => {
    if (compareItems.some((item) => item.id === product.id)) {
      showToast(`${product.name} is already in your comparison`);
      navigate("/customer/compare");
      return;
    }
    if (compareItems.length >= 4) {
      showToast(
        "Your comparison is full. Remove a bottle before adding another.",
      );
      navigate("/customer/compare");
      return;
    }
    setCompareItems((items) => [...items, product]);
    showToast(`${product.name} added to your comparison`);
    navigate("/customer/compare");
  };

  const removeFromCompare = (product) => {
    setCompareItems((items) => items.filter((item) => item.id !== product.id));
    showToast(`${product.name} removed from your comparison`);
  };

  const isTradeRoute = location.pathname.startsWith("/trade");
  const isWineFarmRoute =
    location.pathname.startsWith("/winefarm") ||
    location.pathname.startsWith("/wine-farm");
  const isDashboardRoute =
    location.pathname.startsWith("/customer") ||
    location.pathname.startsWith("/vendor") ||
    location.pathname.startsWith("/admin");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/verify-email" || location.pathname === "/forgot-password" || location.pathname.startsWith("/reset-password");
  const isEstateRoute = location.pathname.startsWith("/estate");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0907] flex items-center justify-center text-[#e1bd70]">
        Loading...
      </div>
    );
  }

  return (
    <div className="app">
      <AgeGate />
      <SiteMotion />
      {!isTradeRoute &&
        !isWineFarmRoute &&
        !isDashboardRoute &&
        !isAuthRoute &&
        !isEstateRoute && (
          <Header
            cartCount={cartCount}
            compareCount={compareItems.length}
            wishlistCount={wishlistCount}
            onBagClick={() => navigate("/customer/cart")}
            onCompareClick={() => navigate("/customer/compare")}
            onWishlistClick={() => navigate("/customer/wishlist")}
          />
        )}
      <Routes>
        <Route path="/winefarm/*" element={<WineFarmPage />} />
        <Route
          path="/wine-farm/*"
          element={<Navigate to="/winefarm" replace />}
        />
        <Route path="/vendor-portal" element={<VendorPortalPage />} />

        <Route path="/trade" element={<TradeLayout />}>
          <Route index element={<TradePage />} />
          <Route path="about-us" element={<TradeAbout />} />
          <Route path="trade-export" element={<TradeExport />} />
          <Route path="trade-procedures" element={<TradeProcedures />} />
          <Route path="contact-us" element={<TradeContact />} />
          <Route path="partner-enquiry" element={<TradePartnerEnquiry />} />
        </Route>

        <Route path="/app/download" element={<DownloadAppRedirect />} />

        <Route
          path="/"
          element={
            <main className="home-page">
              <SEO
                title="The Grand Store — Luxury Wines, Rare Spirits & Estate Tastings"
                description="Shop exceptional fine wines, rare single malt whiskies, premium spirits, and book private winery tastings from premier global estates."
                url="/"
                schema={homePageSchema}
              />
              <AuctionWinnerHomeAlert />
              <Hero />
              <Arrivals
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <WhiskyShowcase
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <TastingCampaign />
              <TequilaShowcase
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <WineCategoryShowcase />
              <BrandyShowcase
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <CategoryShowcase
                categoryId="Wine"
                title="Top Wine"
                eyebrow="Curated Selection"
                description="Discover our exquisite collection of fine wines from around the world."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <LuxuryBannerSection />
              <CategoryShowcase
                categoryId="Champagne"
                title="Top Champagne"
                eyebrow="Celebrate in Style"
                description="Elevate your moments with our premium selection of champagne."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <CategoryShowcase
                categoryId="Cognac"
                title="Top Cognac"
                eyebrow="Elegance in a Glass"
                description="Experience the rich, complex flavors of our top-tier cognacs."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <AuctionCampaign />
              <CategoryShowcase
                categoryId="Gin"
                title="Top Gin"
                eyebrow="Botanical Brilliance"
                description="Explore artisanal and classic gins perfect for any cocktail."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <CategoryShowcase
                categoryId="Liqueur"
                title="Top Liqueur"
                eyebrow="Sweet & Sophisticated"
                description="Indulge in our carefully selected sweet and herbal liqueurs."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <CategoryShowcase
                categoryId="Rum"
                title="Top Rum"
                eyebrow="Caribbean Spirit"
                description="Savor the deep, molasses-rich profiles of our finest rums."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <CategoryShowcase
                categoryId="Vodka"
                title="Top Vodka"
                eyebrow="Pure & Smooth"
                description="Discover ultra-premium vodkas crafted for ultimate clarity."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <CategoryShowcase
                categoryId="Ciders"
                title="Top Ciders"
                eyebrow="Crisp & Refreshing"
                description="Enjoy our handpicked selection of refreshing craft ciders."
                onAdd={addToCart}
                onWish={handleWishlist}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
              <AdvertisedProductsSection />
              <PrivateCollection />
              <EventAdvertisements />
              <PartnerDestinations />
              <WhyChooseUs />
              <Testimonials />
              <LatestBlogs />
              <AppPromoSection />
            </main>
          }
        />
        <Route
          path="/shop"
          element={
            <ShopPage
              onAdd={addToCart}
              onWish={handleWishlist}
              onCompare={addToCompare}
              compareItems={compareItems}
            />
          }
        />
        <Route
          path="/accessories"
          element={
            <AccessoriesPage
              onAdd={addToCart}
              onWish={handleWishlist}
              onCompare={addToCompare}
              compareItems={compareItems}
            />
          }
        />
        <Route path="/store/:storeId" element={<StoreFront />} />
        <Route
          path="/customer/cart"
          element={
            <CartPage
              cartItems={cartItems}
              onUpdateQuantity={updateCartQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              onNotify={showToast}
            />
          }
        />
        <Route
          path="/cart"
          element={<Navigate to="/customer/cart" replace />}
        />
        <Route
          path="/customer/checkout"
          element={
            <CheckoutPage
              cartItems={cartItems}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              onClearCart={clearCart}
              clearVendorCart={clearVendorCart}
              onNotify={showToast}
            />
          }
        />
        <Route
          path="/checkout"
          element={<Navigate to="/customer/checkout" replace />}
        />
        <Route
          path="/customer/order/:id"
          element={<OrderSuccessPage onClearCart={clearCart} />}
        />
        <Route
          path="/order-success/:id"
          element={<OrderSuccessPage onClearCart={clearCart} />}
        />
        <Route
          path="/orders/:id"
          element={<OrderSuccessPage onClearCart={clearCart} />}
        />
        <Route
          path="/customer/event-order/:id"
          element={<EventSuccessPage />}
        />
        <Route
          path="/events/booking-success/:id"
          element={<EventSuccessPage />}
        />
        <Route
          path="/customer/compare"
          element={
            <ComparePage
              compareItems={compareItems}
              onCompare={addToCompare}
              onRemove={removeFromCompare}
              onClear={() => {
                setCompareItems([]);
                showToast("Comparison cleared");
              }}
              onAdd={addToCart}
            />
          }
        />
        <Route
          path="/compare"
          element={<Navigate to="/customer/compare" replace />}
        />
        <Route
          path="/wishlist"
          element={<Navigate to="/customer/wishlist" replace />}
        />

        {/* Customer Profile & Related */}
        <Route element={<CustomerLayout />}>
          <Route path="/customer/profile" element={<ProfilePage />} />
          <Route path="/customer/calendar" element={<CustomerCalendar />} />
          <Route path="/customer/banking" element={<CustomerBankDetails />} />
          <Route path="/customer/referrals" element={<ReferralsTab />} />
          <Route path="/customer/orders" element={<CustomerOrdersPage />} />
          <Route path="/customer/super-coins" element={<SuperCoinsWallet />} />
          <Route path="/customer/auctions" element={<UserAuctionDashboard />} />
          <Route path="/customer/tickets" element={<MyTickets />} />
          <Route
            path="/customer/wishlist"
            element={
              <WishlistPage
                onAdd={addToCart}
                onCompare={addToCompare}
                compareItems={compareItems}
              />
            }
          />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Tools & Finders - Base & Deep-Linked SEO Routes */}
        <Route path="/tools/wine-pairing" element={<WinePairingTool onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />
        <Route path="/tools/wine-pairing/:mealType" element={<WinePairingTool onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />
        <Route path="/tools/whisky-finder" element={<WhiskyFinder onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />
        <Route path="/tools/whisky-finder/:flavorProfile" element={<WhiskyFinder onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />

        {/* Curated 'Best Of' Collections (Section 5 SEO) */}
        <Route path="/collections/:slug" element={<CollectionLandingPage onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />
        
        {/* Dedicated Brand & Distillery Landing Pages (Section 15 SEO) */}
        <Route path="/brand/:slug" element={<BrandLandingPage onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />
        <Route path="/brands/:slug" element={<BrandLandingPage onAdd={addToCart} onWish={handleWishlist} onCompare={addToCompare} compareItems={compareItems} />} />
        
        {/* Global Wines */}
        <Route path="/global-wines" element={<GlobalWinesPage />} />
        <Route
          path="/global-wines/:country"
          element={
            <CountryPavilionPage
              onAdd={addToCart}
              onWish={handleWishlist}
              onCompare={addToCompare}
              compareItems={compareItems}
            />
          }
        />

        {/* Vendor Management */}
        <Route path="/vendor/onboarding" element={<OnboardingWizard />} />
        <Route path="/vendor/payment" element={<VendorPaymentGate />} />

        <Route path="/vendor" element={<VendorLayout />}>
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="inventory" element={<VendorInventory />} />
          <Route path="wallet" element={<VendorWallet />} />
          <Route path="banking" element={<VendorBankDetails />} />
          <Route path="marketing" element={<VendorMarketing />} />
          <Route path="academy" element={<VendorAcademy />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="store" element={<VendorStore />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="shipping" element={<VendorShippingProfile />} />
          <Route
            path="product-add"
            element={<AddProduct onNotify={showToast} />}
          />
          <Route
            path="product-edit/:id"
            element={<EditProduct onNotify={showToast} />}
          />
          <Route path="estate-builder" element={<EstateBuilder />} />
          <Route path="events" element={<VendorEvents />} />
          <Route path="events/:id/attendees" element={<EventAttendees />} />
          <Route path="event-add" element={<EventAdd />} />
          <Route path="auction-submit" element={<AuctionSubmission onNotify={showToast} />} />
        </Route>

        {/* Public Host Application Forms */}
        <Route path="/host-auction" element={<HostAuctionPage />} />
        <Route path="/host-event" element={<HostEventPage />} />

        <Route path="/event-manager" element={<EventHostLayout />}>
          <Route path="dashboard" element={<EventHostDashboard />} />
          <Route path="wallet" element={<EventHostWallet />} />
          <Route path="events" element={<VendorEvents />} />
          <Route path="events/:id/attendees" element={<EventAttendees />} />
          <Route path="event-add" element={<EventAdd />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>

        <Route path="/auction-manager" element={<AuctionHostLayout />}>
          <Route path="dashboard" element={<AuctionHostDashboard />} />
          <Route path="wallet" element={<AuctionHostWallet />} />
          <Route path="inventory" element={<VendorInventory />} />
          <Route path="auction-submit" element={<AuctionSubmission onNotify={showToast} />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="marquees" element={<AdminMarquees />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="vendors/:id" element={<AdminVendorDetail />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="academy" element={<AdminVendorAcademy />} />
          <Route path="expert-reviews" element={<AdminExpertReviews />} />
          <Route path="accessories" element={<AdminAccessories />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="attributes" element={<AdminAttributes />} />
          <Route path="host-applications" element={<AdminHostApplications />} />
          <Route
            path="advertisement-requests"
            element={<AdminAdvertisementRequests />}
          />
          <Route
            path="advertisement-requests/:id"
            element={<AdminAdvertisementRequestDetail />}
          />
          <Route
            path="kyc-verifications"
            element={<AdminKycManagement onNotify={showToast} />}
          />
          <Route
            path="auctions"
            element={<AdminAuctionPanel onNotify={showToast} />}
          />
          <Route path="events" element={<AdminEventsPanel onNotify={showToast} />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="trade-enquiries" element={<AdminTradeEnquiries />} />
          <Route path="cigar-enquiries" element={<AdminCigarEnquiries />} />
          <Route path="cigar-enquiries/:id" element={<AdminCigarEnquiryDetail />} />
          <Route path="wine-enquiries" element={<AdminWineEnquiries />} />
          <Route path="wine-enquiries/:id" element={<AdminWineEnquiryDetail />} />
          <Route path="financials" element={<AdminFinancials />} />
          <Route path="bank-transfers" element={<AdminBankTransfers />} />
          <Route path="glossary" element={<AdminGlossary />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="chatbot" element={<AdminChatbot />} />
          <Route path="products" element={<AdminProducts />} />

          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail onNotify={showToast} />} />
          <Route
            path="product-add"
            element={<AddProduct onNotify={showToast} />}
          />
          <Route
            path="product-edit/:id"
            element={<EditProduct onNotify={showToast} />}
          />
        </Route>

        <Route path="/auction" element={<AuctionPage onNotify={showToast} />} />
        <Route path="/auctions" element={<Navigate to="/auction" replace />} />
        <Route
          path="/auction/:id"
          element={<AuctionLotDetail onNotify={showToast} />}
        />
        <Route
          path="/auction/lot/:id"
          element={<AuctionLotDetail onNotify={showToast} />}
        />
        <Route
          path="/auction/checkout/:id"
          element={<AuctionCheckout onNotify={showToast} />}
        />
        <Route
          path="/auction/vip-checkout"
          element={<AuctionVipCheckout onNotify={showToast} />}
        />
        <Route
          path="/customer/vip-checkout"
          element={<AuctionVipCheckout onNotify={showToast} />}
        />
        <Route
          path="/estate/:slug"
          element={<EstateDetail onNotify={showToast} />}
        />
        <Route
          path="/bookatasting"
          element={<TastingPage onNotify={showToast} />}
        />
        <Route path="/events" element={<EventsHub />} />
        <Route
          path="/events/:id"
          element={<EventDetails onNotify={showToast} onAdd={addToCart} />}
        />
        <Route path="/community" element={<CommunityPage />} />
        <Route
          path="/product/:slug"
          element={
            <ProductPage
              onAdd={addToCart}
              onWish={handleWishlist}
              onCompare={addToCompare}
              compareItems={compareItems}
              onNotify={showToast}
            />
          }
        />

        {/* Legal & Policies */}
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/advertise" element={<AdvertisementFormPage />} />
        <Route path="/discover/:id" element={<AdvertisedProductDetail />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/cocktail" element={<CocktailsPage />} />
        <Route
          path="/cocktails"
          element={<Navigate to="/cocktail" replace />}
        />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/refer-and-earn" element={<ReferEarnPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />

        <Route
          path="/blog/top-south-african-brandy-brands-you-can-order-online"
          element={<BrandyBlogPage />}
        />
        <Route
          path="/blog/top-10-must-try-premium-liquors-available-at-the-grand-store"
          element={<PremiumLiquorsBlogPage />}
        />
        <Route
          path="/blog/top-10-whiskey-brands-you-can-buy-online-in-south-africa"
          element={<WhiskeyBlogPage />}
        />
        <Route
          path="/blog/:slug"
          element={<Navigate to="/#journal" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        <ShoppingBag size={18} />
        {toast}
      </div>
      {!isTradeRoute && !isDashboardRoute && !isWineFarmRoute && (
        <>
          <Footer />
          {/* SocialRail removed */}
          <a
            className="whatsapp-float"
            href="https://wa.me/"
            aria-label="Chat with The Grand Store"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
        </>
      )}
      {!isAdminRoute && <ChatbotWidget />}
      <VendorApprovalPopup />
      <CookieConsent />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default App;




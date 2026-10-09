import React, { useState, useEffect, useRef } from "react";
import Price from '../components/ui/Price';
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  TrendingUp,
  Smartphone,
  CreditCard,
  Truck,
  Megaphone,
  Star,
  Hammer,
  Globe,
  BarChart3,
  Banknote,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Plus,
  Minus,
} from "lucide-react";

export default function VendorPortalPage() {
  const onboardingRoute = "/vendor/onboarding";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const previewRef = useRef(null);
  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // State for "Preview My Store"
  const [mockBusinessName, setMockBusinessName] = useState("Your Company");
  const [mockBanner, setMockBanner] = useState("");
  const [mockLogo, setMockLogo] = useState("");
  const [mockProducts, setMockProducts] = useState([]);

  // State for Accordion FAQs
  const [openFaq, setOpenFaq] = useState(null);

  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdImage, setNewProdImage] = useState("");

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = () => {
    if (newProdName && newProdPrice) {
      setMockProducts([
        { id: Date.now(), name: newProdName, price: newProdPrice, image: newProdImage },
        ...mockProducts,
      ]);
      setNewProdName("");
      setNewProdPrice("");
      setNewProdImage("");
    }
  };

  const portalFeatures = [
    {
      title: "Dashboard",
      desc: "Brings together all the data you need to plan and fulfill your upcoming orders",
      icon: BarChart3,
    },
    { title: "Account", desc: "Manage your payments.", icon: Banknote },
    { title: "Stock", desc: "Different product Categories", icon: ShoppingBag },
    {
      title: "Data",
      desc: "Make sure you stay informed about your customer ordering patterns etc.",
      icon: TrendingUp,
    },
    { title: "Sales", desc: "Manage your sales.", icon: CreditCard },
    {
      title: "Orders",
      desc: "Manage all your Orders from start to finish.",
      icon: CheckCircle2,
    },
    {
      title: "Inventory Management",
      desc: "A robust inventory management system to track stock levels accurately.",
      icon: Hammer,
    },
    {
      title: "Shipping Management",
      desc: "Integrate with shipping carriers to offer a range of shipping options.",
      icon: Truck,
    },
  ];

  const faqs = [
    "How do I sign up as a vendor on your online liquor website?",
    "What are the requirements for becoming a vendor on your platform?",
    "Is there a registration fee or any other charges for joining your platform as a vendor?",
    "How do I list my products on your website?",
    "How does the payment process work for vendors on your platform?",
    "What shipping options are available for vendors on your platform?",
    "How do I track and manage my orders?",
    "What support and resources are available to vendors on your platform?",
    "How are taxes handled for vendors on your platform?",
    "Can I sell my products internationally on your platform?",
    "What are the commission rates for vendors on your platform?",
    "How long does it take for my vendor account to be approved?",
  ];

  // Reusable solid gold text
  const goldTextClass =
    "text-[#c9a35b] px-4";

  // Reusable solid gold button
  const goldButtonClass =
    "bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-xs px-10 py-5 hover:bg-[#e1bd70] transition-colors";

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      <Link 
        to="/" 
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-[#c9a35b] hover:bg-[#e1bd70] text-black !text-black rounded-full shadow-[0_4px_20px_rgba(201,163,91,0.4)] transition-all duration-300 font-bold uppercase tracking-widest text-xs"
        title="Back to Home"
      >
        <ChevronLeft size={16} />
        Back to Home
      </Link>
      {/* 1. DYNAMIC HERO SECTION (Full Bleed Image) */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src="/assets/vendor/premium-bar.png"
          alt="Premium Bar"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 flex flex-col items-center text-center">
          <div className="max-w-4xl flex flex-col items-center">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif text-white mb-4 leading-tight">
              Elevate Your <br />
              <span className={goldTextClass} >
                Brand
              </span>
            </h1>
            <p className="text-gray-300 mb-10 text-lg leading-relaxed max-w-2xl">
              Welcome to the world of spirits! Our online liquor store is the
              ultimate destination for spirits enthusiasts looking for a variety
              of high-quality products from around the world.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link to={onboardingRoute} className={goldButtonClass}>
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ALTERNATING BLOCK 1: SUPPLIER COLLABORATION */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="/assets/vendor/supplier-action.png"
              alt="Supplier Collaboration"
              className="w-full h-auto max-h-[600px] object-cover shadow-lg"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-5xl md:text-6xl font-serif text-black mb-6 leading-tight">
              A Global <br />
              <span
                
                className={`text-6xl md:text-7xl ${goldTextClass}`}
              >
                Platform
              </span>
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6 text-lg">
              We are thrilled to invite suppliers like you to join our online
              store and reach out to a vast market of customers. Partnering with
              us is an opportunity to showcase your products on a global
              platform and reach a wider audience than ever before.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              Our online store is a hub for customers from all corners of the
              world, and our easy-to-use platform makes it seamless for you to
              manage your products, inventory, and orders with ease.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ALTERNATING BLOCK 2: REACH YOUR CUSTOMERS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-5xl md:text-6xl font-serif text-black mb-6 leading-tight">
              Reach Your <br />
              <span
                
                className={`text-6xl md:text-7xl ${goldTextClass}`}
              >
                Customers
              </span>
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6 text-lg">
              The Grand Store brings together an array of liquor brands for
              customers to choose from. Give your brand exposure to a host of
              potential customers by listing and selling your products on
              grandstore.co.za.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              We facilitate the marketing and sale of the products, take care of
              all the logistics and shipping (should you require) and retain a
              percentage of the sale price. We are confident that with our
              partnership, we can achieve great success in the world of spirits.
            </p>
          </div>
          <div>
            <img
              src="/assets/vendor/warehouse-scale.png"
              alt="Warehouse Scale"
              className="w-full h-auto max-h-[600px] object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* 4. OVERSIZED ICON GRID: THE GRAND STORE PORTAL */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-serif mb-4 text-black">
              The Vendor Portal
            </h2>
            <p className="text-gray-500 text-lg">
              Manage your Products, Stock, Pricing and Orders using the
              Grandstore Seller Portal online platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {portalFeatures.map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                  <f.icon
                    className="text-[#c9a35b]"
                    strokeWidth={1}
                    size={36}
                  />
                </div>
                <h4 className="text-lg font-bold uppercase tracking-wider text-black mb-3">
                  {f.title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PREVIEW MY STORE */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-serif mb-4 text-black leading-tight">
              Preview Your <br />
              <span
                
                className={`text-6xl md:text-7xl ${goldTextClass}`}
              >
                Store
              </span>
            </h2>
            <p className="text-gray-500 text-lg">
              Enter your details below to see exactly what your customers will
              see.
            </p>
          </div>

          <div className="flex flex-col gap-16 items-center">
            {/* Input Form - Light Theme */}
            <div className="space-y-6 w-full max-w-4xl flex flex-col md:flex-row gap-6">
              <div className="bg-gray-50 p-6 border border-gray-100 shadow-sm flex-1">
                <h4 className="font-serif text-2xl mb-4">Store Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                      Business / Estate Name
                    </label>
                    <input
                      type="text"
                      value={mockBusinessName}
                      onChange={(e) => setMockBusinessName(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-black p-3 focus:border-[#c9a35b] outline-none text-sm"
                      placeholder="e.g. ABC Wine Estate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                      Store Banner
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 bg-white p-3 text-gray-500 hover:text-[#c9a35b] hover:border-[#c9a35b] cursor-pointer text-xs">
                      <ImageIcon size={14} />
                      <span>{mockBanner ? "Change Banner" : "Upload Banner Image"}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setMockBanner)} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                      Brand Logo
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 bg-white p-3 text-gray-500 hover:text-[#c9a35b] hover:border-[#c9a35b] cursor-pointer text-xs">
                      <ImageIcon size={14} />
                      <span>{mockLogo ? "Change Logo" : "Upload Logo Image"}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setMockLogo)} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border border-gray-100 shadow-sm flex-1 flex flex-col">
                <h4 className="font-serif text-2xl mb-4">Add Products</h4>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-black p-3 focus:border-[#c9a35b] outline-none text-sm"
                      placeholder="e.g. Cabernet Sauvignon"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                      Price (ZAR)
                    </label>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-black p-3 focus:border-[#c9a35b] outline-none text-sm"
                      placeholder="e.g. 295"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                      Product Image
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 bg-white p-3 text-gray-500 hover:text-[#c9a35b] hover:border-[#c9a35b] cursor-pointer text-xs">
                      <ImageIcon size={14} />
                      <span>{newProdImage ? "Change Image" : "Upload Product Image"}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewProdImage)} className="hidden" />
                    </label>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="flex-1 bg-[#c9a35b] text-white font-bold uppercase tracking-widest text-xs py-3 transition-colors"
                    >
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={scrollToPreview}
                      className="flex-1 bg-white border-2 border-black text-black font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-gray-100 transition-colors"
                    >
                      Preview Store
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Storefront Preview (Desktop & Mobile Frames) */}
            <div ref={previewRef} className="w-full max-w-6xl flex flex-col xl:flex-row gap-12 items-center xl:items-start justify-center min-h-[500px] pt-8">
              
              {/* Desktop Frame */}
              <div className="relative w-full max-w-[800px] xl:max-w-[700px] bg-white border-[12px] border-gray-900 rounded-[20px] shadow-2xl overflow-hidden aspect-[16/10] shrink-0">
                {/* Top browser bar mock */}
                <div className="w-full h-6 bg-gray-900/10 flex items-center px-3 gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
                {/* Store Content Mock */}
                <div className="w-full h-full bg-[#050505] overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
                  {/* Banner */}
                  <div className="h-[200px] w-full bg-[#111] relative shrink-0">
                    {mockBanner && (
                      <img src={mockBanner} className="w-full h-full object-cover opacity-70" alt="Banner" />
                    )}
                    <div className="absolute inset-0 bg-black/45"></div>
                  </div>
                  {/* Store Header */}
                  <div className="flex px-10 -mt-16 relative z-10 items-end gap-6 mb-8 shrink-0">
                    <div className="w-28 h-28 rounded-full border-4 border-[#050505] bg-white overflow-hidden shadow-2xl shrink-0 flex items-center justify-center">
                       {mockLogo ? (
                         <img src={mockLogo} className="w-full h-full object-cover" alt="Logo" />
                       ) : (
                         <span className="text-gray-400 font-bold text-3xl">{mockBusinessName ? mockBusinessName.charAt(0) : "S"}</span>
                       )}
                    </div>
                    <div className="pb-2">
                      <h3 className="text-3xl font-serif text-white flex items-center gap-3 mb-1">
                        {mockBusinessName || "Your Estate Name"}
                        <CheckCircle2 size={18} className="text-[#c9a35b]" />
                      </h3>
                      <p className="text-xs text-[#a39c8e] uppercase tracking-widest font-bold">Official Grand Store Partner</p>
                    </div>
                  </div>
                  {/* Products Grid Mock */}
                  <div className="px-10 flex-1 pb-10">
                    <div className="w-full border-b border-white/10 pb-3 mb-6 flex justify-between items-end">
                      <span className="text-sm font-bold uppercase tracking-widest text-[#c9a35b]">Boutique Collection</span>
                      <span className="text-xs text-gray-500">{mockProducts.length} Items</span>
                    </div>
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                      {mockProducts.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[#a39c8e] text-xs italic font-serif">
                          Your products will appear here.
                        </div>
                      ) : (
                        mockProducts.map((p) => (
                          <div key={p.id} className="bg-[#0a0a0a] border border-white/5 p-3 rounded group hover:border-[#c9a35b]/50 transition-colors">
                            <div className="aspect-[4/5] bg-white/5 mb-3 flex items-center justify-center overflow-hidden">
                               {p.image ? (
                                 <img src={p.image} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" alt="Product" />
                               ) : (
                                 <ImageIcon size={24} className="text-white/20" />
                               )}
                            </div>
                            <p className="text-white text-xs font-serif truncate mb-1">{p.name}</p>
                            <p className="text-[#c9a35b] text-xs font-bold tracking-wider"><Price amount={p.price} /></p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Frame */}
              <div className="relative w-[280px] h-[550px] bg-white border-[14px] border-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden shrink-0">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-xl w-32 mx-auto z-50"></div>
                
                {/* Store Content Mock */}
                <div className="w-full h-full bg-[#050505] overflow-y-auto overflow-x-hidden flex flex-col pt-6 custom-scrollbar">
                  {/* Banner */}
                  <div className="h-[140px] w-full bg-[#111] relative shrink-0">
                    {mockBanner && (
                      <img src={mockBanner} className="w-full h-full object-cover opacity-70" alt="Banner" />
                    )}
                    <div className="absolute inset-0 bg-black/45"></div>
                  </div>
                  {/* Store Header */}
                  <div className="flex flex-col items-center px-4 -mt-12 relative z-10 text-center shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-[#050505] bg-white overflow-hidden shadow-2xl mb-3 flex items-center justify-center">
                       {mockLogo ? (
                         <img src={mockLogo} className="w-full h-full object-cover" alt="Logo" />
                       ) : (
                         <span className="text-gray-400 font-bold text-2xl">{mockBusinessName ? mockBusinessName.charAt(0) : "S"}</span>
                       )}
                    </div>
                    <h3 className="text-2xl font-serif text-white flex items-center justify-center gap-2 mb-1">
                      {mockBusinessName || "Your Estate Name"}
                      <CheckCircle2 size={16} className="text-[#c9a35b]" />
                    </h3>
                    <p className="text-[9px] text-[#a39c8e] uppercase tracking-widest font-bold">Official Grand Store Partner</p>
                  </div>
                  {/* Products Grid Mock */}
                  <div className="px-4 mt-6 flex-1 pb-10">
                    <div className="w-full border-b border-white/10 pb-2 mb-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a35b]">Boutique Collection</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {mockProducts.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[#a39c8e] text-[10px] italic font-serif">
                          Your products will appear here.
                        </div>
                      ) : (
                        mockProducts.map((p) => (
                          <div key={p.id} className="bg-[#0a0a0a] border border-white/5 p-2 rounded">
                            <div className="aspect-[4/5] bg-white/5 mb-2 flex items-center justify-center overflow-hidden">
                               {p.image ? (
                                 <img src={p.image} className="w-full h-full object-contain p-2" alt="Product" />
                               ) : (
                                 <ImageIcon size={16} className="text-white/20" />
                               )}
                            </div>
                            <p className="text-white text-[9px] font-serif truncate mb-1">{p.name}</p>
                            <p className="text-[#c9a35b] text-[9px] font-bold"><Price amount={p.price} /></p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INFO CARDS & PRICING */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-50 p-10 border-t-4 border-black">
            <h3 className="text-2xl font-serif text-black mb-4">
              Eligible Categories
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The Grand Store features all liquor beverages including wine,
              spirits and beer. We are also able to feature certain liquor
              related products such as promotional items.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We are dedicated to working closely with our third-party vendors
              and we will endeavour to respond to all queries within 48 hours.
            </p>
          </div>

          <div className="bg-gray-50 p-10 border-t-4 border-[#c9a35b]">
            <h3 className="text-2xl font-serif text-black mb-4">
              Pricing & Payment
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Pricing decisions are made in collaboration with third-party
              vendors and we will advise when adjustments are recommended based
              on promotional deal opportunities.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Vendors will be paid the settlement fee within 30 days. The
              settlement fee is the price paid by the customer less any shipping
              costs and transaction fees.
            </p>
          </div>

          <div className="bg-gray-50 p-10 border-t-4 border-black">
            <h3 className="text-2xl font-serif text-black mb-4">
              Premium Deliveries
            </h3>
            <div className="mb-4">
              <img
                src="/assets/vendor/premium-delivery.png"
                alt="Premium Delivery"
                className="w-full h-32 object-cover"
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Since The Grand Store is committed to service excellence, we are
              able to handle the delivery process from start to finish.
            </p>
          </div>
        </div>

        {/* Commercial Model Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-200">
          <div className="p-10 md:p-14 bg-white">
            <h3 className="text-3xl font-serif text-black mb-2">
              Membership Charges
            </h3>
            <p className="text-gray-500 mb-8">
              No hidden fees. You remain the seller of your products.
            </p>

            <div className="space-y-6 mb-8 text-lg">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-sm uppercase tracking-widest font-semibold text-gray-700">
                  Once-off Registration
                </span>
                <span className="font-serif font-bold text-black"><Price amount={2500} /></span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-sm uppercase tracking-widest font-semibold text-gray-700">
                  Monthly Platform Fee
                </span>
                <span className="font-serif font-bold text-black"><Price amount={500} /></span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-sm uppercase tracking-widest font-semibold text-gray-700">
                  Commission per sale
                </span>
                <span className="font-serif font-bold text-[#c9a35b]">15%</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest leading-relaxed flex gap-2">
              <CheckCircle2 size={16} className="text-[#c9a35b] shrink-0" />
              Secure payment processing system.
            </p>
          </div>

          <div className="p-10 md:p-14 bg-black text-white">
            <h3 className="text-3xl font-serif text-white mb-2">
              Vendor Launch Pack
            </h3>
            <p className="text-[#918a7f] mb-8">
              Included free when you join to ensure a powerful start.
            </p>

            <ul className="space-y-4">
              {[
                "Account Verification & Setup Assistance",
                "Product listing & SEO guidance",
                "Store banner & photography guide",
                "Social media 'New Vendor' announcement",
                "Official Grand Store Vendor Badge",
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-gray-300">
                  <CheckCircle2
                    size={24}
                    className="text-[#c9a35b] shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7. ACCORDION FAQ */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-16 border-t border-gray-100">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-serif mb-4 text-black leading-tight">
            Frequently Asked <br />
            <span
              
              className={`text-6xl md:text-7xl ${goldTextClass}`}
            >
              Questions
            </span>
          </h2>
          <p className="text-gray-500 text-lg">
            Everything you need to know about partnering with us.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((q, idx) => (
            <div key={idx} className="border border-gray-200">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 text-left"
              >
                <span className="font-semibold text-black">{q}</span>
                {openFaq === idx ? (
                  <Minus className="text-[#c9a35b]" size={20} />
                ) : (
                  <Plus className="text-gray-400" size={20} />
                )}
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 bg-white text-gray-600 border-t border-gray-100">
                  Our team will gladly assist you with this query during the
                  onboarding process. Please contact support for specific
                  details.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. CTA & FOOTER NOTE */}
      <section className="bg-gray-50 py-16 text-center px-4">
        <h2 className="text-5xl md:text-6xl font-serif mb-6 text-black leading-tight">
          Ready to <br />
          <span
            
            className={`text-7xl md:text-8xl ${goldTextClass}`}
          >
            Launch?
          </span>
        </h2>
        <p className="text-gray-500 mb-8 text-xl max-w-2xl mx-auto">
          Begin the vendor registration process today and showcase your
          high-quality products to a global audience.
        </p>
        <div className="flex justify-center mb-12">
          <Link
            to={onboardingRoute}
            className={`inline-flex items-center justify-center gap-3 ${goldButtonClass}`}
          >
            Vendor Sign-Up <ChevronRight size={20} />
          </Link>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Copyright © The Grand Store. All Rights Reserved
        </p>
      </section>
    </main>
  );
}

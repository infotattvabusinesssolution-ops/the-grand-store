import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../../components/ProductCard";
import { useLocation } from "react-router-dom";
import { accessoryCategories } from "../../data";

export default function AccessoriesPage({
  onAdd,
  onWish,
  onCompare,
  compareItems = [],
}) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "All";
  const initialSubcategory = queryParams.get("subcategory") || "";

  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAccessories = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/products?type=accessory`,
        );
        setAccessories(res.data);
      } catch (err) {
        console.error("Error fetching accessories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccessories();
  }, []);

  useEffect(() => {
    if (queryParams.get("category")) {
      setActiveTab(queryParams.get("category"));
    }
    if (queryParams.get("subcategory")) {
      setActiveSubcategory(queryParams.get("subcategory"));
    } else {
      setActiveSubcategory("");
    }
  }, [location.search]);

  // Reset subcategory when tab changes
  useEffect(() => {
    if (activeTab !== queryParams.get("category")) {
      setActiveSubcategory("");
    }
  }, [activeTab]);

  const goldText = "text-[#c9a35b] font-serif";

  const filteredAccessories = accessories.filter((item) => {
    let match = true;
    if (activeTab !== "All") {
      match = match && item.category?.toLowerCase() === activeTab.toLowerCase();
    }
    if (activeSubcategory) {
      match = match && item.subcategory?.toLowerCase() === activeSubcategory.toLowerCase();
    }
    return match;
  });

  return (
    <div className="bg-[#050505] min-h-screen text-[var(--color-ivory)] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-serif mb-6 tracking-tight">
          Fine <span className={goldText}>Glassware</span> and Accessories
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-ivory-muted)] max-w-2xl mx-auto font-light leading-relaxed">
          Elevate your tasting experience with our curated selection of premium
          glassware, from elegant flutes to sophisticated tumblers.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button
          onClick={() => setActiveTab("All")}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
            activeTab === "All"
              ? "bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.4)]"
              : "bg-transparent text-[#e6c97a] border border-[#b58b38]/50 hover:bg-[#c9a35b]/10 hover:border-[#c9a35b]"
          }`}
        >
          All
        </button>
        {Object.keys(accessoryCategories).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
              activeTab === cat
                ? "bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.4)]"
                : "bg-transparent text-[#e6c97a] border border-[#b58b38]/50 hover:bg-[#c9a35b]/10 hover:border-[#c9a35b]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Subcategory Pills */}
      {activeTab !== "All" && accessoryCategories[activeTab] && (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {accessoryCategories[activeTab].map((subcat) => (
            <button
              key={subcat}
              onClick={() => setActiveSubcategory(activeSubcategory === subcat ? "" : subcat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                activeSubcategory === subcat
                  ? "bg-[#e6c97a] text-black"
                  : "bg-transparent text-[#a3a3a3] border border-[#a3a3a3]/30 hover:text-white hover:border-white/60"
              }`}
            >
              {subcat}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-[var(--color-ivory-muted)] animate-pulse">
            Curating accessories...
          </div>
        ) : accessories.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-ivory-muted)]">
            No accessories found at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredAccessories.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={onAdd}
                onWish={onWish}
                onCompare={onCompare}
                compareItems={compareItems}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useProducts } from "../../context/ProductContext";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Grid3X3, X, ChevronDown } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import FilterGroup from "./FilterGroup";
import Price from "../../components/ui/Price";
import { getCountryDisplayName } from "../../utils/countryHelpers";

const isVisibleFilterValue = (value) =>
  typeof value === "string" &&
  value.trim() &&
  !["undefined", "null"].includes(value.trim().toLowerCase());

const getFilterOptions = (products, key) => [
  ...new Set(
    products
      .map((product) => product[key])
      .filter(isVisibleFilterValue)
      .map((value) => value.trim()),
  ),
];

const getProductCategory = (p) => p.category || p.type || "Wine & spirits";

export default function ShopPage({ onAdd, onWish, onCompare, compareItems }) {
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  useEffect(() => {
    document.title = "Shop the Collection — The Grand Store";
    window.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      document.title = "The Grand Store — Luxury Wines & Spirits";
    };
  }, []);

  const [productOrder, setProductOrder] = useState({});
  const [visibleCount, setVisibleCount] = useState(12);

  // Initialize a random order for products so they shuffle on mount
  useEffect(() => {
    if (products.length > 0 && Object.keys(productOrder).length === 0) {
      const order = {};
      products.forEach((p) => {
        order[p.id || p._id] = Math.random();
      });
      setProductOrder(order);
    }
  }, [products]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [searchParams, minPrice, maxPriceInput, sortBy]);

  const selectedCategories = searchParams
    .getAll("category")
    .filter(isVisibleFilterValue);
  const selectedSubcategories = searchParams
    .getAll("subcategory")
    .filter(isVisibleFilterValue);
  const selectedStyles = searchParams
    .getAll("style")
    .filter(isVisibleFilterValue);
  const selectedBrands = searchParams
    .getAll("brand")
    .filter(isVisibleFilterValue);
  const selectedCountries = searchParams
    .getAll("country")
    .filter(isVisibleFilterValue);
  const selectedSizes = searchParams
    .getAll("size")
    .filter(isVisibleFilterValue);
  const shopProducts = products.filter(
    (product) => product.type !== "accessory",
  );

  const categoryOptions = [
    ...new Set(
      shopProducts
        .map(getProductCategory)
        .filter(isVisibleFilterValue)
        .map((v) => v.trim()),
    ),
  ];

  const productsForCountries =
    selectedCategories.length > 0
      ? shopProducts.filter((p) =>
          selectedCategories.includes(getProductCategory(p)),
        )
      : shopProducts;

  const countryOptions = getFilterOptions(productsForCountries, "country");

  const productsForSubcategories =
    selectedCountries.length > 0
      ? productsForCountries.filter((p) =>
          selectedCountries.includes(p.country),
        )
      : productsForCountries;

  const subcategoryOptions = getFilterOptions(productsForSubcategories, "subcategory");

  const productsForBrands =
    selectedSubcategories.length > 0
      ? productsForSubcategories.filter((p) =>
          selectedSubcategories.includes(p.subcategory),
        )
      : productsForSubcategories;

  const brandOptions = getFilterOptions(productsForBrands, "brand");

  const sizeOptions = getFilterOptions(shopProducts, "size");

  const toggleFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    const values = nextParams.getAll(key);
    nextParams.delete(key);
    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    nextValues.forEach((item) => nextParams.append(key, item));
    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setSearchParams({});
    setMinPrice("");
    setMaxPriceInput("");
    setMobileFiltersOpen(false);
  };

  const priceValue = (product) =>
    Number(product.price.toString().replace(/[^0-9.]/g, ""));
  const maxPrice =
    shopProducts.length > 0
      ? Math.max(3000, ...shopProducts.map(priceValue))
      : 3000;

  const minP = minPrice ? Number(minPrice) : 0;
  const maxP = maxPriceInput ? Number(maxPriceInput) : maxPrice;

  const WINE_STYLES = {
    Red: ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Shiraz / Syrah', 'Malbec', 'Tempranillo', 'Zinfandel', 'Rhone Blend', 'Grenache'],
    White: ['Chardonnay', 'Chenin Blanc', 'Sauvignon Blanc', 'Riesling', 'White Blend'],
    Sparkling: ['Cava', 'Prosecco', 'General Sparkling Wine', 'Non-Alcoholic Sparkling White Wine Alternative', 'Non-Alcoholic Sparkling Red Wine', 'Champagne'],
    Rose: ['Rosé', 'Non-Alcoholic Rosé Wine'],
    Fortified: ['Port', 'Sherry', 'Madeira', 'Vermouth', 'Late Harvest Wine', 'Ice Wine', 'Sauternes', 'Moscato']
  };

  let filteredProducts = shopProducts.filter((product) => {
    const matchesStyle = selectedStyles.length === 0 || selectedStyles.some(style => WINE_STYLES[style]?.includes(product.subcategory));
    return (
      (!selectedCategories.length ||
        selectedCategories.includes(getProductCategory(product))) &&
      matchesStyle &&
      (!selectedSubcategories.length || selectedSubcategories.includes(product.subcategory)) &&
      (!selectedBrands.length || selectedBrands.includes(product.brand)) &&
      (!selectedCountries.length || selectedCountries.includes(product.country)) &&
      (!selectedSizes.length || selectedSizes.includes(product.size)) &&
      priceValue(product) >= minP &&
      priceValue(product) <= maxP
    );
  });

  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return priceValue(a) - priceValue(b);
    if (sortBy === "price-high") return priceValue(b) - priceValue(a);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    // Default featured sort uses the randomized order
    const orderA = productOrder[a.id || a._id] || 0;
    const orderB = productOrder[b.id || b._id] || 0;
    return orderA - orderB;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const isPriceFiltered =
    (minPrice !== "" && Number(minPrice) > 0) ||
    (maxPriceInput !== "" && Number(maxPriceInput) < maxPrice);
  const activeFilterCount =
    selectedCategories.length +
    selectedSubcategories.length +
    selectedBrands.length +
    selectedCountries.length +
    selectedSizes.length +
    (isPriceFiltered ? 1 : 0);

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans pb-24">
      {/* Main Catalog Section */}
      <section className="w-full px-4 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Mobile Filter Overlay & Sidebar */}
          <div
            className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${mobileFiltersOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setMobileFiltersOpen(false)}
          />

          <aside
            className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-[#0a0a0a] border-r border-white/10 z-50 p-6 lg:p-0 lg:pb-12 overflow-y-auto transition-transform duration-300 custom-scrollbar lg:sticky lg:top-8 lg:h-[calc(100vh-2rem)] lg:w-1/5 lg:bg-transparent lg:border-none lg:z-10 ${mobileFiltersOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          >
            {/* Unified filter header - works on both mobile and desktop */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3 text-white font-bold tracking-[0.2em] text-sm uppercase">
                <SlidersHorizontal size={18} className="text-[#d4af37]" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-gradient-to-r from-[#d4af37] to-[#aa8022] text-black px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[#d4af37] text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="lg:hidden text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-8 pb-16">
              <FilterGroup
                title="Category"
                options={categoryOptions}
                selectedValues={selectedCategories}
                onToggle={(value) => toggleFilter("category", value)}
              />
              {selectedCategories.length > 0 && (
                <FilterGroup
                  title="Country"
                  options={countryOptions}
                  selectedValues={selectedCountries}
                  onToggle={(value) => toggleFilter("country", value)}
                  formatLabel={(country) => getCountryDisplayName(country, selectedCategories[0])}
                />
              )}
              {selectedCountries.length > 0 && (
                <FilterGroup
                  title="Subcategory"
                  options={subcategoryOptions}
                  selectedValues={selectedSubcategories}
                  onToggle={(value) => toggleFilter("subcategory", value)}
                />
              )}
              {selectedSubcategories.length > 0 && (
                <FilterGroup
                  title="Brand"
                  options={brandOptions}
                  selectedValues={selectedBrands}
                  onToggle={(value) => toggleFilter("brand", value)}
                />
              )}
              <FilterGroup
                title="Bottle size"
                options={sizeOptions}
                selectedValues={selectedSizes}
                onToggle={(value) => toggleFilter("size", value)}
              />

              <div className="pt-2">
                <h3 className="text-white text-sm font-bold tracking-[0.15em] uppercase mb-4">
                  Price range (ZAR)
                </h3>
                <div className="relative w-full h-1.5 mt-8 mb-8 bg-[#111] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-white/5">
                  <div
                    className="absolute h-full bg-linear-to-r from-[#a07c33] to-[#d4af37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                    style={{
                      left: `${(minP / maxPrice) * 100}%`,
                      right: `${100 - (maxP / maxPrice) * 100}%`,
                    }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max={Math.ceil(maxPrice / 100) * 100}
                    step="100"
                    value={minP}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxP);
                      setMinPrice(val.toString());
                    }}
                    className="absolute w-full top-1/2 -translate-y-1/2 h-6 appearance-none bg-transparent pointer-events-none custom-range-slider m-0 p-0"
                  />
                  <input
                    type="range"
                    min="0"
                    max={Math.ceil(maxPrice / 100) * 100}
                    step="100"
                    value={maxP}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minP);
                      setMaxPriceInput(val.toString());
                    }}
                    className="absolute w-full top-1/2 -translate-y-1/2 h-6 appearance-none bg-transparent pointer-events-none custom-range-slider m-0 p-0"
                  />
                </div>
                <style>{`
                  .custom-range-slider::-webkit-slider-thumb {
                    pointer-events: auto;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 35%, #fff1c5, #d4af37 50%, #8a6a2a);
                    border: 1px solid rgba(255,255,255,0.9);
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(212,175,55,0.4);
                  }
                  .custom-range-slider::-moz-range-thumb {
                    pointer-events: auto;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 35%, #fff1c5, #d4af37 50%, #8a6a2a);
                    border: 1px solid rgba(255,255,255,0.9);
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(212,175,55,0.4);
                  }
                  .no-spin-buttons::-webkit-outer-spin-button,
                  .no-spin-buttons::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  .no-spin-buttons {
                    -moz-appearance: textfield;
                  }
                `}</style>
                <div className="flex gap-4 items-center mt-2">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
                      R
                    </span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2.5 text-sm font-medium text-white placeholder-white/30 focus:outline-none focus:border-[#b58b38] focus:ring-1 focus:ring-[#b58b38] transition-all no-spin-buttons shadow-inner"
                    />
                  </div>
                  <span className="text-white/30 font-light">-</span>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
                      R
                    </span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-3 py-2.5 text-sm font-medium text-white placeholder-white/30 focus:outline-none focus:border-[#b58b38] focus:ring-1 focus:ring-[#b58b38] transition-all no-spin-buttons shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3 text-[#888]">
                <Grid3X3 size={16} className="text-[#b58b38]" />
                <strong className="text-white font-medium text-sm tracking-wide">
                  {filteredProducts.length} bottles
                </strong>
                <span className="hidden md:inline text-xs">
                  Curated and ready to discover
                </span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  className="lg:hidden flex-1 sm:flex-none h-10 flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#111] px-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white hover:border-[#b58b38] hover:text-[#b58b38] transition-all whitespace-nowrap active:scale-[0.98]"
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal size={14} className="text-[#b58b38]" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-[#b58b38] px-1.5 py-0.5 text-[10px] font-bold text-black leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <div className="flex-1 sm:flex-none flex items-center gap-2">
                  <label className="hidden sm:inline-block text-[#888] text-[10px] uppercase tracking-widest whitespace-nowrap">
                    Sort by
                  </label>
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="w-full sm:w-auto h-10 appearance-none rounded-lg border border-[#b58b38]/40 bg-[#111] pl-3 pr-8 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white outline-none cursor-pointer hover:border-[#b58b38] hover:text-[#e6c97a] focus:border-[#b58b38] focus:ring-1 focus:ring-[#b58b38] transition-all shadow-sm"
                    >
                      <option value="featured" className="bg-[#111] text-white">
                        Featured
                      </option>
                      <option value="price-low" className="bg-[#111] text-white">
                        Price: Low to High
                      </option>
                      <option value="price-high" className="bg-[#111] text-white">
                        Price: High to Low
                      </option>
                      <option value="name" className="bg-[#111] text-white">
                        Name
                      </option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b58b38]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {filteredProducts.length ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      product={product}
                      onAdd={onAdd}
                      onWish={onWish}
                      onCompare={onCompare}
                      isCompared={compareItems.some(
                        (item) => item.id === product.id,
                      )}
                      key={product.id || product._id}
                    />
                  ))}
                </div>
                {visibleCount < filteredProducts.length && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="px-8 py-3 bg-transparent border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase cursor-pointer"
                    >
                      Load More Options
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center border border-white/5 bg-white/[0.02]">
                <h2 className="font-serif text-3xl text-white mb-4 tracking-wide">
                  No bottles match these filters.
                </h2>
                <p className="text-[#888] mb-8 max-w-md">
                  Clear a filter to return to the wider collection and discover
                  more exceptional spirits.
                </p>
                <button
                  className="px-8 py-3 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase"
                  type="button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

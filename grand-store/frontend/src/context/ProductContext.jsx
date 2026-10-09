import React, { createContext, useContext, useState, useEffect } from "react";
import api from '../api';
import { normalizeProductForDisplay } from "../utils/productTaxonomy";

const ProductContext = createContext();

const hydrateProductMetadata = (product) => {
  if (!product) return null;
  const firstOption = Array.isArray(product.options)
    ? product.options.find(
        (option) => typeof option === "string" && option.trim(),
      )
    : null;

  return normalizeProductForDisplay({
    ...product,
    category: product.category || product.type,
    brand: product.brand || product.storeName,
    size: product.size || firstOption,
  });
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    try {
      // Use clean cached live products from session to avoid flashing, strictly avoiding hardcoded seeded mock products
      const cached = sessionStorage.getItem("gs_live_products_cache_v3");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(hydrateProductMetadata).filter(Boolean);
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products`);
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const filteredData = data.filter(
          (p) => p && p.id !== 'prod_1787641901446' && p._id !== 'prod_1787641901446'
        );
        const normalized = filteredData.map(hydrateProductMetadata).filter(Boolean);

        if (isMounted) {
          setProducts(normalized);
          setLoading(false);
        }
        try {
          sessionStorage.setItem("gs_live_products_cache_v3", JSON.stringify(filteredData));
        } catch (e) {}
      } catch (err) {
        console.error("Error fetching live products:", err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  return useContext(ProductContext);
};

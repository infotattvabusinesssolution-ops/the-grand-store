import React, { createContext, useContext, useState, useEffect } from "react";
import api from '../api';
import { products as catalogProducts } from "../data";
import { normalizeProductForDisplay } from "../utils/productTaxonomy";

const ProductContext = createContext();
const catalogProductsById = new Map(
  catalogProducts.map((product) => [String(product.id), product]),
);

const hydrateProductMetadata = (product) => {
  const catalogProduct = catalogProductsById.get(String(product.id));
  const hydratedProduct = catalogProduct
    ? { ...catalogProduct, ...product }
    : product;
  const firstOption = Array.isArray(hydratedProduct.options)
    ? hydratedProduct.options.find(
        (option) => typeof option === "string" && option.trim(),
      )
    : null;

  return normalizeProductForDisplay({
    ...hydratedProduct,
    category: hydratedProduct.category || hydratedProduct.type,
    brand: hydratedProduct.brand || hydratedProduct.storeName,
    size: hydratedProduct.size || firstOption,
  });
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    try {
      return catalogProducts.map(hydrateProductMetadata);
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products`);
        const data = res.data;
        // The API's legacy products only contain the fields in the database schema.
        // Restore their catalog metadata and normalize newer vendor product fields.
        const filteredData = data.filter((p) => p.id !== 'prod_1787641901446' && p._id !== 'prod_1787641901446');
        setProducts(filteredData.map(hydrateProductMetadata));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        // The endpoint returns { status: 1, data: [ { name: 'Wine', subcategories: [] }, ... ] }
        if (data.status === 1 && Array.isArray(data.data)) {
          setCategories(data.data);
        } else if (Array.isArray(data)) {
          // Fallback if API changes
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch dynamic categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => useContext(CategoryContext);

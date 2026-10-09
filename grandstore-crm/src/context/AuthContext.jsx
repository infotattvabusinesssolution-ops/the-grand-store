import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // 1. Check dedicated CRM admin storage first
      const crmAdminStr = localStorage.getItem('crmAdminInfo');
      if (crmAdminStr) {
        const parsed = JSON.parse(crmAdminStr);
        if (parsed?.token && ['super_admin', 'admin', 'accountant', 'product_manager'].includes(parsed?.role)) {
          return parsed;
        }
      }

      // 2. Check userInfo ONLY if role is staff/super_admin (purge if customer)
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role && ['super_admin', 'admin', 'accountant', 'product_manager'].includes(parsed.role)) {
          return parsed;
        } else if (parsed?.role === 'customer') {
          console.warn('Customer session detected in CRM. Discarding customer session from CRM context.');
        }
      }

      // 3. Fallback adminToken
      const adminToken = localStorage.getItem('crmAdminToken') || localStorage.getItem('adminToken');
      if (adminToken) {
        return { 
          name: 'Grand Store Master CRM Admin', 
          email: 'crmadmin@grandstore.com', 
          role: 'super_admin', 
          token: adminToken 
        };
      }
    } catch (e) {
      console.warn('Failed parsing existing CRM auth cache:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Initialize or auto-authenticate with dedicated Master CRM Admin (crmadmin@grandstore.com)
  useEffect(() => {
    async function initAuth() {
      // If we already have a valid staff/super_admin user, do not force re-auth
      if (user && ['super_admin', 'admin', 'accountant', 'product_manager'].includes(user.role)) {
        return;
      }

      try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const base = isLocalhost ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com';
        
        // Auto-login explicitly requests Master CRM Admin
        const res = await axios.post(`${base}/api/crm/auth/login`, { isDevAuto: true });
        if (res.data && res.data.token) {
          const authPayload = { ...res.data.user, token: res.data.token };
          setUser(authPayload);
          // Store in isolated CRM storage keys
          localStorage.setItem('crmAdminInfo', JSON.stringify(authPayload));
          localStorage.setItem('crmAdminToken', res.data.token);
          // Compatibility keys
          localStorage.setItem('adminToken', res.data.token);
          // Overwrite generic token / userInfo so any standard listeners sync up
          localStorage.setItem('userInfo', JSON.stringify(authPayload));
          localStorage.setItem('token', res.data.token);
        }
      } catch (e) {
        console.warn('Auto Master CRM admin auth resolution skipped:', e.message);
      }
    }

    initAuth();

    // Listen for access denied events to reset invalid session
    const handleAccessDenied = () => {
      logout();
    };
    window.addEventListener('crm:access-denied', handleAccessDenied);
    return () => window.removeEventListener('crm:access-denied', handleAccessDenied);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const base = isLocalhost ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com';
      const res = await axios.post(`${base}/api/crm/auth/login`, { 
        email: email?.trim(), 
        password: password?.trim() 
      });
      if (res.data && res.data.token) {
        const authPayload = { ...res.data.user, token: res.data.token };
        setUser(authPayload);
        localStorage.setItem('crmAdminInfo', JSON.stringify(authPayload));
        localStorage.setItem('crmAdminToken', res.data.token);
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(authPayload));
        localStorage.setItem('token', res.data.token);
        return { success: true, user: authPayload };
      }
      return { success: false, message: 'Invalid response from authentication server' };
    } catch (err) {
      console.warn('Login error:', err);
      return { success: false, message: err?.response?.data?.message || 'Login failed. Access denied.' };
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-click login for Master CRM Admin (crmadmin@grandstore.com)
  const loginAsMasterAdmin = async () => {
    return login('crmadmin@grandstore.com', 'Admin123!');
  };

  const logout = () => {
    localStorage.removeItem('crmAdminInfo');
    localStorage.removeItem('crmAdminToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, loginAsMasterAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

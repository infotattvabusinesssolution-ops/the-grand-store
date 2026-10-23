import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import WishlistProvider from './WishlistProvider.jsx'
import { ProductProvider } from './context/ProductContext.jsx'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import { CategoryProvider } from './context/CategoryContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <LanguageProvider>
            <LocationProvider>
              <AuthProvider>
                <CurrencyProvider>
                  <CategoryProvider>
                    <ProductProvider>
                      <WishlistProvider>
                        <App />
                      </WishlistProvider>
                    </ProductProvider>
                  </CategoryProvider>
                </CurrencyProvider>
              </AuthProvider>
            </LocationProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

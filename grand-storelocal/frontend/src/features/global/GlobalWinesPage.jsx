import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ChevronRight, ArrowRight } from 'lucide-react';
import SEO from '../../components/SEO';

const countries = [
  { name: 'France', code: 'FR', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop', desc: 'Bordeaux, Burgundy, Rhône Valley, Sauternes' },
  { name: 'Italy', code: 'IT', image: 'https://i.pinimg.com/1200x/40/1d/84/401d84d477523012fa2eec4b0ca1b7b2.jpg', desc: 'Tuscany, Piedmont, Veneto' },
  { name: 'Spain', code: 'ES', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=2070&auto=format&fit=crop', desc: 'Rioja, Ribera del Duero, Priorat' },
  { name: 'South Africa', code: 'ZA', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661480/grand-store/global-wines/zzksu1ceacegz0hflvrq.png', desc: 'Stellenbosch, Franschhoek, Swartland' },
  { name: 'United States', code: 'US', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661481/grand-store/global-wines/txfvlktfshwo2ytuhsit.png', desc: 'Napa Valley, Sonoma, Oregon' },
  { name: 'Argentina', code: 'AR', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661484/grand-store/global-wines/chxw3iubgaud4xlzflvi.png', desc: 'Mendoza, Salta, Patagonia' },
  { name: 'New Zealand', code: 'NZ', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661482/grand-store/global-wines/lid2udfdfob8mm5462r2.png', desc: 'Marlborough, Central Otago, Hawke\'s Bay' },
  { name: 'Germany', code: 'DE', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop', desc: 'Mosel, Rheingau, Pfalz' },
  { name: 'Portugal', code: 'PT', image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop', desc: 'Douro, Dão, Alentejo' },
  { name: 'Canada', code: 'CA', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop', desc: 'Niagara Peninsula, Okanagan Valley' },
  { name: 'Australia', code: 'AU', image: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?q=80&w=2071&auto=format&fit=crop', desc: 'Barossa, Margaret River, Yarra Valley' },
  { name: 'Chile', code: 'CL', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=2070&auto=format&fit=crop', desc: 'Maipo Valley, Colchagua, Casablanca' },
];

export default function GlobalWinesPage() {
  const globalWinesSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://grandstoreglobal.com/global-wines#webpage',
        url: 'https://grandstoreglobal.com/global-wines',
        name: 'Global Wine Pavilions | International Fine Wine & Terroirs | The Grand Store',
        description: 'Explore the world\'s finest wine terroirs through curated pavilions: France, Italy, Spain, South Africa, Napa Valley, Australia, and beyond.',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: countries.map((c, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `https://grandstoreglobal.com/global-wines/${c.name.toLowerCase().replace(/\\s+/g, '-')}`,
            name: `Wines of ${c.name}`
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://grandstoreglobal.com'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Global Wine Pavilions',
            item: 'https://grandstoreglobal.com/global-wines'
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0907] pb-20 relative overflow-hidden">
      <SEO
        title="Global Wine Pavilions | International Fine Wine & Terroirs | The Grand Store"
        description="Explore the world's most prestigious terroirs through our curated international wine pavilions: Bordeaux, Tuscany, Rioja, Napa, Stellenbosch, and beyond."
        canonical="https://grandstoreglobal.com/global-wines"
        ogType="website"
        schema={globalWinesSchema}
      />
      {/* Massive subtle golden glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/10 via-[#0a0907]/0 to-[#0a0907]/0 pointer-events-none rounded-full blur-3xl opacity-60"></div>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 mb-28 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center mb-8"
        >
          <div className="p-4 rounded-full bg-gradient-to-b from-[#c9a35b]/10 to-transparent shadow-[0_0_50px_rgba(201,163,91,0.15)]">
            <Globe size={48} className="text-gold-gradient drop-shadow-[0_0_15px_rgba(201,163,91,0.8)]" />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="text-4xl sm:text-6xl md:text-8xl font-serif mb-8 tracking-wide"
        >
          <span className="bg-gradient-to-b from-[#eee8dd] via-[#e6c97a] to-[#c9a35b] text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(201,163,91,0.3)]">
            GLOBAL WINES
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-[#918a7f] text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto font-light tracking-wide mb-12 px-2"
        >
          Discover exceptional wines from the world's most prestigious terroirs, curated for the modern collector.
        </motion.p>
      </div>

      {/* Country Pavilions - Edge to Edge */}
      <div className="w-full relative z-10 mb-32">
        <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-[#eee8dd] tracking-wider relative inline-block">
            Explore Pavilions
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#c9a35b] to-transparent shadow-[0_0_10px_rgba(201,163,91,0.8)]"></div>
          </h2>
        </div>
        
        <div className="flex flex-col w-full">
          {countries.map((country, idx) => (
            <motion.div 
              key={country.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="w-full h-[50vh] md:h-[60vh] relative group overflow-hidden border-y border-white/5"
            >
              <Link to={`/global-wines/${country.name.toLowerCase().replace(/\s+/g, '-')}`} className="block w-full h-full">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{ backgroundImage: `url(${country.image})` }}
                />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-700" />
                
                {/* Glowing hover overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-screen" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <span className="text-gold-gradient text-sm font-bold tracking-[0.4em] uppercase mb-4 drop-shadow-[0_0_10px_rgba(201,163,91,0.5)]">Wines of</span>
                  <h3 className="text-4xl sm:text-6xl md:text-8xl font-serif text-white mb-4 sm:mb-6 tracking-wide drop-shadow-2xl">{country.name}</h3>
                  <p className="text-white/80 font-light text-sm sm:text-lg md:text-xl tracking-wide max-w-2xl opacity-100 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100 mb-6 md:mb-0">
                    {country.desc}
                  </p>
                  <div className="md:mt-8 opacity-100 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-200">
                    <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#e6c97a] border-b border-[#c9a35b]/50 pb-1 hover:border-[#e6c97a] hover:text-white transition-all shadow-[0_4px_10px_-4px_rgba(201,163,91,0.5)]">
                      Enter Pavilion <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vendor Call to Action - Floating Text on Glow */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="w-full relative py-24 text-center z-10"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[300px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/15 via-[#0a0907]/0 to-[#0a0907]/0 pointer-events-none rounded-full blur-3xl mix-blend-screen"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-6">Are you an international winery?</h2>
          <p className="text-[#918a7f] text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
            Bring your wines to a new audience without compromising your brand. Join the Grand Store Global Wine Network.
          </p>
          <Link 
            to="/vendor/onboarding" 
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#c9a35b] text-black font-bold uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all rounded-sm shadow-[0_0_30px_rgba(201,163,91,0.3)] hover:shadow-[0_0_50px_rgba(201,163,91,0.5)]"
          >
            Partner With Us <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

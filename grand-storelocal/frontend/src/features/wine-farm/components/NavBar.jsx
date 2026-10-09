import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'bg-white/95 backdrop-blur-[20px] py-[15px] px-[4%] border-b border-black/5 shadow-[0_4px_30px_rgba(0,0,0,0.03)]' : 'bg-transparent py-[30px] px-[4%] border-b border-white/10'}`}>
      <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto relative">
        {/* Mobile Toggle (Left on mobile) */}
        <button 
          className={`flex lg:hidden bg-transparent border-none cursor-pointer p-[5px] items-center justify-center z-10 ${isScrolled ? 'text-ink' : 'text-white'}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop Left Menu */}
        <nav className="flex-1 hidden lg:block pl-[60px]">
          <ul className="flex items-center gap-[20px] xl:gap-[40px] m-0 p-0 list-none">
            <li><a href="/" className={`relative font-sans text-[11px] xl:text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group ${isScrolled ? 'text-ink hover:text-[#7b263c]' : 'text-white/85 hover:text-white'}`}>
              HOME
              <span className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[1px] w-0 transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-[#7b263c]' : 'bg-gold-bright'}`}></span>
            </a></li>
            <li><a href="/about" className={`relative font-sans text-[11px] xl:text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group ${isScrolled ? 'text-ink hover:text-[#7b263c]' : 'text-white/85 hover:text-white'}`}>
              ABOUT US
              <span className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[1px] w-0 transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-[#7b263c]' : 'bg-gold-bright'}`}></span>
            </a></li>
            <li><a href="/winefarm" className={`relative font-sans text-[11px] xl:text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group ${isScrolled ? 'text-[#7b263c]' : 'text-white'}`}>
              WINE FARM
              <span className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[1px] w-full transition-all duration-300 ${isScrolled ? 'bg-[#7b263c]' : 'bg-gold-bright'}`}></span>
            </a></li>
          </ul>
        </nav>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:flex items-center justify-center h-full">
          <a href="/">
            <img 
              src="/grand-store-logo.png" 
              alt="The Grand Store" 
              className={`h-auto transition-all duration-400 ease-in-out ${isScrolled ? 'max-w-[110px] filter-none' : 'max-w-[140px] brightness-0 invert'}`} 
            />
          </a>
        </div>

        {/* Desktop Right Menu & Actions */}
        <div className="hidden lg:flex items-center gap-[30px] flex-1 justify-end">
          <nav>
            <ul className="flex items-center gap-[20px] xl:gap-[40px] m-0 p-0 list-none">
              <li><a href="/shop" className={`relative font-sans text-[11px] xl:text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group ${isScrolled ? 'text-ink hover:text-[#7b263c]' : 'text-white/85 hover:text-white'}`}>
                SHOP WINES
                <span className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[1px] w-0 transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-[#7b263c]' : 'bg-gold-bright'}`}></span>
              </a></li>
              <li><a href="/blogs" className={`relative font-sans text-[11px] xl:text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group ${isScrolled ? 'text-ink hover:text-[#7b263c]' : 'text-white/85 hover:text-white'}`}>
                BLOGS
                <span className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[1px] w-0 transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-[#7b263c]' : 'bg-gold-bright'}`}></span>
              </a></li>
              <li><a href="/contact" className={`relative font-sans text-[11px] xl:text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group ${isScrolled ? 'text-ink hover:text-[#7b263c]' : 'text-white/85 hover:text-white'}`}>
                CONTACT
                <span className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[1px] w-0 transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-[#7b263c]' : 'bg-gold-bright'}`}></span>
              </a></li>
            </ul>
          </nav>
          <div className={`w-[1px] h-[20px] ${isScrolled ? 'bg-black/10' : 'bg-white/20'}`}></div>
          <a 
            href="/vendor-portal" 
            className={`font-sans text-[12px] font-bold uppercase tracking-[0.15em] px-[24px] py-[10px] rounded-[100px] transition-all duration-300 border ${isScrolled ? 'text-[#7b263c] border-[#800020]/20 hover:bg-[#7b263c] hover:text-white' : 'text-gold-bright border-[#d5be75]/30 hover:bg-gold-bright hover:text-ink'}`}
          >
            BECOME A VENDOR
          </a>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/98 backdrop-blur-[20px] p-[30px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-b border-black/5 lg:hidden">
          <ul className="flex flex-col gap-[15px] m-0 p-0 list-none">
            <li><a href="/" className="block text-ink font-bold text-[15px] tracking-[0.1em] p-[15px] border-b border-black/5 hover:text-[#7b263c] transition-colors">HOME</a></li>
            <li><a href="/about" className="block text-ink font-bold text-[15px] tracking-[0.1em] p-[15px] border-b border-black/5 hover:text-[#7b263c] transition-colors">ABOUT US</a></li>
            <li><a href="/winefarm" className="block text-[#7b263c] font-bold text-[15px] tracking-[0.1em] p-[15px] border-b border-black/5 transition-colors">WINE FARM</a></li>
            <li><a href="/shop" className="block text-ink font-bold text-[15px] tracking-[0.1em] p-[15px] border-b border-black/5 hover:text-[#7b263c] transition-colors">SHOP WINES</a></li>
            <li><a href="/blogs" className="block text-ink font-bold text-[15px] tracking-[0.1em] p-[15px] border-b border-black/5 hover:text-[#7b263c] transition-colors">BLOGS</a></li>
            <li><a href="/contact" className="block text-ink font-bold text-[15px] tracking-[0.1em] p-[15px] border-b border-black/5 hover:text-[#7b263c] transition-colors">CONTACT US</a></li>
            <li><a href="/vendor-portal" className="block mt-[15px] text-center bg-[#7b263c] text-white font-bold text-[15px] tracking-[0.1em] p-[15px] rounded-[100px]">BECOME A VENDOR</a></li>
          </ul>
        </div>
      )}
    </header>
  );
}

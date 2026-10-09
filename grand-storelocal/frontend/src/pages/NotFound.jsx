import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { ArrowLeft, Search, Wine, GlassWater } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#0a0907] text-white px-4">
      <SEO
        title="404 - Page Not Found"
        description="The page you are looking for does not exist at The Grand Store."
      />

      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg">
        <h1 className="text-6xl md:text-8xl font-serif text-[#d8b76d] mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-serif mb-6 text-gray-200">
          This vintage cannot be found.
        </h2>
        <p className="text-gray-400 mb-10">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 border border-[#d8b76d] text-[#d8b76d] hover:bg-[#d8b76d] hover:text-black py-3 px-6 rounded-full transition-all"
          >
            <ArrowLeft size={18} />
            Return Home
          </Link>
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 border border-white/20 text-white hover:border-white py-3 px-6 rounded-full transition-all"
          >
            <Search size={18} />
            Shop All
          </Link>
          <Link
            to="/shop?category=Accessories"
            className="flex items-center justify-center gap-2 border border-white/20 text-white hover:border-white py-3 px-6 rounded-full transition-all"
          >
            <Search size={18} />
            Accessories
          </Link>
        </div>
      </div>
    </div>
  );
}

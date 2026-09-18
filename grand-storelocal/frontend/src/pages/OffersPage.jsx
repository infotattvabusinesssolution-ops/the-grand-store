import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function OffersPage() {
  return (
    <div className="min-h-[80vh] bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#c9a35b] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1a1a1a] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-2xl mx-auto z-10"
      >
        <h1 className="text-4xl md:text-6xl font-serif text-[#c9a35b] mb-6">
          Exclusive Offers
        </h1>
        <p className="text-lg md:text-xl text-[#eee8dd]/80 mb-10 leading-relaxed">
          We currently do not have any active offers. Our curated collections
          are constantly evolving. Please visit again soon to find exclusive
          deals on premium spirits and wines.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center px-8 py-4 bg-[#c9a35b] text-black font-bold tracking-[0.2em] uppercase text-sm duration-300"
        >
          Explore Products
        </Link>
      </motion.div>
    </div>
  );
}

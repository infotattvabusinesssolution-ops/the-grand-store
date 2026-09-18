import { useProducts } from "../../context/ProductContext";
import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Heart,
  ZoomIn,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Mail,
  MessageCircle,
  Share2,
  X,
  Gift,
  SlidersHorizontal,
  Grid3X3,
  GitCompareArrows,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Droplets,
} from "lucide-react";
import {
  brandyBrands,
  brands,
  menuCategories,
  tequilaBrands,
} from "../../data";
import { useWishlist } from "../../wishlistContext";
import ProductCard from "../../components/ProductCard";

const getAuctionTime = (ms) => {
  if (ms < 0) ms = 0;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds };
};

export default function AuctionCountdown({ endTime, now, compact = false }) {
  const { products } = useProducts();

  const remaining = getAuctionTime(endTime - now);
  if (compact)
    return (
      <time>
        {String(remaining.days).padStart(2, "0")}d{" "}
        {String(remaining.hours).padStart(2, "0")}h{" "}
        {String(remaining.minutes).padStart(2, "0")}m
      </time>
    );

  return (
    <div
      className="auction-countdown"
      aria-label={`${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes and ${remaining.seconds} seconds remaining`}
    >
      {[
        ["Days", remaining.days],
        ["Hrs", remaining.hours],
        ["Mins", remaining.minutes],
        ["Secs", remaining.seconds],
      ].map(([label, value], index) => (
        <div className="auction-time-part" key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
          {index < 3 && <i aria-hidden="true">:</i>}
        </div>
      ))}
    </div>
  );
}

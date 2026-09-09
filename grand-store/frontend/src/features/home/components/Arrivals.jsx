import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useProducts } from "../../../context/ProductContext";
import ProductCard from "../../../components/ProductCard";

const ROTATION_INTERVAL_MS = 6000; // Rotate bottles every 6 seconds

const SLOT_DEFINITIONS = [
  {
    name: "Wine",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("wine");
    },
  },
  {
    name: "Beer",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("beer") || c.includes("cider");
    },
  },
  {
    name: "Champagne",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("champagne") || c.includes("sparkling");
    },
  },
  {
    name: "Whisky",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("whisky") || c.includes("scotch");
    },
  },
  {
    name: "Cognac / Tequila",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return (
        c.includes("cognac") ||
        c.includes("tequila") ||
        c.includes("brandy") ||
        c.includes("spirit") ||
        c.includes("rum") ||
        c.includes("vodka") ||
        c.includes("gin")
      );
    },
  },
];

export default function Arrivals({ onAdd, onWish, onCompare, compareItems }) {
  const { products } = useProducts();
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  // Filter approved non-accessories products, sorted newest first
  const validProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .filter((p) => !p.vendorId || p.approvalStatus === "approved")
      .filter((p) => String(p.category || p.type || "").toLowerCase() !== "accessories")
      .sort((a, b) => {
        const first = Date.parse(a.createdAt || "") || 0;
        const second = Date.parse(b.createdAt || "") || 0;
        return second - first;
      });
  }, [products]);

  // Group products into the 5 category slots (Wine, Beer, Champagne, Whisky, Cognac/Spirits)
  const categoryBuckets = useMemo(() => {
    if (validProducts.length === 0) return [[], [], [], [], []];

    const usedIds = new Set();
    const buckets = SLOT_DEFINITIONS.map((def) => {
      const matches = validProducts.filter((p) => def.match(p));
      matches.forEach((m) => usedIds.add(m.id || m._id));
      return matches;
    });

    // Fallback: if any bucket is empty, fill with unused newest products
    const unused = validProducts.filter((p) => !usedIds.has(p.id || p._id));
    buckets.forEach((bucket, idx) => {
      if (bucket.length === 0) {
        buckets[idx] = unused.length > 0 ? unused.slice(0, 5) : validProducts.slice(idx * 2, idx * 2 + 5);
      }
    });

    return buckets;
  }, [validProducts]);

  const [rotationIndex, setRotationIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Time-to-time rotation: cycle through category bottles every 6 seconds
  useEffect(() => {
    if (categoryBuckets.every((b) => b.length <= 1) || isHovered) return;

    const timer = setInterval(() => {
      setRotationIndex((prev) => prev + 1);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [categoryBuckets, isHovered]);

  // GSAP animation whenever the bottles rotate
  useEffect(() => {
    if (!gridRef.current || rotationIndex === 0) return;
    const cards = gridRef.current.querySelectorAll(".product-card");
    if (cards.length === 0) return;

    gsap.killTweensOf(cards);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }
    );
  }, [rotationIndex]);

  // Initial reveal animation on scroll
  useEffect(() => {
    if (!sectionRef.current || validProducts.length === 0) return;
    const context = gsap.context(() => {
      gsap.from(".product-card", {
        y: 60,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 76%" },
      });
    }, sectionRef);

    return () => context.revert();
  }, [validProducts.length > 0]);

  // Get current 5 products (one for each category slot: Wine, Beer, Champagne, Whisky, Cognac/Spirits)
  const currentProducts = useMemo(() => {
    return categoryBuckets
      .map((bucket) => {
        if (!bucket || bucket.length === 0) return null;
        return bucket[rotationIndex % bucket.length];
      })
      .filter(Boolean);
  }, [categoryBuckets, rotationIndex]);

  return (
    <section
      className="section arrivals home-product-editorial"
      id="arrivals"
      ref={sectionRef}
    >
      <div className="shell">
        <div className="section-heading flex flex-col items-start text-left md:flex-row md:text-left md:justify-between md:items-end gap-3 md:gap-0">
          <div className="flex flex-col items-start md:items-start w-full">
            <p className="eyebrow hidden md:block">Fresh from the cellar</p>
            <h2>New arrivals</h2>
            <p className="section-intro hidden md:block">
              Newly discovered, quietly exceptional. Meet the bottles our
              curators cannot stop talking about.
            </p>
          </div>
          <Link className="text-link arrow-link flex items-center gap-1" to="/shop">
            <span className="hidden md:inline">View all bottles</span>
            <span className="inline md:hidden">View all</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div
          ref={gridRef}
          className="product-grid"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {currentProducts.map((product, index) => (
            <ProductCard
              key={`${product.id || product._id}-${index}`}
              product={product}
              index={index}
              onAdd={onAdd}
              onWish={onWish}
              onCompare={onCompare}
              isCompared={compareItems.some(
                (item) => (item.id || item._id) === (product.id || product._id),
              )}
            />
          ))}
        </div>

        <p className="swipe-hint">
          <ArrowRight size={15} /> Swipe to explore
        </p>
      </div>
    </section>
  );
}

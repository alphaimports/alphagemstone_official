"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
}

interface ApiProduct {
  _id: string;
  name: string;
  category: PopulatedCategory;
  subcategory?: PopulatedCategory;
  price: number;
  shape?: string[];
  size?: number;
  color?: string[];
  clarity?: string[];
  certification?: string[];
  images: string[];
  stock: number;
  isActive: boolean;
  description?: string;
  watchBrand?: string;
  watchMovement?: string;
}

// ── Scroll-reveal hook ────────────────────────────────────────────────────────

function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12,
  rootMargin = "0px 0px -48px 0px"
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}

// ── Accent palette ────────────────────────────────────────────────────────────

const ACCENTS: Record<string, string> = {
  diamond:  "#7dd3fc",
  diamonds: "#7dd3fc",
  gemstone: "#6ee7b7",
  gemstones:"#6ee7b7",
  jewelry:  "#f9a8d4",
  watches:  "#c4b5fd",
  watch:    "#c4b5fd",
};

function getAccent(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(ACCENTS)) if (key.includes(k)) return v;
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue},55%,72%)`;
}

function getSubtitle(p: ApiProduct): string {
  if (p.watchBrand)
    return `${p.watchBrand}${p.watchMovement ? ` · ${p.watchMovement}` : ""}`;
  const parts: string[] = [];
  if (p.shape?.length)
    parts.push(p.shape[0].charAt(0).toUpperCase() + p.shape[0].slice(1));
  if (p.size) parts.push(`${p.size} ct`);
  if (p.clarity?.length) parts.push(p.clarity[0]);
  return parts.join(" · ") || (p.category?.name ?? "");
}

// ── Gem SVG placeholder ───────────────────────────────────────────────────────

function GemShape({ shape = "other", color }: { shape?: string; color: string }) {
  const s = shape.toLowerCase();
  if (s.includes("round") || s.includes("brilliant"))
    return (
      <svg viewBox="0 0 80 80" width="56" height="56">
        <polygon
          points="40,8 68,22 74,50 58,68 22,68 6,50 12,22"
          fill={`${color}22`} stroke={color} strokeWidth="1"
        />
        <polygon
          points="40,16 60,26 65,46 52,60 28,60 15,46 20,26"
          fill={`${color}0d`} stroke={color} strokeWidth="0.5"
        />
        <circle cx="40" cy="40" r="3" fill={color} opacity="0.45" />
      </svg>
    );
  if (s.includes("oval") || s.includes("pear"))
    return (
      <svg viewBox="0 0 80 80" width="56" height="56">
        <ellipse cx="40" cy="40" rx="30" ry="22" fill={`${color}22`} stroke={color} strokeWidth="1" />
        <ellipse cx="40" cy="40" rx="20" ry="13" fill={`${color}0d`} stroke={color} strokeWidth="0.5" />
        <circle cx="40" cy="40" r="2.5" fill={color} opacity="0.45" />
      </svg>
    );
  return (
    <svg viewBox="0 0 80 80" width="56" height="56">
      <polygon
        points="40,6 70,22 70,58 40,74 10,58 10,22"
        fill={`${color}22`} stroke={color} strokeWidth="1"
      />
      <polygon
        points="40,18 60,28 60,52 40,62 20,52 20,28"
        fill={`${color}0d`} stroke={color} strokeWidth="0.5"
      />
      <circle cx="40" cy="40" r="3" fill={color} opacity="0.45" />
    </svg>
  );
}

// ── Arrow icon ────────────────────────────────────────────────────────────────

function ArrowRight({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Featured card ─────────────────────────────────────────────────────────────

function FeaturedCard({ product, animKey }: { product: ApiProduct; animKey: string }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { ref, visible } = useReveal<HTMLAnchorElement>();
  const accent = getAccent(product.category?.name ?? "");
  const hasImg = product.images?.length > 0 && !imgError;

  // reset imgError when product changes
  useEffect(() => { setImgError(false); }, [product._id]);

  return (
    <Link
      ref={ref}
      href={`/products/${product._id}`}
      key={animKey}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        borderRadius: 5,
        background: "linear-gradient(160deg, #061a30 0%, #082540 60%, #0a2e50 100%)",
        border: `1px solid ${hovered ? `${accent}55` : "rgba(56,189,248,0.12)"}`,
        cursor: "pointer",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.65s ease",
        boxShadow: hovered
          ? `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${accent}14, inset 0 1px 0 ${accent}18`
          : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
        transform: visible
          ? hovered ? "translateY(-4px) scale(1)" : "translateY(0) scale(1)"
          : "translateY(16px) scale(0.97)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Top shimmer line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}cc, transparent)`,
        opacity: hovered ? 1 : 0,
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "center",
        transition: "opacity 0.4s, transform 0.55s ease",
        zIndex: 10,
      }} />

      {/* Image area */}
      <div style={{ flex: 1, position: "relative", minHeight: 240, overflow: "hidden" }}>
        {hasImg ? (
          <img
            src={product.images[0]}
            alt={product.name}
            onError={() => setImgError(true)}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", display: "block",
              transform: hovered ? "scale(1.07)" : "scale(1)",
              transition: "transform 0.75s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `radial-gradient(ellipse at 40% 50%, ${accent}14 0%, transparent 70%)`,
            minHeight: 240,
          }}>
            <GemShape shape={product.shape?.[0]} color={accent} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #061a30 0%, rgba(6,26,48,0.65) 32%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Category badge */}
        <div style={{
          position: "absolute", top: 16, left: 16,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: accent, background: "rgba(3,18,36,0.82)",
          border: `1px solid ${accent}44`,
          padding: "4px 10px", borderRadius: 2,
          backdropFilter: "blur(10px)",
        }}>
          {product.category?.name}
        </div>

        {/* Featured badge */}
        <div style={{
          position: "absolute", top: 16, right: 16,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 8, fontWeight: 700,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "#031220",
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          padding: "4px 10px", borderRadius: 2,
          boxShadow: `0 4px 12px ${accent}44`,
        }}>
          Featured
        </div>
      </div>

      {/* Info panel */}
      <div style={{ padding: "20px 22px 22px", position: "relative" }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", bottom: -20, left: "20%",
          width: 200, height: 100,
          background: `radial-gradient(ellipse, ${accent}14 0%, transparent 70%)`,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.5s",
        }} />

        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9, fontWeight: 500,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: `${accent}88`, margin: "0 0 8px",
        }}>
          {getSubtitle(product)}
        </p>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 27, fontWeight: 600,
          color: hovered ? "#e8f4ff" : "#b8d8f0",
          lineHeight: 1.2, margin: "0 0 14px",
          transition: "color 0.3s",
        }}>
          {product.name}
        </p>

        <div style={{
          height: 1,
          background: `linear-gradient(90deg, ${accent}66, transparent)`,
          marginBottom: 14,
          transform: hovered ? "scaleX(1)" : "scaleX(0.35)",
          transformOrigin: "left",
          transition: "transform 0.55s ease",
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 30, fontWeight: 700,
              color: accent, lineHeight: 1,
            }}>
              ${product.price.toLocaleString()}
            </span>
            {product.size && (
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 10, color: "rgba(56,189,248,0.3)",
                letterSpacing: "0.1em", marginLeft: 6,
              }}>
                / ct
              </span>
            )}
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 9, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: accent,
            opacity: hovered ? 1 : 0.3,
            transform: hovered ? "translateX(0)" : "translateX(-8px)",
            transition: "opacity 0.3s, transform 0.3s",
          }}>
            View <ArrowRight color={accent} />
          </div>
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 8, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#f87171", marginTop: 10, marginBottom: 0,
          }}>
            Only {product.stock} left
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Small card ────────────────────────────────────────────────────────────────

function SmallCard({
  product,
  delay = 0,
  onClick,
}: {
  product: ApiProduct;
  delay?: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { ref, visible } = useReveal<HTMLDivElement>();
  const accent = getAccent(product.category?.name ?? "");
  const hasImg = product.images?.length > 0 && !imgError;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.55s ${delay}s cubic-bezier(0.22,1,0.36,1), transform 0.55s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      <Link
        href={`/products/${product._id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => { e.preventDefault(); onClick(); }}
        style={{
          display: "flex", gap: 14, alignItems: "center",
          textDecoration: "none",
          padding: "13px 15px",
          borderRadius: 3,
          background: hovered
            ? "linear-gradient(120deg, #0a2540 0%, #0d2e4a 100%)"
            : "linear-gradient(120deg, #061a30 0%, #082030 100%)",
          border: `1px solid ${hovered ? `${accent}42` : "rgba(56,189,248,0.1)"}`,
          transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          boxShadow: hovered
            ? `0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 ${accent}14`
            : "none",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left accent bar */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
          background: `linear-gradient(to bottom, ${accent}, ${accent}88)`,
          transform: hovered ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "center",
          transition: "transform 0.3s ease",
          borderRadius: "0 1px 1px 0",
        }} />

        {/* Thumbnail */}
        <div style={{
          width: 56, height: 56, flexShrink: 0,
          borderRadius: 3, overflow: "hidden",
          background: `radial-gradient(ellipse, ${accent}14 0%, #040e1f 100%)`,
          border: `1px solid ${hovered ? `${accent}42` : "rgba(56,189,248,0.14)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.3s",
        }}>
          {hasImg ? (
            <img
              src={product.images[0]}
              alt={product.name}
              onError={() => setImgError(true)}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                transform: hovered ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.45s ease",
              }}
            />
          ) : (
            <GemShape shape={product.shape?.[0]} color={accent} />
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 8, fontWeight: 500,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: `${accent}66`, margin: "0 0 4px",
          }}>
            {product.category?.name}
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 14, fontWeight: 500,
            color: hovered ? "#c8e4ff" : "#6a9cc4",
            lineHeight: 1.3, margin: "0 0 5px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 0.25s",
          }}>
            {product.name}
          </p>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 16, fontWeight: 700,
            color: hovered ? accent : `${accent}aa`,
            transition: "color 0.25s",
          }}>
            ${product.price.toLocaleString()}
          </span>
        </div>

        {/* Arrow */}
        <div style={{
          flexShrink: 0, color: accent,
          opacity: hovered ? 0.9 : 0.18,
          transform: hovered ? "translateX(3px)" : "translateX(0)",
          transition: "opacity 0.25s, transform 0.25s",
        }}>
          <ArrowRight color={accent} />
        </div>
      </Link>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <div style={{
      background: "linear-gradient(160deg, #061a30 0%, #082540 100%)",
      border: "1px solid rgba(56,189,248,0.08)",
      borderRadius: 5, overflow: "hidden", height: "100%", minHeight: 420,
    }}>
      <div className="sm-skel" style={{ height: "60%" }} />
      <div style={{ padding: "20px 22px" }}>
        <div className="sm-skel" style={{ height: 9, width: "40%", borderRadius: 2, marginBottom: 10 }} />
        <div className="sm-skel" style={{ height: 22, width: "85%", borderRadius: 2, marginBottom: 7 }} />
        <div className="sm-skel" style={{ height: 22, width: "60%", borderRadius: 2, marginBottom: 18 }} />
        <div className="sm-skel" style={{ height: 28, width: "35%", borderRadius: 2 }} />
      </div>
    </div>
  );
}

function SkeletonSmall() {
  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "center",
      padding: "13px 15px",
      background: "linear-gradient(120deg, #061a30 0%, #082030 100%)",
      border: "1px solid rgba(56,189,248,0.07)",
      borderRadius: 3,
    }}>
      <div className="sm-skel" style={{ width: 56, height: 56, borderRadius: 3, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="sm-skel" style={{ height: 8, width: "45%", borderRadius: 2, marginBottom: 7 }} />
        <div className="sm-skel" style={{ height: 13, width: "80%", borderRadius: 2, marginBottom: 6 }} />
        <div className="sm-skel" style={{ height: 15, width: "30%", borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── Orb (ambient background glow) ────────────────────────────────────────────

function Orb({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: "50%",
        filter: "blur(60px)",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SpecialsMarquee() {
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [featuredIndex, setFeaturedIndex]   = useState(0);
  const [featAnimKey, setFeatAnimKey]       = useState("0");
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Section-level scroll reveal
  const { ref: sectionRef, visible: sectionVisible } = useReveal<HTMLElement>(0.06);
  const { ref: headerRef, visible: headerVisible }   = useReveal<HTMLDivElement>(0.1);
  const { ref: tabsRef, visible: tabsVisible }       = useReveal<HTMLDivElement>(0.1);

  // Fetch products
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products?limit=60", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAllProducts(json.data.filter((p: ApiProduct) => p.isActive));
        } else {
          throw new Error("Unexpected response shape");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  // Derived data
  const categories = [
    { key: "all", label: "All" },
    ...Array.from(
      new Map(
        allProducts
          .filter((p) => p.category?._id)
          .map((p) => [p.category._id, { key: p.category._id, label: p.category.name }])
      ).values()
    ),
  ];

  const filtered = activeCategory === "all"
    ? allProducts
    : allProducts.filter((p) => p.category?._id === activeCategory);

  const featured  = filtered[featuredIndex] ?? filtered[0] ?? null;
  const sideItems = filtered.filter((_, i) => i !== featuredIndex).slice(0, 6);
  const activeAccent = featured ? getAccent(featured.category?.name ?? "") : "#38bdf8";

  // Auto-rotate featured
  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setFeaturedIndex((i) => {
        const next = (i + 1) % Math.min(filtered.length || 1, 8);
        setFeatAnimKey(String(next));
        return next;
      });
    }, 5000);
  }, [filtered.length]);

  useEffect(() => {
    if (filtered.length > 1) startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [filtered.length, startAuto]);

  // Reset on category change
  useEffect(() => {
    setFeaturedIndex(0);
    setFeatAnimKey("cat-change");
  }, [activeCategory]);

  const changeFeatured = (idx: number) => {
    setFeaturedIndex(idx);
    setFeatAnimKey(String(idx));
    startAuto();
  };

  return (
    <>
      {/* ── Global styles ──────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

        @keyframes sm-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes sm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.7); }
        }
        @keyframes sm-orb-drift-a {
          from { transform: translate(0px, 0px); }
          to   { transform: translate(18px, 24px); }
        }
        @keyframes sm-orb-drift-b {
          from { transform: translate(0px, 0px); }
          to   { transform: translate(-14px, 18px); }
        }
        @keyframes sm-orb-drift-c {
          from { transform: translate(0px, 0px); }
          to   { transform: translate(10px, -16px); }
        }
        @keyframes sm-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.35; }
          90%  { opacity: 0.35; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        .sm-skel {
          background: linear-gradient(90deg, #061628 25%, #0d2a4a 50%, #061628 75%);
          background-size: 600px 100%;
          animation: sm-shimmer 1.8s infinite linear;
        }

        .sm-root {
          background: linear-gradient(160deg,
            #031220 0%,
            #051d36 25%,
            #082d50 50%,
            #051d36 75%,
            #031220 100%);
          border-top: 1px solid rgba(56,189,248,0.15);
          border-bottom: 1px solid rgba(56,189,248,0.10);
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid */
        .sm-root::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none; z-index: 0;
        }

        /* Scanning line */
        .sm-scan-line {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(56,189,248,0.25) 20%,
            rgba(125,211,252,0.5) 50%,
            rgba(56,189,248,0.25) 80%,
            transparent 100%);
          animation: sm-scan 8s linear infinite;
          pointer-events: none; z-index: 1;
        }

        .sm-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 60px 44px 64px;
          position: relative;
          z-index: 2;
        }

        .sm-cat-tab {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          padding: 6px 16px;
          border-radius: 2px;
          transition: all 0.22s ease;
          white-space: nowrap;
          position: relative;
        }
        .sm-cat-tab:hover:not(.active) {
          color: rgba(125, 211, 252, 0.7) !important;
          background: rgba(56, 189, 248, 0.06) !important;
        }

        .sm-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: stretch;
        }

        .sm-right-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(3, 1fr);
          gap: 10px;
        }

        .sm-dot-btn {
          height: 5px;
          border-radius: 3px;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.35s ease;
        }

        @media (max-width: 900px) {
          .sm-layout { grid-template-columns: 1fr; }
          .sm-right-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .sm-inner { padding: 40px 22px 44px; }
        }
        @media (max-width: 540px) {
          .sm-right-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="sm-root" ref={sectionRef}>

        {/* Scanning line */}
        <div className="sm-scan-line" />

        {/* Ambient orbs */}
        <Orb style={{
          top: -100, left: "8%",
          width: 520, height: 520,
          background: "radial-gradient(ellipse, rgba(56,189,248,0.09) 0%, transparent 70%)",
          animation: "sm-orb-drift-a 12s ease-in-out infinite alternate",
        }} />
        <Orb style={{
          top: "30%", right: "5%",
          width: 380, height: 380,
          background: "radial-gradient(ellipse, rgba(14,165,233,0.07) 0%, transparent 70%)",
          animation: "sm-orb-drift-b 15s ease-in-out infinite alternate",
        }} />
        <Orb style={{
          bottom: -80, left: "35%",
          width: 440, height: 300,
          background: "radial-gradient(ellipse, rgba(125,211,252,0.06) 0%, transparent 70%)",
          animation: "sm-orb-drift-c 10s ease-in-out infinite alternate",
        }} />

        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "60%", height: 1,
          background: `linear-gradient(90deg, transparent, ${activeAccent}77, transparent)`,
          transition: "background 0.6s ease", zIndex: 1,
        }} />

        <div className="sm-inner">

          {/* ── Section header ──────────────────────────────────────────────── */}
          <div
            ref={headerRef}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
              marginBottom: 32,
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "translateY(0)" : "translateY(22px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {/* Left: heading */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: activeAccent,
                  animation: "sm-pulse 2s ease infinite",
                  boxShadow: `0 0 10px ${activeAccent}`,
                  flexShrink: 0,
                  transition: "background 0.45s, box-shadow 0.45s",
                }} />
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: activeAccent,
                  transition: "color 0.45s",
                }}>
                  Curated Selection
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(36px, 4.5vw, 62px)",
                fontWeight: 400, color: "#cee8ff",
                lineHeight: 1, letterSpacing: "-0.02em", margin: 0,
              }}>
                Our{" "}
                <em style={{
                  fontStyle: "italic",
                  color: activeAccent,
                  transition: "color 0.45s",
                }}>
                  Collection
                </em>
              </h2>
            </div>

            {/* Right: view-all + stats */}
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "flex-end", gap: 18,
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "translateX(0)" : "translateX(20px)",
              transition: "opacity 0.7s 0.12s ease, transform 0.7s 0.12s cubic-bezier(0.22,1,0.36,1)",
            }}>
              <Link href="/products" style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 10, fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: activeAccent, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 7,
                paddingBottom: 2,
                borderBottom: `1px solid ${activeAccent}44`,
                transition: "color 0.3s, border-color 0.3s",
              }}>
                View All <ArrowRight color={activeAccent} size={11} />
              </Link>

              {!loading && (
                <div style={{ display: "flex", gap: 28 }}>
                  {[
                    { v: String(allProducts.length), l: "Products" },
                    { v: String(categories.length - 1), l: "Categories" },
                  ].map((s) => (
                    <div key={s.l} style={{ textAlign: "right" }}>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 22, fontWeight: 700,
                        color: activeAccent, margin: "0 0 2px",
                        transition: "color 0.45s",
                      }}>
                        {s.v}
                      </p>
                      <p style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 8, color: "rgba(56,189,248,0.3)",
                        letterSpacing: "0.2em", textTransform: "uppercase",
                        margin: 0,
                      }}>
                        {s.l}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Category tabs ────────────────────────────────────────────────── */}
          <div
            ref={tabsRef}
            style={{
              opacity: tabsVisible ? 1 : 0,
              transform: tabsVisible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity 0.65s 0.18s ease, transform 0.65s 0.18s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 2,
              flexWrap: "wrap", marginBottom: 24,
              borderBottom: "1px solid rgba(56,189,248,0.1)",
            }}>
              {loading
                ? [80, 62, 100, 70, 86].map((w, i) => (
                    <div
                      key={i}
                      className="sm-skel"
                      style={{ height: 28, width: w, borderRadius: 2, margin: "4px 4px 10px" }}
                    />
                  ))
                : categories.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    const acc = cat.key === "all" ? "#7dd3fc" : getAccent(cat.label);
                    return (
                      <button
                        key={cat.key}
                        className={`sm-cat-tab${isActive ? " active" : ""}`}
                        onClick={() => setActiveCategory(cat.key)}
                        style={{
                          color: isActive ? acc : "rgba(56,189,248,0.25)",
                          background: isActive ? `${acc}14` : "transparent",
                          borderColor: isActive ? `${acc}38` : "transparent",
                        }}
                      >
                        {cat.label}
                        {isActive && (
                          <span style={{
                            position: "absolute", bottom: -1, left: 0, right: 0,
                            height: 1, background: acc,
                          }} />
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* ── Main layout ──────────────────────────────────────────────────── */}
          {loading ? (
            <div className="sm-layout">
              <SkeletonFeatured />
              <div className="sm-right-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonSmall key={i} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{
              padding: "56px 0", textAlign: "center",
              fontFamily: "'Outfit', sans-serif", fontSize: 13,
              color: "rgba(56,189,248,0.35)",
            }}>
              Could not load products.{" "}
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "none", border: "none",
                  color: "#38bdf8", cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13, textDecoration: "underline",
                }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: "56px 0", textAlign: "center",
              fontFamily: "'Outfit', sans-serif", fontSize: 13,
              color: "rgba(56,189,248,0.3)",
            }}>
              No products in this category.
            </div>
          ) : (
            <div className="sm-layout">
              {/* Featured */}
              {featured && (
                <FeaturedCard product={featured} animKey={featAnimKey} />
              )}

              {/* Side cards */}
              <div className="sm-right-grid">
                {sideItems.map((p, i) => (
                  <SmallCard
                    key={p._id}
                    product={p}
                    delay={i * 0.06}
                    onClick={() => changeFeatured(filtered.indexOf(p))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Dot indicators ───────────────────────────────────────────────── */}
          {!loading && !error && filtered.length > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, marginTop: 24,
            }}>
              {Array.from({ length: Math.min(filtered.length, 8) }).map((_, i) => {
                const isActive = i === featuredIndex;
                return (
                  <button
                    key={i}
                    className="sm-dot-btn"
                    onClick={() => changeFeatured(i)}
                    aria-label={`Go to item ${i + 1}`}
                    style={{
                      width: isActive ? 22 : 6,
                      background: isActive
                        ? `linear-gradient(90deg, ${activeAccent}, ${activeAccent}bb)`
                        : "rgba(56,189,248,0.18)",
                      boxShadow: isActive ? `0 0 8px ${activeAccent}66` : "none",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom glow line */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "55%", height: 1,
          background: `linear-gradient(90deg, transparent, ${activeAccent}55, transparent)`,
          transition: "background 0.5s ease",
        }} />
      </section>
    </>
  );
}
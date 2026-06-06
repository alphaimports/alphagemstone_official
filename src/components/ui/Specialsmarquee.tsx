"use client";
import { useState, useEffect } from "react";
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENTS: Record<string, string> = {
  diamond:  "#7dd3fc", diamonds: "#7dd3fc",
  gemstone: "#6ee7b7", gemstones:"#6ee7b7",
  jewelry:  "#fca5a5", watches:  "#c4b5fd",
  watch:    "#c4b5fd", alpha:    "#fcd34d",
};

function getAccent(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(ACCENTS)) if (key.includes(k)) return v;
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue},55%,72%)`;
}

function getSubtitle(p: ApiProduct): string {
  if (p.watchBrand) return `${p.watchBrand}${p.watchMovement ? ` · ${p.watchMovement}` : ""}`;
  const parts: string[] = [];
  if (p.shape?.length) parts.push(p.shape[0].charAt(0).toUpperCase() + p.shape[0].slice(1));
  if (p.size) parts.push(`${p.size} ct`);
  if (p.clarity?.length) parts.push(p.clarity[0]);
  return parts.join(" · ") || (p.category?.name ?? "");
}

// ── Gem SVG ───────────────────────────────────────────────────────────────────

function GemShape({ shape = "other", color }: { shape?: string; color: string }) {
  const s = shape.toLowerCase();
  if (s.includes("round") || s.includes("brilliant")) return (
    <svg viewBox="0 0 80 80" width="60" height="60">
      <polygon points="40,8 68,22 74,50 58,68 22,68 6,50 12,22" fill={`${color}20`} stroke={color} strokeWidth="1"/>
      <polygon points="40,16 60,26 65,46 52,60 28,60 15,46 20,26" fill={`${color}0c`} stroke={color} strokeWidth="0.5"/>
      <circle cx="40" cy="40" r="3" fill={color} opacity="0.4"/>
    </svg>
  );
  if (s.includes("oval") || s.includes("pear")) return (
    <svg viewBox="0 0 80 80" width="60" height="60">
      <ellipse cx="40" cy="40" rx="30" ry="22" fill={`${color}20`} stroke={color} strokeWidth="1"/>
      <ellipse cx="40" cy="40" rx="20" ry="13" fill={`${color}0c`} stroke={color} strokeWidth="0.5"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 80 80" width="60" height="60">
      <polygon points="40,6 70,22 70,58 40,74 10,58 10,22" fill={`${color}20`} stroke={color} strokeWidth="1"/>
      <polygon points="40,18 60,28 60,52 40,62 20,52 20,28" fill={`${color}0c`} stroke={color} strokeWidth="0.5"/>
      <circle cx="40" cy="40" r="3" fill={color} opacity="0.4"/>
    </svg>
  );
}

// ── Featured Card (large left) ────────────────────────────────────────────────

function FeaturedCard({ product }: { product: ApiProduct }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const accent = getAccent(product.category?.name ?? "");
  const hasImg = product.images?.length > 0 && !imgError;

  return (
    <Link
      href={`/products/${product._id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="sm-featured-card"
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        background: "#080f1f",
        border: `1px solid ${hovered ? accent + "50" : "#1e3a5f33"}`,
        cursor: "pointer",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        boxShadow: hovered
          ? `0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 ${accent}22`
          : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* Full bleed image */}
      <div style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>
        {hasImg ? (
          <img
            src={product.images[0]}
            alt={product.name}
            onError={() => setImgError(true)}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", display: "block",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `radial-gradient(ellipse at center, ${accent}12 0%, transparent 70%)`,
          }}>
            <GemShape shape={product.shape?.[0]} color={accent} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #040e1f 0%, #040e1f88 30%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}cc, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s",
        }} />

        {/* Category badge top-left */}
        <div style={{
          position: "absolute", top: 16, left: 16,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: accent, background: "#040e1fcc",
          border: `1px solid ${accent}40`,
          padding: "4px 10px", borderRadius: 2,
          backdropFilter: "blur(8px)",
        }}>
          {product.category?.name}
        </div>

        {/* NEW badge */}
        <div style={{
          position: "absolute", top: 16, right: 16,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 8, fontWeight: 700,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "#040e1f", background: accent,
          padding: "4px 10px", borderRadius: 1,
        }}>
          Featured
        </div>
      </div>

      {/* Info overlay at bottom */}
      <div style={{ padding: "20px 22px 22px", position: "relative" }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", bottom: 0, left: "30%", transform: "translateX(-50%)",
          width: 160, height: 80,
          background: `radial-gradient(ellipse, ${accent}18 0%, transparent 70%)`,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s",
        }} />

        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9, fontWeight: 500,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: accent + "99", margin: "0 0 8px",
        }}>
          {getSubtitle(product)}
        </p>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 600,
          color: hovered ? "#f0f8ff" : "#c8d8f0",
          lineHeight: 1.2, margin: "0 0 14px",
          transition: "color 0.3s",
        }}>
          {product.name}
        </p>

        <div style={{
          height: 1,
          background: `linear-gradient(90deg, ${accent}66, transparent)`,
          marginBottom: 14,
          transform: hovered ? "scaleX(1)" : "scaleX(0.4)",
          transformOrigin: "left",
          transition: "transform 0.5s ease",
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
                fontSize: 10, color: "#2a4a7f",
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
            opacity: hovered ? 1 : 0.4,
            transform: hovered ? "translateX(0)" : "translateX(-6px)",
            transition: "opacity 0.3s, transform 0.3s",
          }}>
            View
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 8, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#f87171", marginTop: 8, marginBottom: 0,
          }}>
            Only {product.stock} left
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Small Card ────────────────────────────────────────────────────────────────

function SmallCard({ product }: { product: ApiProduct }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const accent = getAccent(product.category?.name ?? "");
  const hasImg = product.images?.length > 0 && !imgError;

  return (
    <Link
      href={`/products/${product._id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 14, alignItems: "center",
        textDecoration: "none",
        padding: "14px 16px",
        borderRadius: 2,
        background: hovered ? "#0c1628" : "#080f1f",
        border: `1px solid ${hovered ? accent + "44" : "#1e3a5f22"}`,
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${accent}18` : "none",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
        background: accent,
        transform: hovered ? "scaleY(1)" : "scaleY(0)",
        transformOrigin: "center",
        transition: "transform 0.3s ease",
        borderRadius: "0 1px 1px 0",
      }} />

      {/* Thumbnail */}
      <div style={{
        width: 58, height: 58, flexShrink: 0,
        borderRadius: 2, overflow: "hidden",
        background: `radial-gradient(ellipse, ${accent}18 0%, #040e1f 100%)`,
        border: `1px solid ${hovered ? accent + "40" : "#1e3a5f33"}`,
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
              transform: hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.4s ease",
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
          color: accent + "88", margin: "0 0 4px",
        }}>
          {product.category?.name}
        </p>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 14, fontWeight: 500,
          color: hovered ? "#d8eaff" : "#8aa8cc",
          lineHeight: 1.3, margin: "0 0 5px",
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          transition: "color 0.25s",
        }}>
          {product.name}
        </p>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 16, fontWeight: 700,
          color: hovered ? accent : accent + "bb",
          transition: "color 0.25s",
        }}>
          ${product.price.toLocaleString()}
        </span>
      </div>

      {/* Arrow */}
      <svg
        width="12" height="12" viewBox="0 0 16 16" fill="none"
        style={{
          flexShrink: 0, color: accent,
          opacity: hovered ? 0.9 : 0.2,
          transform: hovered ? "translateX(2px)" : "translateX(0)",
          transition: "opacity 0.25s, transform 0.25s",
        }}
      >
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <div style={{ background: "#080f1f", border: "1px solid #1e3a5f22", borderRadius: 3, overflow: "hidden", height: "100%" }}>
      <div className="sm-skel" style={{ height: "65%" }} />
      <div style={{ padding: "20px 22px" }}>
        <div className="sm-skel" style={{ height: 9, width: "40%", borderRadius: 1, marginBottom: 10 }} />
        <div className="sm-skel" style={{ height: 22, width: "85%", borderRadius: 1, marginBottom: 6 }} />
        <div className="sm-skel" style={{ height: 22, width: "60%", borderRadius: 1, marginBottom: 16 }} />
        <div className="sm-skel" style={{ height: 28, width: "35%", borderRadius: 1 }} />
      </div>
    </div>
  );
}

function SkeletonSmall() {
  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "center",
      padding: "14px 16px",
      background: "#080f1f", border: "1px solid #1e3a5f22", borderRadius: 2,
    }}>
      <div className="sm-skel" style={{ width: 58, height: 58, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="sm-skel" style={{ height: 8, width: "45%", borderRadius: 1, marginBottom: 7 }} />
        <div className="sm-skel" style={{ height: 13, width: "80%", borderRadius: 1, marginBottom: 6 }} />
        <div className="sm-skel" style={{ height: 15, width: "30%", borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SpecialsMarquee() {
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [featuredIndex, setFeaturedIndex]   = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products?limit=60", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAllProducts(json.data.filter((p: ApiProduct) => p.isActive));
        } else throw new Error("Unexpected response");
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") { setError(err.message); setLoading(false); }
      });
    return () => controller.abort();
  }, []);

  const categories = [
    { key: "all", label: "All" },
    ...Array.from(
      new Map(
        allProducts.filter((p) => p.category?._id)
          .map((p) => [p.category._id, { key: p.category._id, label: p.category.name }])
      ).values()
    ),
  ];

  const filtered = activeCategory === "all"
    ? allProducts
    : allProducts.filter((p) => p.category?._id === activeCategory);

  const featured  = filtered[featuredIndex] ?? filtered[0] ?? null;
  const sideItems = filtered.filter((_, i) => i !== featuredIndex).slice(0, 6);

  const activeAccent = featured ? getAccent(featured.category?.name ?? "") : "#7dd3fc";

  // Auto-rotate featured every 5s
  useEffect(() => {
    if (filtered.length <= 1) return;
    const t = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % Math.min(filtered.length, 8));
    }, 5000);
    return () => clearInterval(t);
  }, [filtered.length, activeCategory]);

  // Reset featured index on category change
  useEffect(() => { setFeaturedIndex(0); }, [activeCategory]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

        @keyframes sm-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes sm-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sm-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes sm-featIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }

        .sm-skel {
          background: linear-gradient(90deg, #080f1f 25%, #0f1e3a 50%, #080f1f 75%);
          background-size: 600px 100%;
          animation: sm-shimmer 1.8s infinite linear;
        }

        .sm-root {
          background: #040e1f;
          border-top: 1px solid #1e3a5f44;
          border-bottom: 1px solid #1e3a5f44;
          position: relative;
          overflow: hidden;
        }

        /* grid bg */
        .sm-root::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(30,58,95,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,58,95,0.05) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none;
          z-index: 0;
        }

        .sm-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 52px 40px 56px;
          position: relative;
          z-index: 2;
          animation: sm-fadeIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }

        .sm-cat-tab {
          font-family: 'Outfit', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          border: 1px solid transparent;
          background: transparent; cursor: pointer;
          padding: 6px 14px; border-radius: 1px;
          transition: all 0.2s ease; white-space: nowrap;
          position: relative;
        }

        .sm-featured-card {
          animation: sm-featIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* Layout: left big + right stack */
        .sm-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: stretch;
        }

        /* Right side: 2 cols of small cards */
        .sm-right {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 900px) {
          .sm-layout {
            grid-template-columns: 1fr;
          }
          .sm-right {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
          }
          .sm-inner { padding: 36px 20px 40px; }
        }

        @media (max-width: 540px) {
          .sm-right { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="sm-root">
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "60%", height: 1,
          background: `linear-gradient(90deg, transparent, ${activeAccent}66, transparent)`,
          transition: "background 0.5s ease", zIndex: 1,
        }} />
        <div style={{
          position: "absolute", top: -60, left: "25%",
          width: 400, height: 300, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${activeAccent}08 0%, transparent 70%)`,
          transition: "background 0.6s ease",
          pointerEvents: "none", zIndex: 1, filter: "blur(40px)",
        }} />

        <div className="sm-inner">

          {/* ── Section header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
            <div>
              {/* Label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: activeAccent,
                  animation: "sm-pulse 2s ease infinite",
                  boxShadow: `0 0 8px ${activeAccent}`,
                  flexShrink: 0,
                  transition: "background 0.4s, box-shadow 0.4s",
                }} />
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: activeAccent,
                  transition: "color 0.4s",
                }}>
                  Curated Selection
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(34px, 4.5vw, 60px)",
                fontWeight: 400, color: "#dce8f8",
                lineHeight: 1, letterSpacing: "-0.02em", margin: 0,
              }}>
                Our{" "}
                <em style={{
                  fontStyle: "italic",
                  color: activeAccent,
                  transition: "color 0.4s",
                }}>
                  Collection
                </em>
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16 }}>
              <Link href="/products" style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 10, fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: activeAccent, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 7,
                paddingBottom: 2,
                borderBottom: `1px solid ${activeAccent}44`,
                transition: "color 0.4s, border-color 0.4s",
              }}>
                View All
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              {/* Stats inline */}
              {!loading && (
                <div style={{ display: "flex", gap: 24 }}>
                  {[
                    { v: String(allProducts.length), l: "Products" },
                    { v: String(categories.length - 1), l: "Categories" },
                  ].map((s) => (
                    <div key={s.l} style={{ textAlign: "right" }}>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 20, fontWeight: 700,
                        color: activeAccent, margin: "0 0 2px",
                        transition: "color 0.4s",
                      }}>{s.v}</p>
                      <p style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 8, color: "#1e3a5f",
                        letterSpacing: "0.2em", textTransform: "uppercase",
                        margin: 0,
                      }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Category tabs ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            flexWrap: "wrap", marginBottom: 24,
            borderBottom: "1px solid #1e3a5f44",
            paddingBottom: 0,
          }}>
            {loading
              ? [80, 65, 100, 72, 88].map((w, i) => (
                  <div key={i} className="sm-skel" style={{ height: 28, width: w, borderRadius: 1, margin: "4px 4px 10px" }} />
                ))
              : categories.map((cat) => {
                  const isActive = activeCategory === cat.key;
                  const acc = cat.key === "all" ? "#7dd3fc" : getAccent(cat.label);
                  return (
                    <button
                      key={cat.key}
                      className="sm-cat-tab"
                      onClick={() => setActiveCategory(cat.key)}
                      style={{
                        color: isActive ? acc : "#1e3a5f",
                        background: isActive ? `${acc}12` : "transparent",
                        borderColor: isActive ? `${acc}35` : "transparent",
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
                })
            }
          </div>

          {/* ── Main layout ── */}
          {loading ? (
            <div className="sm-layout">
              <SkeletonFeatured />
              <div className="sm-right">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonSmall key={i} />)}
              </div>
            </div>
          ) : error ? (
            <div style={{
              padding: "48px 0", textAlign: "center",
              fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#1e3a5f",
            }}>
              Could not load products.{" "}
              <button onClick={() => window.location.reload()} style={{
                background: "none", border: "none", color: activeAccent,
                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                fontSize: 13, textDecoration: "underline",
              }}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: "48px 0", textAlign: "center",
              fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#1e3a5f",
            }}>
              No products in this category.
            </div>
          ) : (
            <div className="sm-layout" key={activeCategory}>

              {/* Featured (left) */}
              {featured && <FeaturedCard product={featured} />}

              {/* Small cards (right, 2×3 grid) */}
              <div className="sm-right">
                {sideItems.map((p, i) => (
                  <div
                    key={p._id}
                    style={{ animation: `sm-fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s both` }}
                    onClick={() => setFeaturedIndex(filtered.indexOf(p))}
                  >
                    <SmallCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured indicator dots */}
          {!loading && !error && filtered.length > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, marginTop: 22,
            }}>
              {Array.from({ length: Math.min(filtered.length, 8) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeaturedIndex(i)}
                  style={{
                    width: i === featuredIndex ? 20 : 5,
                    height: 5, borderRadius: 3,
                    background: i === featuredIndex ? activeAccent : "#1e3a5f",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
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
"use client";
import { useState, useEffect } from "react";

let clientCache = {};
let fetchPromise = null;

async function fetchAmazonPrices() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/amazon-sync")
    .then(res => res.json())
    .then(data => {
      if (data.products) {
        data.products.forEach(p => {
          const asin = p.asin;
          if (!asin) return;
          const src = data.source;
          const amazon = p.amazon || {};
          const catalog = p.catalog || {};
          clientCache[asin] = {
            price: (src === "amazon-paapi" ? amazon.price : catalog.price) || "",
            oldPrice: (src === "amazon-paapi" ? amazon.oldPrice : catalog.oldPrice) || "",
            rating: (src === "amazon-paapi" ? amazon.rating : catalog.rating) || 0,
            reviews: (src === "amazon-paapi" ? amazon.reviews : catalog.reviews) || 0,
            isPrime: amazon.isPrime || false,
            isAvailable: amazon.isAvailable !== false,
            image: amazon.image || catalog.image || "",
            imageLarge: amazon.imageLarge || "",
            imageMedium: amazon.imageMedium || "",
            imageVariants: amazon.imageVariants || [],
            brand: amazon.brand || "",
            features: amazon.features || [],
            discount: amazon.discount || 0,
            source: src,
            lastUpdated: amazon.lastUpdated || null,
          };
        });
      }
      return clientCache;
    })
    .catch(() => clientCache)
    .finally(() => { fetchPromise = null; });
  return fetchPromise;
}

export function useLivePrice(asin, fallback = {}) {
  const [data, setData] = useState({
    price: fallback.price || "", oldPrice: fallback.oldPrice || "",
    rating: fallback.rating || 0, reviews: fallback.reviews || 0,
    isPrime: false, isAvailable: true, discount: 0,
    image: fallback.image || "", imageLarge: "", imageMedium: "",
    imageVariants: [], brand: "", features: [],
    loading: true, source: "catalog",
  });

  useEffect(() => {
    if (!asin) { setData(d => ({ ...d, loading: false })); return; }
    if (clientCache[asin]) { setData({ ...clientCache[asin], loading: false }); return; }
    fetchAmazonPrices().then(cache => {
      if (cache[asin]) setData({ ...cache[asin], loading: false });
      else setData(d => ({ ...d, loading: false }));
    });
  }, [asin]);

  return data;
}

export default function LivePrice({ asin, catalogPrice, catalogOldPrice, catalogRating, catalogReviews, showDetails = false }) {
  const data = useLivePrice(asin, {
    price: catalogPrice, oldPrice: catalogOldPrice,
    rating: catalogRating, reviews: catalogReviews,
  });

  const price = data.price || catalogPrice;
  const oldPrice = data.oldPrice || catalogOldPrice || "";
  const rating = data.rating || catalogRating || 0;
  const reviews = data.reviews || catalogReviews || 0;
  const isLive = data.source === "amazon-paapi";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#059669" }}>{price}€</span>
        {oldPrice && <span style={{ fontSize: 13, color: "#94A3B8", textDecoration: "line-through" }}>{oldPrice}€</span>}
        {data.discount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "2px 6px", borderRadius: 4 }}>-{data.discount}%</span>
        )}
      </div>
      {showDetails && rating > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ color: "#F59E0B", fontSize: 12 }}>{"★".repeat(Math.floor(rating))}</span>
          <span style={{ fontSize: 12, color: "#64748B" }}>{rating}/5 ({reviews.toLocaleString("es")})</span>
        </div>
      )}
      {showDetails && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          {data.isPrime && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 6px", borderRadius: 4 }}>Prime</span>
          )}
          {isLive && <span style={{ fontSize: 10, color: "#059669" }}>Precio en tiempo real</span>}
          {!isLive && !data.loading && <span style={{ fontSize: 10, color: "#94A3B8" }}>Precio orientativo</span>}
          {data.loading && <span style={{ fontSize: 10, color: "#94A3B8" }}>Consultando...</span>}
        </div>
      )}
    </div>
  );
}

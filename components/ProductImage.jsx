"use client";
import { useState } from "react";

export default function ProductImage({ src, alt, width, height, className, style, title, priority }) {
  const [error, setError] = useState(false);
  const seoAlt = alt || "Producto de hogar inteligente - ComparaHogar.es";

  if (error || !src) {
    return (
      <div role="img" aria-label={seoAlt} style={{
        width: width || "100%", height: height || 200,
        background: "#F1F5F9", borderRadius: 12,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#94A3B8", fontSize: 13, gap: 8, ...style,
      }}>
        <span style={{ fontSize: 36 }}>📦</span>
        <span>Imagen no disponible</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={seoAlt}
      title={title || seoAlt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setError(true)}
      className={className}
      style={{ objectFit: "contain", maxWidth: "100%", ...style }}
      itemProp="image"
    />
  );
}

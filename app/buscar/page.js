"use client";
import { useState } from "react";
import Link from "next/link";
import { PRODUCTS, CATEGORIES } from "@/lib/products";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();
  const results = q.length >= 2 ? PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.shortDesc?.toLowerCase().includes(q) || p.category.includes(q)
  ) : [];

  return (
    <div className="search-page">
      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>Buscar productos</h1>
        <input className="search-input" type="text" placeholder="Busca robots aspiradores, camaras, altavoces..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        {q.length >= 2 && (
          <p style={{ margin: "16px 0", color: "#8A8894", fontSize: 14 }}>{results.length} resultado{results.length !== 1 ? "s" : ""} para "{query}"</p>
        )}
        <div className="products-grid" style={{ marginTop: 20, gridTemplateColumns: "repeat(3, 1fr)" }}>
          {results.map(p => {
            const cat = CATEGORIES.find(c => c.id === p.category);
            return (
              <Link key={p.id} href={`/${p.slug}`} className="product-card">
                <div className="product-card-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
                <div className="product-card-body">
                  <div className="product-card-cat">{cat?.name}</div>
                  <div className="product-card-name">{p.name}</div>
                  <div className="product-card-price"><span className="current">{p.price}&euro;</span></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";

var DEFAULT_OFFERS = [
  { label: "Oferta de la semana", title: "Roborock S8 MaxV Ultra", subtitle: "40% dto. - Solo esta semana", url: "https://www.amazon.es/dp/B0CRV7F37B?tag=digitalconect-21", color: "#10B981", image: "https://m.media-amazon.com/images/I/71cihNMRF4L._AC_SL1500_.jpg" },
  { label: "Descubre", title: "Dreame L10s Ultra Gen 2", subtitle: "El mas vendido de 2026", url: "https://www.amazon.es/dp/B0CP3KM3KJ?tag=digitalconect-21", color: "#8B5CF6", image: "https://m.media-amazon.com/images/I/61gvoVh3u-L._AC_SL1200_.jpg" },
  { label: "Precio minimo", title: "TP-Link Tapo C320WS", subtitle: "Seguridad sin cuotas desde 35 EUR", url: "https://www.amazon.es/dp/B09GKZ6GN9?tag=digitalconect-21", color: "#F97316", image: "https://m.media-amazon.com/images/I/51jijSVYBjL._AC_SL1500_.jpg" },
];

function proxyImg(url) {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return "/api/img?url=" + encodeURIComponent(url);
  return url;
}

export default function HomeOffers() {
  var [offers, setOffers] = useState(DEFAULT_OFFERS);

  useEffect(function() {
    fetch("/api/db/admin?type=config&configKey=home_offers&key=Compra2026")
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) setOffers(json.data);
      })
      .catch(function() {});
  }, []);

  if (!offers || offers.length === 0) return null;

  return (
    <section className="offers-strip">
      <div className="container">
        <div className="offers-grid">
          {offers.map(function(offer, i) {
            return (
              <a key={i} href={offer.url} target="_blank" rel="noopener noreferrer nofollow" className="offer-card" style={{ "--offer-color": offer.color || "#10B981" }}>
                <div className="offer-card-content">
                  <span className="offer-label">{offer.label}</span>
                  <h3 className="offer-title">{offer.title}</h3>
                  <p className="offer-subtitle">{offer.subtitle}</p>
                  <span className="offer-btn">
                    Ver en Amazon
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
                {offer.image && <div className="offer-card-img"><img src={proxyImg(offer.image)} alt={offer.title} /></div>}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

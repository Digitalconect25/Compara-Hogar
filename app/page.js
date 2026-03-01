import Link from "next/link";
import { getProducts, CATEGORIES } from "@/lib/data";
import { proxyImg } from "@/lib/utils";
import HeroBanner from "@/components/HeroBanner";

export const revalidate = 60; // ISR: refresh every 60s

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return <span className="product-card-stars">{"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}</span>;
}

function discount(price, oldPrice) {
  if (!oldPrice) return null;
  const p = parseFloat(String(price).replace(/[^\d,]/g, "").replace(",", "."));
  const o = parseFloat(String(oldPrice).replace(/[^\d,]/g, "").replace(",", "."));
  if (!p || !o || o <= p) return null;
  return Math.round(((o - p) / o) * 100);
}

function ProductCard({ p }) {
  const disc = discount(p.price, p.oldPrice);
  return (
    <Link href={`/${p.slug}`} className="product-card">
      <div className="product-card-image">
        {p.badge && <span className="product-card-badge" style={{ background: p.badgeColor || "var(--accent)" }}>{p.badge}</span>}
        <img src={proxyImg(p.image)} alt={p.imageAlt || p.name} loading="lazy" />
        <div className="product-card-cta">Ver analisis completo</div>
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{p.name}</h3>
        <div className="product-card-rating"><StarRating rating={p.rating} /><span className="product-card-reviews">({p.reviews})</span></div>
        <div className="product-card-prices">
          <span className="product-card-price">{p.price}&euro;</span>
          {p.oldPrice && <span className="product-card-oldprice">{p.oldPrice}&euro;</span>}
          {disc && <span className="product-card-discount">-{disc}%</span>}
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const PRODUCTS = await getProducts();
  const featured = PRODUCTS.filter(p => p.weeklyBest);
  const bestSellers = PRODUCTS.slice(0, 6);

  return (
    <>
      <HeroBanner />
      <div className="trust-strip"><div className="trust-strip-inner">
        <div className="trust-item"><div className="trust-icon trust-icon-green">&#x1F50D;</div><div className="trust-text"><h4>Analisis reales</h4><p>Probamos cada producto durante semanas</p></div></div>
        <div className="trust-item"><div className="trust-icon trust-icon-orange">&#x1F6AB;</div><div className="trust-text"><h4>Sin patrocinios</h4><p>Opiniones 100% independientes</p></div></div>
        <div className="trust-item"><div className="trust-icon trust-icon-purple">&#x1F4B0;</div><div className="trust-text"><h4>Precios actualizados</h4><p>Sincronizados con Amazon.es</p></div></div>
        <div className="trust-item"><div className="trust-icon trust-icon-blue">&#x1F4DA;</div><div className="trust-text"><h4>Guias gratuitas</h4><p>Todo el contenido libre y accesible</p></div></div>
      </div></div>

      <section className="section"><div className="container">
        <div className="section-header"><h2 className="section-title">Explora por categoria</h2></div>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/comparativas/${cat.slug || cat.id}`} className="category-card">
              <div className="category-icon" style={{ background: cat.color + "15" }}>{cat.icon}</div>
              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div></section>

      <section className="section section-bg"><div className="container">
        <div className="section-header">
          <h2 className="section-title">Productos destacados</h2>
          <Link href="/comparativas" className="section-viewall">Ver todos &rarr;</Link>
        </div>
        <div className="product-grid">{featured.map(p => <ProductCard key={p.id || p.slug} p={p} />)}</div>
      </div></section>

      <section className="section"><div className="container">
        <div className="promo-grid">
          <Link href="/comparativas/mejores-robots-aspiradores" className="promo-card" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
            <span className="promo-label" style={{ color: "var(--accent-dark)" }}>Comparativa 2026</span>
            <h3 className="promo-title" style={{ color: "var(--text-primary)" }}>Top 5 Robots Aspiradores</h3>
            <p className="promo-subtitle" style={{ color: "var(--text-secondary)" }}>3 meses de pruebas reales</p>
            <span className="promo-btn" style={{ background: "var(--accent)", color: "#fff" }}>Ver comparativa &rarr;</span>
            {PRODUCTS[0]?.image && <img src={proxyImg(PRODUCTS[0].image)} alt="" className="promo-img" style={{ maxHeight: "160px" }} />}
          </Link>
          <Link href="/comparativas/camaras-seguridad-baratas" className="promo-card" style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
            <span className="promo-label" style={{ color: "var(--purple)" }}>Menos de 70 euros</span>
            <h3 className="promo-title" style={{ color: "var(--text-primary)" }}>Camaras de seguridad</h3>
            <p className="promo-subtitle" style={{ color: "var(--text-secondary)" }}>Sin suscripcion mensual</p>
            <span className="promo-btn" style={{ background: "var(--purple)", color: "#fff" }}>Ver comparativa &rarr;</span>
            {PRODUCTS[6]?.image && <img src={proxyImg(PRODUCTS[6].image)} alt="" className="promo-img" style={{ maxHeight: "140px" }} />}
          </Link>
          <Link href="/guias/domotica-principiantes" className="promo-card promo-card-full" style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)" }}>
            <span className="promo-label" style={{ color: "var(--orange)" }}>Guia gratuita</span>
            <h3 className="promo-title" style={{ color: "var(--text-primary)" }}>Hogar inteligente por menos de 200 euros</h3>
            <span className="promo-btn" style={{ background: "var(--orange)", color: "#fff" }}>Leer guia &rarr;</span>
          </Link>
        </div>
      </div></section>

      <section className="section section-bg"><div className="container">
        <div className="section-header"><h2 className="section-title">Los mas analizados</h2></div>
        <div className="bestseller-grid">
          {bestSellers.map(p => (
            <Link key={p.id || p.slug} href={`/${p.slug}`} className="bestseller-card">
              <div className="bestseller-img"><img src={proxyImg(p.image)} alt={p.name} loading="lazy" /></div>
              <div className="bestseller-info">
                <h3 className="bestseller-name">{p.name}</h3>
                <div className="bestseller-prices">
                  {p.oldPrice && <span className="bestseller-oldprice">{p.oldPrice}&euro;</span>}
                  <span className="bestseller-price">{p.price}&euro;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div></section>

      <section className="section"><div className="container">
        <div className="section-header"><h2 className="section-title">Todos los productos</h2></div>
        <div className="product-grid">{PRODUCTS.filter(p => !p.weeklyBest).map(p => <ProductCard key={p.id || p.slug} p={p} />)}</div>
      </div></section>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getProductBySlug, getProductsByCategory, getAmazonUrl, CATEGORIES, SITE_CONFIG } from "@/lib/data";
import { PRODUCTS as STATIC_PRODUCTS } from "@/lib/products";
import { proxyImg } from "@/lib/utils";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return STATIC_PRODUCTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Producto no encontrado" };
  return { title: p.metaTitle || p.name, description: p.metaDescription || p.shortDesc };
}

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return <span className="product-stars">{"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}</span>;
}

function discount(price, oldPrice) {
  if (!oldPrice) return null;
  const p = parseFloat(String(price).replace(/[^\d,]/g, "").replace(",", "."));
  const o = parseFloat(String(oldPrice).replace(/[^\d,]/g, "").replace(",", "."));
  if (!p || !o || o <= p) return null;
  return Math.round(((o - p) / o) * 100);
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const cat = CATEGORIES.find(c => c.id === product.category);
  const related = (await getProductsByCategory(product.category)).filter(p => p.slug !== product.slug).slice(0, 4);
  const disc = discount(product.price, product.oldPrice);
  const ratingScore = product.rating >= 4.0 ? "high" : product.rating >= 3.0 ? "mid" : "low";

  const productSchema = {
    "@context": "https://schema.org", "@type": "Product", "name": product.name,
    "image": product.image, "description": product.shortDesc,
    "review": { "@type": "Review", "reviewRating": { "@type": "Rating", "ratingValue": product.rating, "bestRating": "5" }, "author": { "@type": "Organization", "name": "ComparaHogar" } },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": product.rating, "reviewCount": product.reviews },
    "offers": { "@type": "Offer", "url": getAmazonUrl(product.amazonUrl), "priceCurrency": "EUR", "price": String(product.price).replace(",", "."), "availability": "https://schema.org/InStock" }
  };

  return (
    <div className="product-detail"><div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="product-detail-grid">
        <div className="product-gallery"><div className="product-gallery-main">
          {product.badge && <span className="product-gallery-badge" style={{ background: product.badgeColor || "var(--accent)" }}>{product.badge}</span>}
          <img src={proxyImg(product.image)} alt={product.imageAlt || product.name} />
        </div></div>
        <div className="product-info">
          <div className="product-breadcrumb">
            <Link href="/">Inicio</Link><span>/</span>
            {cat && <><Link href={`/comparativas/${cat.slug || cat.id}`}>{cat.name}</Link><span>/</span></>}
            <span style={{ color: "var(--text-primary)" }}>{product.name}</span>
          </div>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-rating-row"><Stars rating={product.rating} /><span className="product-rating-num">{product.rating}</span><span className="product-reviews-count">({product.reviews?.toLocaleString("es-ES")} opiniones)</span></div>
          <p className="product-short-desc">{product.shortDesc}</p>
          <hr className="product-divider" />
          <div className="product-price-block">
            <div className="product-price-row">
              <span className="product-price-current">{product.price}&euro;</span>
              {product.oldPrice && <span className="product-price-old">{product.oldPrice}&euro;</span>}
              {disc && <span className="product-price-save">Ahorras {disc}%</span>}
            </div>
          </div>
          <a href={getAmazonUrl(product.amazonUrl)} target="_blank" rel="nofollow noopener noreferrer sponsored" className="product-amazon-btn">Ver en Amazon.es</a>
          <p className="product-affiliate-note">* Enlace de afiliado. Comision sin coste adicional para ti.</p>
          <hr className="product-divider" />
          <div className="product-proscons">
            {product.pros?.length > 0 && <><h3>Lo mejor</h3><ul className="pros-list">{product.pros.slice(0, 4).map((pro, i) => <li key={i}>{pro}</li>)}</ul></>}
            {product.cons?.length > 0 && <><h3>A mejorar</h3><ul className="cons-list">{product.cons.slice(0, 3).map((con, i) => <li key={i}>{con}</li>)}</ul></>}
          </div>
        </div>
      </div>
      <div className="review-section">
        <div className="review-block" id="analisis"><h2>Analisis en profundidad</h2>
          {(product.longDesc || product.shortDesc || "").split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <div className="review-block" id="veredicto"><h2>Veredicto</h2>
          <div className="verdict-box"><div className={`verdict-score ${ratingScore}`}>{product.rating}</div><div className="verdict-text"><h3>{product.name}</h3><p>{product.verdict || product.shortDesc}</p></div></div>
        </div>
        {product.pros && <div className="review-block" id="faq"><h2>Preguntas frecuentes</h2>
          <details className="faq-item"><summary>Merece la pena el {product.name}?</summary><p>{product.verdict || product.shortDesc}</p></details>
          <details className="faq-item"><summary>Mejor precio del {product.name}?</summary><p>En Amazon.es por {product.price}&euro;{product.oldPrice ? `, rebajado desde ${product.oldPrice}\u20AC` : ""}.</p></details>
        </div>}
      </div>
      {related.length > 0 && <div className="related-section" id="alternativas">
        <div className="section-header"><h2 className="section-title">Alternativas</h2></div>
        <div className="product-grid">
          {related.map(p => (
            <Link key={p.slug} href={`/${p.slug}`} className="product-card">
              <div className="product-card-image"><img src={proxyImg(p.image)} alt={p.name} loading="lazy" /><div className="product-card-cta">Ver analisis</div></div>
              <div className="product-card-info"><h3 className="product-card-name">{p.name}</h3>
                <div className="product-card-prices"><span className="product-card-price">{p.price}&euro;</span></div>
              </div>
            </Link>
          ))}
        </div>
      </div>}
    </div></div>
  );
}

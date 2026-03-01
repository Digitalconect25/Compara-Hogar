import { PRODUCTS, COMPARATIVES, GUIAS, BLOG_POSTS } from "@/lib/products";

const BASE = "https://comparahogar.es";

export default function sitemap() {
  const now = new Date().toISOString();

  const staticPages = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/comparativas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/guias`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/privacidad`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/aviso-legal`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/afiliados`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages = PRODUCTS.map(p => ({
    url: `${BASE}/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const comparativaPages = COMPARATIVES.map(c => ({
    url: `${BASE}/comparativas/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const guiaPages = GUIAS.map(g => ({
    url: `${BASE}/guias/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogPages = BLOG_POSTS.map(b => ({
    url: `${BASE}/blog/${b.slug}`,
    lastModified: b.date || now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...comparativaPages, ...guiaPages, ...blogPages];
}

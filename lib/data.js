import * as db from "./db";
import { PRODUCTS as STATIC_PRODUCTS, BLOG_POSTS as STATIC_BLOGS, GUIAS as STATIC_GUIAS, 
  COMPARATIVES as STATIC_COMPARATIVES, CATEGORIES, getAmazonUrl, SITE_CONFIG } from "./products";

// Re-export static stuff that doesn't change
export { CATEGORIES, getAmazonUrl, SITE_CONFIG };

// Try DB, fallback to static file
async function tryDB(dbFn, fallback) {
  try {
    const result = await dbFn();
    if (result && (Array.isArray(result) ? result.length > 0 : true)) return result;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function getProducts() {
  return tryDB(() => db.getProducts(), STATIC_PRODUCTS);
}

export async function getProductBySlug(slug) {
  return tryDB(() => db.getProductBySlug(slug), STATIC_PRODUCTS.find(p => p.slug === slug) || null);
}

export async function getProductsByCategory(categoryId) {
  return tryDB(() => db.getProductsByCategory(categoryId), STATIC_PRODUCTS.filter(p => p.category === categoryId));
}

export async function getBlogPosts() {
  return tryDB(() => db.getBlogPosts(), STATIC_BLOGS);
}

export async function getBlogBySlug(slug) {
  return tryDB(() => db.getBlogBySlug(slug), STATIC_BLOGS.find(b => b.slug === slug) || null);
}

export async function getGuias() {
  return tryDB(() => db.getGuias(), STATIC_GUIAS);
}

export async function getGuiaBySlug(slug) {
  return tryDB(() => db.getGuiaBySlug(slug), STATIC_GUIAS.find(g => g.slug === slug) || null);
}

export async function getComparatives() {
  return tryDB(() => db.getComparatives(), STATIC_COMPARATIVES);
}

export async function getComparativeBySlug(slug) {
  return tryDB(() => db.getComparativeBySlug(slug), STATIC_COMPARATIVES.find(c => c.slug === slug) || null);
}

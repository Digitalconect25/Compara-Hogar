import { sql } from "@vercel/postgres";

// ============ PRODUCTS ============
export async function getProducts() {
  const { rows } = await sql`SELECT * FROM products ORDER BY position ASC, id ASC`;
  return rows.map(formatProduct);
}

export async function getProductBySlug(slug) {
  const { rows } = await sql`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? formatProduct(rows[0]) : null;
}

export async function getProductsByCategory(categoryId) {
  const { rows } = await sql`SELECT * FROM products WHERE category = ${categoryId} ORDER BY position ASC`;
  return rows.map(formatProduct);
}

export async function upsertProduct(product) {
  const { rows } = await sql`
    INSERT INTO products (slug, name, short_desc, long_desc, price, old_price, image, image_alt, image_title, 
      category, badge, badge_color, rating, reviews, pros, cons, verdict, amazon_url, meta_title, meta_description, 
      weekly_best, position)
    VALUES (${product.slug}, ${product.name}, ${product.shortDesc || ""}, ${product.longDesc || ""}, 
      ${product.price}, ${product.oldPrice || null}, ${product.image || ""}, ${product.imageAlt || ""}, 
      ${product.imageTitle || ""}, ${product.category}, ${product.badge || null}, ${product.badgeColor || null},
      ${product.rating || 0}, ${product.reviews || 0}, ${JSON.stringify(product.pros || [])}, 
      ${JSON.stringify(product.cons || [])}, ${product.verdict || ""}, ${product.amazonUrl || ""},
      ${product.metaTitle || ""}, ${product.metaDescription || ""}, ${product.weeklyBest || false},
      ${product.position || 0})
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, short_desc = EXCLUDED.short_desc, long_desc = EXCLUDED.long_desc,
      price = EXCLUDED.price, old_price = EXCLUDED.old_price, image = EXCLUDED.image,
      image_alt = EXCLUDED.image_alt, image_title = EXCLUDED.image_title, category = EXCLUDED.category,
      badge = EXCLUDED.badge, badge_color = EXCLUDED.badge_color, rating = EXCLUDED.rating,
      reviews = EXCLUDED.reviews, pros = EXCLUDED.pros, cons = EXCLUDED.cons, verdict = EXCLUDED.verdict,
      amazon_url = EXCLUDED.amazon_url, meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
      weekly_best = EXCLUDED.weekly_best, position = EXCLUDED.position, updated_at = NOW()
    RETURNING *`;
  return rows[0] ? formatProduct(rows[0]) : null;
}

export async function deleteProduct(slug) {
  await sql`DELETE FROM products WHERE slug = ${slug}`;
}

// ============ BLOG POSTS ============
export async function getBlogPosts() {
  const { rows } = await sql`SELECT * FROM blog_posts ORDER BY created_at DESC`;
  return rows.map(formatBlog);
}

export async function getBlogBySlug(slug) {
  const { rows } = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? formatBlog(rows[0]) : null;
}

export async function upsertBlogPost(post) {
  const { rows } = await sql`
    INSERT INTO blog_posts (slug, title, excerpt, content, image, image_alt, tag, tag_color, 
      date, read_time, meta_title, meta_description, ctas)
    VALUES (${post.slug}, ${post.title}, ${post.excerpt || ""}, ${post.content || ""}, 
      ${post.image || ""}, ${post.imageAlt || ""}, ${post.tag || "Blog"}, ${post.tagColor || null},
      ${post.date || new Date().toISOString().split("T")[0]}, ${post.readTime || "5 min"},
      ${post.metaTitle || ""}, ${post.metaDescription || ""}, ${JSON.stringify(post.ctas || [])})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
      image = EXCLUDED.image, image_alt = EXCLUDED.image_alt, tag = EXCLUDED.tag,
      tag_color = EXCLUDED.tag_color, date = EXCLUDED.date, read_time = EXCLUDED.read_time,
      meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
      ctas = EXCLUDED.ctas, updated_at = NOW()
    RETURNING *`;
  return rows[0] ? formatBlog(rows[0]) : null;
}

export async function deleteBlogPost(slug) {
  await sql`DELETE FROM blog_posts WHERE slug = ${slug}`;
}

// ============ GUIAS ============
export async function getGuias() {
  const { rows } = await sql`SELECT * FROM guias ORDER BY created_at DESC`;
  return rows.map(formatGuia);
}

export async function getGuiaBySlug(slug) {
  const { rows } = await sql`SELECT * FROM guias WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? formatGuia(rows[0]) : null;
}

export async function upsertGuia(guia) {
  const { rows } = await sql`
    INSERT INTO guias (slug, title, excerpt, content, image, image_alt, read_time, 
      meta_title, meta_description, ctas)
    VALUES (${guia.slug}, ${guia.title}, ${guia.excerpt || ""}, ${guia.content || ""}, 
      ${guia.image || ""}, ${guia.imageAlt || ""}, ${guia.readTime || "10 min"},
      ${guia.metaTitle || ""}, ${guia.metaDescription || ""}, ${JSON.stringify(guia.ctas || [])})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
      image = EXCLUDED.image, image_alt = EXCLUDED.image_alt, read_time = EXCLUDED.read_time,
      meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
      ctas = EXCLUDED.ctas, updated_at = NOW()
    RETURNING *`;
  return rows[0] ? formatGuia(rows[0]) : null;
}

export async function deleteGuia(slug) {
  await sql`DELETE FROM guias WHERE slug = ${slug}`;
}

// ============ COMPARATIVES ============
export async function getComparatives() {
  const { rows } = await sql`SELECT * FROM comparatives ORDER BY created_at DESC`;
  return rows.map(formatComparative);
}

export async function getComparativeBySlug(slug) {
  const { rows } = await sql`SELECT * FROM comparatives WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? formatComparative(rows[0]) : null;
}

// ============ FORMATTERS (DB snake_case -> JS camelCase) ============
export async function upsertComparative(comp) {
  const { rows } = await sql`INSERT INTO comparatives (slug, title, subtitle, tag, image, image_alt, meta_title, meta_description, items) VALUES (${comp.slug}, ${comp.title}, ${comp.subtitle || ''}, ${comp.tag || ''}, ${comp.image || ''}, ${comp.imageAlt || ''}, ${comp.metaTitle || ''}, ${comp.metaDescription || ''}, ${JSON.stringify(comp.items || [])}) ON CONFLICT (slug) DO UPDATE SET title=${comp.title}, subtitle=${comp.subtitle || ''}, tag=${comp.tag || ''}, image=${comp.image || ''}, image_alt=${comp.imageAlt || ''}, meta_title=${comp.metaTitle || ''}, meta_description=${comp.metaDescription || ''}, items=${JSON.stringify(comp.items || [])}, updated_at=NOW() RETURNING *`;
  return formatComparative(rows[0]);
}

export async function deleteComparative(slug) {
  await sql`DELETE FROM comparatives WHERE slug=${slug}`;
}

function formatProduct(row) {
  return {
    id: row.id, slug: row.slug, name: row.name, shortDesc: row.short_desc, longDesc: row.long_desc,
    price: row.price, oldPrice: row.old_price, image: row.image, imageAlt: row.image_alt,
    imageTitle: row.image_title, category: row.category, badge: row.badge, badgeColor: row.badge_color,
    rating: parseFloat(row.rating) || 0, reviews: parseInt(row.reviews) || 0,
    pros: typeof row.pros === "string" ? JSON.parse(row.pros) : (row.pros || []),
    cons: typeof row.cons === "string" ? JSON.parse(row.cons) : (row.cons || []),
    verdict: row.verdict, amazonUrl: row.amazon_url, metaTitle: row.meta_title,
    metaDescription: row.meta_description, weeklyBest: row.weekly_best, position: row.position,
  };
}

function formatBlog(row) {
  return {
    slug: row.slug, title: row.title, excerpt: row.excerpt, content: row.content,
    image: row.image, imageAlt: row.image_alt, tag: row.tag, tagColor: row.tag_color,
    date: row.date, readTime: row.read_time, metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ctas: typeof row.ctas === "string" ? JSON.parse(row.ctas) : (row.ctas || []),
  };
}

function formatGuia(row) {
  return {
    slug: row.slug, title: row.title, excerpt: row.excerpt, content: row.content,
    image: row.image, imageAlt: row.image_alt, readTime: row.read_time,
    metaTitle: row.meta_title, metaDescription: row.meta_description,
    ctas: typeof row.ctas === "string" ? JSON.parse(row.ctas) : (row.ctas || []),
  };
}

function formatComparative(row) {
  return {
    slug: row.slug, title: row.title, subtitle: row.subtitle, tag: row.tag,
    image: row.image, imageAlt: row.image_alt, metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    items: typeof row.items === "string" ? JSON.parse(row.items) : (row.items || []),
  };
}

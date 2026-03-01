import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { PRODUCTS, BLOG_POSTS, GUIAS, COMPARATIVES } from "@/lib/products";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== (process.env.ADMIN_KEY || "comparahogar2026")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { products: 0, blogs: 0, guias: 0, comparatives: 0, errors: [] };

  try {
    // PRODUCTS
    for (const p of PRODUCTS) {
      try {
        await sql`INSERT INTO products (slug, name, short_desc, long_desc, price, old_price, image, image_alt,
          image_title, category, badge, badge_color, rating, reviews, pros, cons, verdict, amazon_url,
          meta_title, meta_description, weekly_best, position)
        VALUES (${p.slug}, ${p.name}, ${p.shortDesc || ""}, ${p.longDesc || ""}, ${p.price}, ${p.oldPrice || null},
          ${p.image || ""}, ${p.imageAlt || ""}, ${p.imageTitle || ""}, ${p.category}, ${p.badge || null},
          ${p.badgeColor || null}, ${p.rating || 0}, ${p.reviews || 0}, ${JSON.stringify(p.pros || [])},
          ${JSON.stringify(p.cons || [])}, ${p.verdict || ""}, ${p.amazonUrl || ""},
          ${p.metaTitle || ""}, ${p.metaDescription || ""}, ${p.weeklyBest || false}, ${p.position || 0})
        ON CONFLICT (slug) DO NOTHING`;
        results.products++;
      } catch (e) { results.errors.push(`Product ${p.slug}: ${e.message}`); }
    }

    // BLOG POSTS
    for (const b of BLOG_POSTS) {
      try {
        await sql`INSERT INTO blog_posts (slug, title, excerpt, content, image, image_alt, tag, tag_color,
          date, read_time, meta_title, meta_description, ctas)
        VALUES (${b.slug}, ${b.title}, ${b.excerpt || ""}, ${b.content || ""}, ${b.image || ""},
          ${b.imageAlt || ""}, ${b.tag || "Blog"}, ${b.tagColor || null}, ${b.date || ""},
          ${b.readTime || "5 min"}, ${b.metaTitle || ""}, ${b.metaDescription || ""},
          ${JSON.stringify(b.ctas || [])})
        ON CONFLICT (slug) DO NOTHING`;
        results.blogs++;
      } catch (e) { results.errors.push(`Blog ${b.slug}: ${e.message}`); }
    }

    // GUIAS
    for (const g of GUIAS) {
      try {
        await sql`INSERT INTO guias (slug, title, excerpt, content, image, image_alt, read_time,
          meta_title, meta_description, ctas)
        VALUES (${g.slug}, ${g.title}, ${g.excerpt || ""}, ${g.content || ""}, ${g.image || ""},
          ${g.imageAlt || ""}, ${g.readTime || "10 min"}, ${g.metaTitle || ""}, ${g.metaDescription || ""},
          ${JSON.stringify(g.ctas || [])})
        ON CONFLICT (slug) DO NOTHING`;
        results.guias++;
      } catch (e) { results.errors.push(`Guia ${g.slug}: ${e.message}`); }
    }

    // COMPARATIVES
    for (const c of COMPARATIVES) {
      try {
        await sql`INSERT INTO comparatives (slug, title, subtitle, tag, image, image_alt,
          meta_title, meta_description, items)
        VALUES (${c.slug}, ${c.title}, ${c.subtitle || ""}, ${c.tag || ""}, ${c.image || ""},
          ${c.imageAlt || ""}, ${c.metaTitle || ""}, ${c.metaDescription || ""},
          ${JSON.stringify(c.items || [])})
        ON CONFLICT (slug) DO NOTHING`;
        results.comparatives++;
      } catch (e) { results.errors.push(`Comparative ${c.slug}: ${e.message}`); }
    }

    return NextResponse.json({ success: true, inserted: results });
  } catch (error) {
    return NextResponse.json({ error: error.message, partial: results }, { status: 500 });
  }
}

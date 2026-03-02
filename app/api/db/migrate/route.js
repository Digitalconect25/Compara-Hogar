import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== (process.env.ADMIN_KEY || "Compra2026")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await sql`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY, slug VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(500) NOT NULL,
      short_desc TEXT DEFAULT '', long_desc TEXT DEFAULT '', price VARCHAR(50) DEFAULT '0',
      old_price VARCHAR(50), image TEXT DEFAULT '', image_alt VARCHAR(500) DEFAULT '',
      image_title VARCHAR(500) DEFAULT '', category VARCHAR(100) DEFAULT '',
      badge VARCHAR(100), badge_color VARCHAR(50), rating DECIMAL(3,1) DEFAULT 0,
      reviews INTEGER DEFAULT 0, pros JSONB DEFAULT '[]', cons JSONB DEFAULT '[]',
      verdict TEXT DEFAULT '', amazon_url TEXT DEFAULT '', meta_title VARCHAR(500) DEFAULT '',
      meta_description TEXT DEFAULT '', weekly_best BOOLEAN DEFAULT false, position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY, slug VARCHAR(255) UNIQUE NOT NULL, title VARCHAR(500) NOT NULL,
      excerpt TEXT DEFAULT '', content TEXT DEFAULT '', image TEXT DEFAULT '',
      image_alt VARCHAR(500) DEFAULT '', tag VARCHAR(100) DEFAULT 'Blog', tag_color VARCHAR(50),
      date VARCHAR(50), read_time VARCHAR(50) DEFAULT '5 min', meta_title VARCHAR(500) DEFAULT '',
      meta_description TEXT DEFAULT '', ctas JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS guias (
      id SERIAL PRIMARY KEY, slug VARCHAR(255) UNIQUE NOT NULL, title VARCHAR(500) NOT NULL,
      excerpt TEXT DEFAULT '', content TEXT DEFAULT '', image TEXT DEFAULT '',
      image_alt VARCHAR(500) DEFAULT '', read_time VARCHAR(50) DEFAULT '10 min',
      meta_title VARCHAR(500) DEFAULT '', meta_description TEXT DEFAULT '', ctas JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS comparatives (
      id SERIAL PRIMARY KEY, slug VARCHAR(255) UNIQUE NOT NULL, title VARCHAR(500) NOT NULL,
      subtitle TEXT DEFAULT '', tag VARCHAR(100) DEFAULT '', image TEXT DEFAULT '',
      image_alt VARCHAR(500) DEFAULT '', meta_title VARCHAR(500) DEFAULT '',
      meta_description TEXT DEFAULT '', items JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS site_config (
      id SERIAL PRIMARY KEY, config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value JSONB DEFAULT '{}',
      updated_at TIMESTAMP DEFAULT NOW()
    )`;
    return NextResponse.json({ success: true, message: "5 tablas creadas: products, blog_posts, guias, comparatives, site_config" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { sql } from "@vercel/postgres";

function checkAuth(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  return key === (process.env.ADMIN_KEY || "Compra2026");
}

export async function GET(request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "products";
  try {
    let data;
    switch (type) {
      case "products": data = await db.getProducts(); break;
      case "blogs": data = await db.getBlogPosts(); break;
      case "guias": data = await db.getGuias(); break;
      case "comparatives": data = await db.getComparatives(); break;
      case "config": {
        const key = searchParams.get("configKey");
        if (key) {
          const r = await sql`SELECT config_value FROM site_config WHERE config_key=${key}`;
          data = r.rows[0]?.config_value || null;
        } else {
          const r = await sql`SELECT config_key, config_value, updated_at FROM site_config ORDER BY config_key`;
          data = r.rows;
        }
        break;
      }
      case "stats": {
        const p = await sql`SELECT COUNT(*) as c FROM products`;
        const b = await sql`SELECT COUNT(*) as c FROM blog_posts`;
        const g = await sql`SELECT COUNT(*) as c FROM guias`;
        const cv = await sql`SELECT COUNT(*) as c FROM comparatives`;
        data = { products: parseInt(p.rows[0].c), blogs: parseInt(b.rows[0].c), guias: parseInt(g.rows[0].c), comparatives: parseInt(cv.rows[0].c) };
        break;
      }
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "products";
  const body = await request.json();
  try {
    let result;
    switch (type) {
      case "products": result = await db.upsertProduct(body); break;
      case "blogs": result = await db.upsertBlogPost(body); break;
      case "guias": result = await db.upsertGuia(body); break;
      case "comparatives": result = await db.upsertComparative(body); break;
      case "config": {
        const { configKey, configValue } = body;
        if (!configKey) return NextResponse.json({ error: "Missing configKey" }, { status: 400 });
        await sql`INSERT INTO site_config (config_key, config_value, updated_at) VALUES (${configKey}, ${JSON.stringify(configValue)}, NOW()) ON CONFLICT (config_key) DO UPDATE SET config_value = ${JSON.stringify(configValue)}, updated_at = NOW()`;
        result = { configKey, saved: true };
        break;
      }
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "products";
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  try {
    switch (type) {
      case "products": await db.deleteProduct(slug); break;
      case "blogs": await db.deleteBlogPost(slug); break;
      case "guias": await db.deleteGuia(slug); break;
      case "comparatives": await db.deleteComparative(slug); break;
      case "config": await sql`DELETE FROM site_config WHERE config_key=${slug}`; break;
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

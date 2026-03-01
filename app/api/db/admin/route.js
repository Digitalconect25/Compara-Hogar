import { NextResponse } from "next/server";
import * as db from "@/lib/db";

function checkAuth(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  return key === (process.env.ADMIN_KEY || "comparahogar2026");
}

// GET - list all data
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
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create/update
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
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE
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
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

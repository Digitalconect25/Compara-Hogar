import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== (process.env.ADMIN_KEY || "Compra2026")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    revalidatePath("/", "layout");
    return NextResponse.json({ revalidated: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

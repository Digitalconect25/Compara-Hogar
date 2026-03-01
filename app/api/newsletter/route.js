import { NextResponse } from "next/server";

// ============================================================
// Newsletter API - Supabase
//
// Tabla en Supabase: newsletter_subscribers
// Columnas: id (uuid), email (text unique), created_at (timestamp), active (boolean)
//
// SQL para crear la tabla:
// CREATE TABLE newsletter_subscribers (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   email TEXT UNIQUE NOT NULL,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   active BOOLEAN DEFAULT true,
//   source TEXT DEFAULT 'web'
// );
//
// CREATE INDEX idx_newsletter_active ON newsletter_subscribers(active);
// CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
//
// Habilitar RLS:
// ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow insert from anon" ON newsletter_subscribers
//   FOR INSERT TO anon WITH CHECK (true);
// CREATE POLICY "Block select from anon" ON newsletter_subscribers
//   FOR SELECT TO anon USING (false);
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "Email no valido" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validacion basica de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Formato de email incorrecto" },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      // Fallback: log en consola si Supabase no esta configurado
      console.log("[Newsletter] Nuevo suscriptor:", cleanEmail);
      return NextResponse.json({
        success: true,
        message: "Suscripcion registrada (modo desarrollo)",
      });
    }

    // Insertar en Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        email: cleanEmail,
        source: "web",
        active: true,
      }),
    });

    if (response.status === 409 || response.status === 23505) {
      // Email ya existe (unique constraint)
      return NextResponse.json({
        success: true,
        message: "Ya estabas suscrito. Recibiras la newsletter cada viernes.",
      });
    }

    if (!response.ok) {
      const err = await response.text();
      // Duplicate key error from Supabase
      if (err.includes("duplicate key") || err.includes("unique")) {
        return NextResponse.json({
          success: true,
          message: "Ya estabas suscrito.",
        });
      }
      console.error("[Newsletter] Supabase error:", err);
      return NextResponse.json(
        { error: "Error al guardar. Intentalo de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Suscripcion confirmada. Recibiras ofertas cada viernes.",
    });
  } catch (error) {
    console.error("[Newsletter] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para darse de baja
export async function DELETE(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ success: true, message: "Baja procesada" });
    }

    // Marcar como inactivo (soft delete)
    await fetch(
      `${SUPABASE_URL}/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(cleanEmail)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ active: false }),
      }
    );

    return NextResponse.json({
      success: true,
      message: "Te has dado de baja correctamente.",
    });
  } catch (error) {
    console.error("[Newsletter] Error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

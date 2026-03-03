"use client";
import { useState, useEffect } from "react";

const API = "/api/db/admin";

function proxyImg(url) {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return "/api/img?url=" + encodeURIComponent(url);
  return url;
}

export default function AdminPanel({ onClose }) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [adminKey, setAdminKey] = useState("");

  function doLogin() {
    if (pass === "Compra2026") {
      setAdminKey("Compra2026");
      setAuthed(true);
      setPassError("");
    } else {
      setPassError("Clave incorrecta");
    }
  }

  if (!authed) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 380, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg, #10B981, #059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>C</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>ComparaHogar Admin</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Introduce la clave de acceso</p>
          </div>
          <input type="password" value={pass} onChange={function(e) { setPass(e.target.value); setPassError(""); }}
            onKeyDown={function(e) { if (e.key === "Enter") doLogin(); }}
            placeholder="Clave de administrador"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid " + (passError ? "#EF4444" : "#E5E7EB"), fontSize: 14, boxSizing: "border-box", marginBottom: 8, outline: "none" }} autoFocus />
          {passError && <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 8px" }}>{passError}</p>}
          <button onClick={doLogin} style={{ width: "100%", padding: "12px", background: "#10B981", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>Entrar</button>
          <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "none", color: "#9CA3AF", border: "none", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
        </div>
      </div>
    );
  }

  return <AdminDashboard adminKey={adminKey} onClose={onClose} />;
}

function AdminDashboard({ adminKey, onClose }) {
  var [tab, setTab] = useState("dashboard");
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(false);
  var [editing, setEditing] = useState(null);
  var [msg, setMsg] = useState("");
  var [msgType, setMsgType] = useState("info");
  var [dbStatus, setDbStatus] = useState("checking");
  var [stats, setStats] = useState(null);

  var contentTabs = ["products", "blogs", "guias", "comparatives"];
  var configTabs = ["hero", "offers", "seo"];

  useEffect(function() { loadStats(); }, []);
  useEffect(function() { if (contentTabs.indexOf(tab) >= 0) loadItems(); }, [tab]);

  function ak() { return "key=" + adminKey; }
  function showMsg(text, type) { setMsg(text); setMsgType(type || "info"); setTimeout(function() { setMsg(""); }, 4000); }

  async function initDB() {
    showMsg("Creando tablas...");
    try {
      var r1 = await fetch("/api/db/migrate?" + ak());
      var j1 = await r1.json();
      if (j1.success) {
        showMsg("Tablas creadas. Cargando datos iniciales...");
        var r2 = await fetch("/api/db/seed?" + ak());
        var j2 = await r2.json();
        if (j2.success) { showMsg("Base de datos inicializada correctamente", "ok"); loadStats(); }
        else showMsg("Tablas OK pero seed fallo: " + (j2.error || ""), "error");
      } else showMsg("Error migrate: " + (j1.error || ""), "error");
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  async function loadStats() {
    try {
      var res = await fetch(API + "?type=stats&" + ak());
      var json = await res.json();
      if (json.data) { setStats(json.data); setDbStatus("connected"); }
      else { setDbStatus("error"); }
    } catch (e) { setDbStatus("error"); }
  }

  function revalidate() {
    fetch("/api/revalidate?" + ak(), { method: "POST" }).catch(function(){});
  }

  async function loadItems() {
    setLoading(true);
    try {
      var res = await fetch(API + "?type=" + tab + "&" + ak());
      var json = await res.json();
      if (json.data) { setItems(json.data); setDbStatus("connected"); }
      else { showMsg("Error: " + (json.error || "Sin datos"), "error"); }
    } catch (e) { showMsg("DB no conectada. Pulsa 'Inicializar DB'", "error"); setDbStatus("error"); setItems([]); }
    setLoading(false);
  }

  async function saveItem(item) {
    if (!item.slug) { showMsg("El slug es obligatorio", "error"); return; }
    showMsg("Guardando...");
    try {
      var res = await fetch(API + "?type=" + tab + "&" + ak(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      var json;
      try { json = await res.json(); } catch (pe) { showMsg("Respuesta invalida", "error"); return; }
      if (json.success) {
        showMsg("Guardado: " + (item.name || item.title || item.slug), "ok");
        setEditing(null); loadItems(); revalidate();
      } else showMsg("Error: " + (json.error || "desconocido"), "error");
    } catch (e) { showMsg("Error de red: " + e.message, "error"); }
  }

  async function deleteItem(slug) {
    if (!confirm("Eliminar " + slug + "?")) return;
    try {
      var res = await fetch(API + "?type=" + tab + "&slug=" + slug + "&" + ak(), { method: "DELETE" });
      var json = await res.json();
      if (json.success) { showMsg("Eliminado", "ok"); loadItems(); revalidate(); }
      else showMsg("Error: " + json.error, "error");
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  async function toggleFeatured(item) {
    var updated = Object.assign({}, item, { weeklyBest: !item.weeklyBest });
    await saveItem(updated);
  }

  async function saveConfig(configKey, configValue) {
    showMsg("Guardando configuracion...");
    try {
      var res = await fetch(API + "?type=config&" + ak(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configKey: configKey, configValue: configValue })
      });
      var json = await res.json();
      if (json.success) { showMsg("Configuracion guardada", "ok"); revalidate(); }
      else showMsg("Error: " + (json.error || ""), "error");
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  async function loadConfig(configKey) {
    try {
      var res = await fetch(API + "?type=config&configKey=" + configKey + "&" + ak());
      var json = await res.json();
      return json.data || null;
    } catch (e) { return null; }
  }

  var msgBg = msgType === "ok" ? "#ECFDF5" : msgType === "error" ? "#FEF2F2" : "#F0F9FF";
  var msgColor = msgType === "ok" ? "#059669" : msgType === "error" ? "#DC2626" : "#0369A1";

  var allTabs = [
    { id: "dashboard", label: "Panel", icon: "~" },
    { id: "products", label: "Productos", icon: "P" },
    { id: "blogs", label: "Blog", icon: "B" },
    { id: "guias", label: "Guias", icon: "G" },
    { id: "comparatives", label: "Comparativas", icon: "C" },
    { id: "hero", label: "Hero", icon: "H" },
    { id: "offers", label: "Ofertas Amazon", icon: "$" },
    { id: "seo", label: "Texto SEO", icon: "T" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", background: "#F1F5F9" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0F172A", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>C</div>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>ComparaHogar</div><div style={{ fontSize: 11, color: "#64748B" }}>Admin Panel</div></div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 8px" }}>
          {allTabs.map(function(t) {
            var active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); setEditing(null); setMsg(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, background: active ? "rgba(255,255,255,0.1)" : "transparent", color: active ? "#fff" : "#94A3B8", marginBottom: 2, textAlign: "left" }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: active ? "#10B981" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: active ? "#fff" : "#64748B" }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11, color: "#475569", padding: "4px 12px", marginBottom: 6 }}>DB: <span style={{ color: dbStatus === "connected" ? "#10B981" : "#EF4444" }}>{dbStatus}</span></div>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, background: "rgba(239,68,68,0.1)", color: "#F87171", textAlign: "left" }}>Cerrar admin</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {msg && <div style={{ padding: "10px 16px", background: msgBg, color: msgColor, borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>{msg}</div>}

        {tab === "dashboard" && <DashboardView stats={stats} dbStatus={dbStatus} onRefresh={loadStats} onInitDB={initDB} />}
        {tab === "hero" && <HeroEditor adminKey={adminKey} loadConfig={loadConfig} saveConfig={saveConfig} />}
        {tab === "offers" && <OffersEditor adminKey={adminKey} loadConfig={loadConfig} saveConfig={saveConfig} />}
        {tab === "seo" && <SeoEditor adminKey={adminKey} loadConfig={loadConfig} saveConfig={saveConfig} />}

        {contentTabs.indexOf(tab) >= 0 && (
          loading ? <p style={{ color: "#64748B" }}>Cargando...</p> : editing ? (
            <ItemEditor item={editing} type={tab} onSave={saveItem} onCancel={function() { setEditing(null); }} />
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{tab.charAt(0).toUpperCase() + tab.slice(1)} ({items.length})</h2>
                <button onClick={function() { setEditing(getEmptyItem(tab)); }} style={btnGreen}>+ Nuevo</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {items.length === 0 ? <p style={{ padding: 20, color: "#9CA3AF" }}>Sin datos. Si es la primera vez, ve a Panel y pulsa "Inicializar DB".</p> :
                  items.map(function(item, idx) {
                    return (
                      <div key={item.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: idx < items.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          {item.image && <img src={proxyImg(item.image)} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, background: "#F8FAFC", flexShrink: 0 }} onError={function(e) { e.target.style.display = "none"; }} />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name || item.title}</div>
                            <div style={{ fontSize: 12, color: "#94A3B8" }}>/{item.slug}{item.category ? " - " + item.category : ""}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {tab === "products" && item.price && <span style={{ fontSize: 13, fontWeight: 600, color: "#059669", marginRight: 8 }}>{item.price} EUR</span>}
                          {tab === "products" && <button onClick={function() { toggleFeatured(item); }} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + (item.weeklyBest ? "#10B981" : "#E2E8F0"), background: item.weeklyBest ? "#ECFDF5" : "#fff", color: item.weeklyBest ? "#059669" : "#94A3B8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{item.weeklyBest ? "Destacado" : "Normal"}</button>}
                          <button onClick={function() { setEditing(JSON.parse(JSON.stringify(item))); }} style={btnSmall("#3B82F6")}>Editar</button>
                          <button onClick={function() { deleteItem(item.slug); }} style={btnSmall("#EF4444")}>X</button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ---- DASHBOARD ---- */
function DashboardView({ stats, dbStatus, onRefresh, onInitDB }) {
  var cards = stats ? [
    { label: "Productos", count: stats.products, color: "#10B981" },
    { label: "Blog", count: stats.blogs, color: "#3B82F6" },
    { label: "Guias", count: stats.guias, color: "#8B5CF6" },
    { label: "Comparativas", count: stats.comparatives, color: "#F59E0B" },
  ] : [];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Panel de control</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onInitDB} style={btnStyle("#F59E0B")}>Inicializar DB</button>
          <button onClick={onRefresh} style={btnStyle("#6B7280")}>Actualizar</button>
        </div>
      </div>
      {dbStatus === "error" && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 13 }}>Base de datos no conectada. Pulsa "Inicializar DB" para crear las tablas y cargar datos.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map(function(c) {
          return (
            <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.count}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Acciones rapidas</h3>
        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
          Usa el menu lateral para gestionar contenido. "Ofertas Amazon" controla los botones de compra en el inicio. "Texto SEO" edita el bloque de texto para posicionamiento. "Hero" configura el banner principal con gradientes y productos.
        </p>
      </div>
    </div>
  );
}

/* ---- HERO EDITOR ---- */
function HeroEditor({ adminKey, loadConfig, saveConfig }) {
  var defaultSlides = [
    { label: "N.1 en Espana", title: "Roborock S8 MaxV Ultra", desc: "El robot aspirador con IA mas avanzado.", cta: "Ver analisis completo", href: "/roborock-s8-maxv-ultra", gradient: "linear-gradient(135deg, #065F46 0%, #0D9488 50%, #14B8A6 100%)", accentColor: "#6EE7B7", image: "" },
    { label: "Mejor calidad-precio", title: "Amazon Echo Show 8", desc: "Pantalla inteligente con Alexa.", cta: "Leer review", href: "/echo-show-8-2024", gradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #6366F1 100%)", accentColor: "#A5B4FC", image: "" },
    { label: "Sin suscripcion", title: "Tapo C320WS", desc: "Camara de seguridad exterior 2K.", cta: "Ver comparativa", href: "/tapo-c320ws", gradient: "linear-gradient(135deg, #1C1917 0%, #44403C 50%, #78716C 100%)", accentColor: "#FCD34D", image: "" },
  ];
  var [form, setForm] = useState(defaultSlides);
  var [loaded, setLoaded] = useState(false);

  useEffect(function() { loadConfig("hero_slides").then(function(data) { if (data && data.length > 0) setForm(data); setLoaded(true); }); }, []);

  function updateSlide(idx, key, val) {
    setForm(function(prev) { return prev.map(function(s, i) { if (i !== idx) return s; var c = Object.assign({}, s); c[key] = val; return c; }); });
  }
  function addSlide() { setForm(function(prev) { return prev.concat([{ label: "", title: "", desc: "", cta: "Ver mas", href: "/", gradient: "linear-gradient(135deg, #1E1B4B, #6366F1)", accentColor: "#A5B4FC", image: "" }]); }); }
  function removeSlide(idx) { if (form.length <= 1) return; setForm(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); }); }

  var fields = [["label","Etiqueta"],["title","Titulo"],["desc","Descripcion"],["cta","Texto boton"],["href","URL destino"],["image","URL imagen"],["gradient","Gradiente CSS"],["accentColor","Color acento"]];

  if (!loaded) return <p style={{ color: "#64748B" }}>Cargando...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Hero Banner</h2>
        <div style={{ display: "flex", gap: 8 }}><button onClick={addSlide} style={btnStyle("#8B5CF6")}>+ Slide</button><button onClick={function() { saveConfig("hero_slides", form); }} style={btnGreen}>Guardar</button></div>
      </div>
      {form.map(function(slide, idx) {
        return (
          <div key={idx} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Slide {idx + 1}</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 100, height: 40, borderRadius: 8, background: slide.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: slide.accentColor, fontSize: 9, fontWeight: 700 }}>{(slide.title || "Preview").substring(0, 16)}</span></div>
                {form.length > 1 && <button onClick={function() { removeSlide(idx); }} style={btnSmall("#EF4444")}>Eliminar</button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {fields.map(function(f) {
                return (<div key={f[0]} style={{ gridColumn: (f[0] === "desc" || f[0] === "gradient") ? "1 / -1" : "auto" }}><label style={labelStyle}>{f[1]}</label><input value={slide[f[0]] || ""} onChange={function(e) { updateSlide(idx, f[0], e.target.value); }} style={inputStyle} /></div>);
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- OFFERS EDITOR ---- */
function OffersEditor({ adminKey, loadConfig, saveConfig }) {
  var defaultOffers = [
    { label: "Oferta de la semana", title: "Roborock S8 MaxV Ultra", subtitle: "40% dto. - Solo esta semana", url: "https://www.amazon.es/dp/B0CRV7F37B?tag=digitalconect-21", color: "#10B981", image: "" },
    { label: "Descubre", title: "Dreame L10s Ultra Gen 2", subtitle: "El mas vendido de 2026", url: "https://www.amazon.es/dp/B0CP3KM3KJ?tag=digitalconect-21", color: "#8B5CF6", image: "" },
    { label: "Precio minimo", title: "TP-Link Tapo C320WS", subtitle: "Seguridad sin cuotas", url: "https://www.amazon.es/dp/B09GKZ6GN9?tag=digitalconect-21", color: "#F97316", image: "" },
  ];
  var [form, setForm] = useState(defaultOffers);
  var [loaded, setLoaded] = useState(false);

  useEffect(function() { loadConfig("home_offers").then(function(data) { if (data && data.length > 0) setForm(data); setLoaded(true); }); }, []);

  function updateOffer(idx, key, val) {
    setForm(function(prev) { return prev.map(function(s, i) { if (i !== idx) return s; var c = Object.assign({}, s); c[key] = val; return c; }); });
  }
  function addOffer() { setForm(function(prev) { return prev.concat([{ label: "Nueva oferta", title: "", subtitle: "", url: "", color: "#10B981", image: "" }]); }); }
  function removeOffer(idx) { if (form.length <= 1) return; setForm(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); }); }

  if (!loaded) return <p style={{ color: "#64748B" }}>Cargando...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Ofertas Amazon</h2>
        <div style={{ display: "flex", gap: 8 }}><button onClick={addOffer} style={btnStyle("#8B5CF6")}>+ Oferta</button><button onClick={function() { saveConfig("home_offers", form); }} style={btnGreen}>Guardar</button></div>
      </div>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Estos botones aparecen en una barra oscura debajo de la barra de confianza. Cada uno lleva a un producto de Amazon con tu tag de afiliado.</p>
      {form.map(function(offer, idx) {
        return (
          <div key={idx} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: offer.color || "#10B981" }} />
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Oferta {idx + 1}</h3>
              </div>
              {form.length > 1 && <button onClick={function() { removeOffer(idx); }} style={btnSmall("#EF4444")}>Eliminar</button>}
            </div>
            {offer.image && <div style={{ marginBottom: 8 }}><img src={proxyImg(offer.image)} alt="" style={{ height: 50, objectFit: "contain", borderRadius: 6, background: "#F8FAFC", padding: 4 }} onError={function(e) { e.target.style.display = "none"; }} /></div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={labelStyle}>Etiqueta (ej: Oferta de la semana)</label><input value={offer.label || ""} onChange={function(e) { updateOffer(idx, "label", e.target.value); }} style={inputStyle} /></div>
              <div><label style={labelStyle}>Titulo producto</label><input value={offer.title || ""} onChange={function(e) { updateOffer(idx, "title", e.target.value); }} style={inputStyle} /></div>
              <div><label style={labelStyle}>Subtitulo</label><input value={offer.subtitle || ""} onChange={function(e) { updateOffer(idx, "subtitle", e.target.value); }} style={inputStyle} /></div>
              <div><label style={labelStyle}>Color (hex)</label><input value={offer.color || ""} onChange={function(e) { updateOffer(idx, "color", e.target.value); }} style={inputStyle} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>URL Amazon (con tag afiliado)</label><input value={offer.url || ""} onChange={function(e) { updateOffer(idx, "url", e.target.value); }} style={inputStyle} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>URL imagen producto</label><input value={offer.image || ""} onChange={function(e) { updateOffer(idx, "image", e.target.value); }} style={inputStyle} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- SEO EDITOR ---- */
function SeoEditor({ adminKey, loadConfig, saveConfig }) {
  var [title, setTitle] = useState("Tu hogar inteligente empieza aqui");
  var [content, setContent] = useState("En ComparaHogar.es analizamos los productos de domotica que realmente merece la pena comprar en 2026...");
  var [loaded, setLoaded] = useState(false);

  useEffect(function() {
    loadConfig("home_seo").then(function(data) {
      if (data) { if (data.title) setTitle(data.title); if (data.content) setContent(data.content); }
      setLoaded(true);
    });
  }, []);

  function save() { saveConfig("home_seo", { title: title, content: content }); }

  if (!loaded) return <p style={{ color: "#64748B" }}>Cargando...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Texto SEO Homepage</h2>
        <button onClick={save} style={btnGreen}>Guardar</button>
      </div>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Este texto aparece antes del FAQ en la homepage. Ayuda al posicionamiento en Google. Usa parrafos separados por lineas en blanco.</p>
      <div style={cardStyle}>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Titulo H2</label><input value={title} onChange={function(e) { setTitle(e.target.value); }} style={inputStyle} /></div>
        <div><label style={labelStyle}>Contenido (parrafos separados por linea vacia)</label><textarea value={content} onChange={function(e) { setContent(e.target.value); }} rows={12} style={inputStyle} /></div>
      </div>
    </div>
  );
}

/* ---- ITEM EDITOR ---- */
function ItemEditor({ item, type, onSave, onCancel }) {
  var [form, setForm] = useState(JSON.parse(JSON.stringify(item)));
  function set(k, v) { setForm(function(prev) { var n = Object.assign({}, prev); n[k] = v; return n; }); }

  var fields = type === "products"
    ? [["slug","Slug"],["name","Nombre"],["shortDesc","Desc. corta",1],["longDesc","Desc. larga",1],["price","Precio"],["oldPrice","Precio anterior"],["image","URL Imagen"],["imageAlt","Alt imagen"],["category","Categoria"],["badge","Badge"],["badgeColor","Color badge"],["rating","Rating"],["reviews","Reviews"],["verdict","Veredicto",1],["amazonUrl","URL Amazon"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",1]]
    : type === "blogs"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",1],["content","Contenido",1],["image","URL Imagen"],["imageAlt","Alt"],["tag","Tag"],["tagColor","Color tag"],["date","Fecha"],["readTime","Lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",1]]
    : type === "guias"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",1],["content","Contenido",1],["image","URL Imagen"],["imageAlt","Alt"],["readTime","Lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",1]]
    : [["slug","Slug"],["title","Titulo"],["subtitle","Subtitulo",1],["tag","Tag"],["image","URL Imagen"],["imageAlt","Alt"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",1]];

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{item.slug ? "Editar" : "Nuevo"}</h3>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94A3B8" }}>X</button>
      </div>
      {form.image && <div style={{ marginBottom: 12, textAlign: "center" }}><img src={proxyImg(form.image)} alt="" style={{ maxWidth: 180, maxHeight: 120, objectFit: "contain", borderRadius: 8, background: "#F8FAFC", padding: 8 }} onError={function(e) { e.target.style.display = "none"; }} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {fields.map(function(f) {
          var key = f[0], label = f[1], big = f[2];
          return (<div key={key} style={{ gridColumn: big ? "1 / -1" : "auto" }}><label style={labelStyle}>{label}</label>{big ? <textarea value={form[key] || ""} onChange={function(e) { set(key, e.target.value); }} rows={key === "content" || key === "longDesc" ? 10 : 3} style={inputStyle} /> : <input value={form[key] == null ? "" : form[key]} onChange={function(e) { set(key, e.target.value); }} style={inputStyle} />}</div>);
        })}
      </div>
      {type === "products" && <div style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={labelStyle}>Pros (uno por linea)</label><textarea value={Array.isArray(form.pros) ? form.pros.join("\n") : ""} onChange={function(e) { set("pros", e.target.value.split("\n").filter(Boolean)); }} rows={3} style={inputStyle} /></div>
          <div><label style={labelStyle}>Cons (uno por linea)</label><textarea value={Array.isArray(form.cons) ? form.cons.join("\n") : ""} onChange={function(e) { set("cons", e.target.value.split("\n").filter(Boolean)); }} rows={3} style={inputStyle} /></div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, alignItems: "center" }}>
          <div><label style={labelStyle}>Posicion</label><input type="number" value={form.position || 0} onChange={function(e) { set("position", parseInt(e.target.value) || 0); }} style={Object.assign({}, inputStyle, { width: 80 })} /></div>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}><input type="checkbox" checked={form.weeklyBest || false} onChange={function(e) { set("weeklyBest", e.target.checked); }} /> Destacado en homepage</label>
        </div>
      </div>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button onClick={function() { onSave(form); }} style={btnGreen}>Guardar</button><button onClick={onCancel} style={btnStyle("#94A3B8")}>Cancelar</button></div>
    </div>
  );
}

function getEmptyItem(type) {
  if (type === "products") return { slug: "", name: "", shortDesc: "", longDesc: "", price: "", oldPrice: "", image: "", imageAlt: "", category: "", badge: "", badgeColor: "", rating: 0, reviews: 0, pros: [], cons: [], verdict: "", amazonUrl: "", metaTitle: "", metaDescription: "", weeklyBest: false, position: 0 };
  if (type === "blogs") return { slug: "", title: "", excerpt: "", content: "", image: "", imageAlt: "", tag: "Blog", tagColor: "", date: new Date().toISOString().split("T")[0], readTime: "5 min", metaTitle: "", metaDescription: "" };
  if (type === "guias") return { slug: "", title: "", excerpt: "", content: "", image: "", imageAlt: "", readTime: "10 min", metaTitle: "", metaDescription: "" };
  return { slug: "", title: "", subtitle: "", tag: "", image: "", imageAlt: "", metaTitle: "", metaDescription: "" };
}

function btnStyle(c) { return { padding: "10px 18px", background: c, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }; }
function btnSmall(c) { return { padding: "5px 10px", background: c, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }; }
var btnGreen = btnStyle("#10B981");
var inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", background: "#F8FAFC" };
var labelStyle = { fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 3 };
var cardStyle = { background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };

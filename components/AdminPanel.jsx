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
  var [heroSlides, setHeroSlides] = useState([]);

  var contentTabs = ["products", "blogs", "guias", "comparatives"];

  useEffect(function() { loadStats(); loadHeroConfig(); }, []);
  useEffect(function() { if (contentTabs.indexOf(tab) >= 0) loadItems(); }, [tab]);

  function ak() { return "key=" + adminKey; }
  function showMsg(text, type) { setMsg(text); setMsgType(type || "info"); }

  async function loadStats() {
    try {
      var res = await fetch(API + "?type=stats&" + ak());
      var json = await res.json();
      if (json.data) { setStats(json.data); setDbStatus("connected"); }
    } catch (e) { setDbStatus("error"); }
  }

  async function loadHeroConfig() {
    try {
      var res = await fetch(API + "?type=config&configKey=hero_slides&" + ak());
      var json = await res.json();
      if (json.data && Array.isArray(json.data)) setHeroSlides(json.data);
    } catch (e) { /* sin config todavia */ }
  }

  async function saveHeroConfig(slides) {
    showMsg("Guardando hero...");
    try {
      var res = await fetch(API + "?type=config&" + ak(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configKey: "hero_slides", configValue: slides })
      });
      var json = await res.json();
      if (json.success) { showMsg("Hero guardado OK", "ok"); setHeroSlides(slides); revalidate(); }
      else showMsg("Error: " + json.error, "error");
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  async function loadItems() {
    setLoading(true);
    try {
      var res = await fetch(API + "?type=" + tab + "&" + ak());
      var json = await res.json();
      if (json.data) { setItems(json.data); setDbStatus("connected"); }
      else { showMsg("Error: " + (json.error || "Sin datos"), "error"); }
    } catch (e) { showMsg("DB no conectada", "error"); setDbStatus("error"); setItems([]); }
    setLoading(false);
  }

  function revalidate() {
    fetch("/api/revalidate?" + ak(), { method: "POST" }).catch(function(){});
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

  var msgBg = msgType === "ok" ? "#ECFDF5" : msgType === "error" ? "#FEF2F2" : "#F0F9FF";
  var msgColor = msgType === "ok" ? "#059669" : msgType === "error" ? "#DC2626" : "#0369A1";

  var allTabs = [
    { id: "dashboard", label: "Panel", icon: "~" },
    { id: "products", label: "Productos", icon: "P" },
    { id: "blogs", label: "Blog", icon: "B" },
    { id: "guias", label: "Guias", icon: "G" },
    { id: "comparatives", label: "Comparativas", icon: "C" },
    { id: "hero", label: "Hero", icon: "H" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", background: "#F1F5F9" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0F172A", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>C</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>ComparaHogar</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Admin Panel</div>
            </div>
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

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {msg && <div style={{ padding: "10px 16px", background: msgBg, color: msgColor, borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>{msg}</div>}

        {tab === "dashboard" && <DashboardView stats={stats} onRefresh={loadStats} />}

        {tab === "hero" && <HeroEditor slides={heroSlides} onSave={saveHeroConfig} />}

        {contentTabs.indexOf(tab) >= 0 && (
          loading ? <p style={{ color: "#64748B" }}>Cargando...</p> : editing ? (
            <ItemEditor item={editing} type={tab} onSave={saveItem} onCancel={function() { setEditing(null); }} />
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{tab.charAt(0).toUpperCase() + tab.slice(1)} ({items.length})</h2>
                <button onClick={function() { setEditing(getEmptyItem(tab)); }} style={btnStyle("#10B981")}>+ Nuevo</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {items.length === 0 ? <p style={{ padding: 20, color: "#9CA3AF" }}>Sin datos.</p> :
                  items.map(function(item, idx) {
                    return (
                      <div key={item.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: idx < items.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {item.image && <img src={proxyImg(item.image)} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, background: "#F8FAFC" }} onError={function(e) { e.target.style.display = "none"; }} />}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name || item.title}</div>
                            <div style={{ fontSize: 12, color: "#94A3B8" }}>/{item.slug} {item.category ? " - " + item.category : ""}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {tab === "products" && item.price && <span style={{ fontSize: 13, fontWeight: 600, color: "#059669", marginRight: 8 }}>{item.price} EUR</span>}
                          {tab === "products" && <button onClick={function() { toggleFeatured(item); }} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + (item.weeklyBest ? "#10B981" : "#E2E8F0"), background: item.weeklyBest ? "#ECFDF5" : "#fff", color: item.weeklyBest ? "#059669" : "#94A3B8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{item.weeklyBest ? "Destacado" : "Normal"}</button>}
                          <button onClick={function() { setEditing(JSON.parse(JSON.stringify(item))); }} style={btnStyle("#3B82F6", true)}>Editar</button>
                          <button onClick={function() { deleteItem(item.slug); }} style={btnStyle("#EF4444", true)}>X</button>
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
function DashboardView({ stats, onRefresh }) {
  var cards = stats ? [
    { label: "Productos", count: stats.products, color: "#10B981", bg: "#ECFDF5" },
    { label: "Blog", count: stats.blogs, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Guias", count: stats.guias, color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "Comparativas", count: stats.comparatives, color: "#F59E0B", bg: "#FFFBEB" },
  ] : [];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Panel de control</h2>
        <button onClick={onRefresh} style={btnStyle("#6B7280")}>Actualizar</button>
      </div>
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
          Usa las pestanas del menu lateral para gestionar productos, articulos de blog, guias y comparativas. Desde "Hero" puedes cambiar las imagenes y textos del banner principal. Marca productos como "Destacado" para que aparezcan en la seccion principal de la homepage.
        </p>
      </div>
    </div>
  );
}

/* ---- HERO EDITOR ---- */
function HeroEditor({ slides, onSave }) {
  var defaultSlides = [
    { label: "N.1 en Espana", title: "Roborock S8 MaxV Ultra", desc: "El robot aspirador con IA mas avanzado.", cta: "Ver analisis completo", href: "/roborock-s8-maxv-ultra", gradient: "linear-gradient(135deg, #065F46 0%, #0D9488 50%, #14B8A6 100%)", accentColor: "#6EE7B7", image: "" },
    { label: "Mejor calidad-precio", title: "Amazon Echo Show 8", desc: "Pantalla inteligente con Alexa.", cta: "Leer review", href: "/echo-show-8-2024", gradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #6366F1 100%)", accentColor: "#A5B4FC", image: "" },
    { label: "Sin suscripcion", title: "Tapo C320WS", desc: "Camara de seguridad exterior 2K.", cta: "Ver comparativa", href: "/tapo-c320ws", gradient: "linear-gradient(135deg, #1C1917 0%, #44403C 50%, #78716C 100%)", accentColor: "#FCD34D", image: "" },
  ];

  var [form, setForm] = useState(slides && slides.length > 0 ? slides : defaultSlides);

  function updateSlide(idx, key, val) {
    var next = form.map(function(s, i) {
      if (i !== idx) return s;
      var copy = Object.assign({}, s);
      copy[key] = val;
      return copy;
    });
    setForm(next);
  }

  function addSlide() {
    setForm(form.concat([{ label: "", title: "", desc: "", cta: "Ver mas", href: "/", gradient: "linear-gradient(135deg, #1E1B4B 0%, #6366F1 100%)", accentColor: "#A5B4FC", image: "" }]));
  }

  function removeSlide(idx) {
    if (form.length <= 1) return;
    setForm(form.filter(function(_, i) { return i !== idx; }));
  }

  var slideFields = [
    ["label", "Etiqueta (ej: N.1 en Espana)"],
    ["title", "Titulo del producto"],
    ["desc", "Descripcion corta"],
    ["cta", "Texto del boton"],
    ["href", "URL destino (ej: /roborock-s8-maxv-ultra)"],
    ["image", "URL de imagen del producto"],
    ["gradient", "Gradiente CSS (ej: linear-gradient(135deg, #065F46, #14B8A6))"],
    ["accentColor", "Color de acento (ej: #6EE7B7)"],
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Hero Banner</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={addSlide} style={btnStyle("#8B5CF6")}>+ Slide</button>
          <button onClick={function() { onSave(form); }} style={btnStyle("#10B981")}>Guardar todo</button>
        </div>
      </div>
      {form.map(function(slide, idx) {
        return (
          <div key={idx} style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Slide {idx + 1}</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Preview */}
                <div style={{ width: 120, height: 50, borderRadius: 8, background: slide.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: slide.accentColor, fontSize: 10, fontWeight: 700 }}>{slide.title ? slide.title.substring(0, 16) : "Preview"}</span>
                </div>
                {form.length > 1 && <button onClick={function() { removeSlide(idx); }} style={btnStyle("#EF4444", true)}>Eliminar</button>}
              </div>
            </div>
            {slide.image && <div style={{ marginBottom: 12, textAlign: "center" }}><img src={proxyImg(slide.image)} alt="" style={{ maxHeight: 100, objectFit: "contain", borderRadius: 8, background: "#F8FAFC", padding: 8 }} onError={function(e) { e.target.style.display = "none"; }} /></div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {slideFields.map(function(f) {
                return (
                  <div key={f[0]} style={{ gridColumn: (f[0] === "desc" || f[0] === "gradient") ? "1 / -1" : "auto" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 3 }}>{f[1]}</label>
                    <input value={slide[f[0]] || ""} onChange={function(e) { updateSlide(idx, f[0], e.target.value); }} style={inputStyle} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- ITEM EDITOR ---- */
function ItemEditor({ item, type, onSave, onCancel }) {
  var [form, setForm] = useState(JSON.parse(JSON.stringify(item)));

  function set(k, v) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[k] = v;
      return next;
    });
  }

  var fields = type === "products"
    ? [["slug","Slug"],["name","Nombre"],["shortDesc","Desc. corta",true],["longDesc","Desc. larga",true],["price","Precio"],["oldPrice","Precio anterior"],["image","URL Imagen"],["imageAlt","Alt imagen"],["category","Categoria"],["badge","Badge"],["badgeColor","Color badge"],["rating","Rating"],["reviews","Reviews"],["verdict","Veredicto",true],["amazonUrl","URL Amazon"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]]
    : type === "blogs"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",true],["content","Contenido",true],["image","URL Imagen"],["imageAlt","Alt imagen"],["tag","Tag"],["tagColor","Color tag"],["date","Fecha"],["readTime","Tiempo lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]]
    : type === "guias"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",true],["content","Contenido",true],["image","URL Imagen"],["imageAlt","Alt imagen"],["readTime","Tiempo lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]]
    : [["slug","Slug"],["title","Titulo"],["subtitle","Subtitulo",true],["tag","Tag"],["image","URL Imagen"],["imageAlt","Alt imagen"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]];

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{item.slug ? "Editar" : "Nuevo"} {type.slice(0, -1)}</h3>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94A3B8" }}>X</button>
      </div>
      {form.image && <div style={{ marginBottom: 16, textAlign: "center" }}><img src={proxyImg(form.image)} alt="Preview" style={{ maxWidth: 200, maxHeight: 150, objectFit: "contain", borderRadius: 8, background: "#F8FAFC", padding: 8 }} onError={function(e) { e.target.style.display = "none"; }} /><p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Preview</p></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {fields.map(function(f) {
          var key = f[0], label = f[1], isTextarea = f[2];
          return (
            <div key={key} style={{ gridColumn: isTextarea ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>{label}</label>
              {isTextarea
                ? <textarea value={form[key] || ""} onChange={function(e) { set(key, e.target.value); }} rows={key === "content" || key === "longDesc" ? 10 : 3} style={inputStyle} />
                : <input value={form[key] == null ? "" : form[key]} onChange={function(e) { set(key, e.target.value); }} style={inputStyle} />
              }
            </div>
          );
        })}
      </div>
      {type === "products" && <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Pros (uno por linea)</label>
            <textarea value={Array.isArray(form.pros) ? form.pros.join("\n") : ""} onChange={function(e) { set("pros", e.target.value.split("\n").filter(Boolean)); }} rows={3} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Cons (uno por linea)</label>
            <textarea value={Array.isArray(form.cons) ? form.cons.join("\n") : ""} onChange={function(e) { set("cons", e.target.value.split("\n").filter(Boolean)); }} rows={3} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Posicion</label>
            <input type="number" value={form.position || 0} onChange={function(e) { set("position", parseInt(e.target.value) || 0); }} style={Object.assign({}, inputStyle, { width: 80 })} />
          </div>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
            <input type="checkbox" checked={form.weeklyBest || false} onChange={function(e) { set("weeklyBest", e.target.checked); }} /> Producto destacado en homepage
          </label>
        </div>
      </div>}
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button onClick={function() { onSave(form); }} style={btnStyle("#10B981")}>Guardar</button>
        <button onClick={onCancel} style={btnStyle("#94A3B8")}>Cancelar</button>
      </div>
    </div>
  );
}

function getEmptyItem(type) {
  if (type === "products") return { slug: "", name: "", shortDesc: "", longDesc: "", price: "", oldPrice: "", image: "", imageAlt: "", category: "", badge: "", badgeColor: "", rating: 0, reviews: 0, pros: [], cons: [], verdict: "", amazonUrl: "", metaTitle: "", metaDescription: "", weeklyBest: false, position: 0 };
  if (type === "blogs") return { slug: "", title: "", excerpt: "", content: "", image: "", imageAlt: "", tag: "Blog", tagColor: "", date: new Date().toISOString().split("T")[0], readTime: "5 min", metaTitle: "", metaDescription: "" };
  if (type === "guias") return { slug: "", title: "", excerpt: "", content: "", image: "", imageAlt: "", readTime: "10 min", metaTitle: "", metaDescription: "" };
  return { slug: "", title: "", subtitle: "", tag: "", image: "", imageAlt: "", metaTitle: "", metaDescription: "" };
}

function btnStyle(color, small) {
  return { padding: small ? "5px 10px" : "10px 18px", background: color, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: small ? 12 : 13, fontWeight: 600 };
}

var inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", background: "#F8FAFC" };

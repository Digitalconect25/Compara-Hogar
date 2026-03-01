"use client";
import { useState, useEffect } from "react";

const ADMIN_KEY = "comparahogar2026";

export default function AdminPanel({ onClose }) {
  const [tab, setTab] = useState("products");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [dbStatus, setDbStatus] = useState("unknown");

  useEffect(() => { loadItems(); }, [tab]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/admin?type=${tab}&key=${ADMIN_KEY}`);
      const json = await res.json();
      if (json.data) { setItems(json.data); setDbStatus("connected"); }
      else { setMsg("Error: " + (json.error || "Sin datos")); setDbStatus("error"); }
    } catch (e) {
      setMsg("DB no conectada. Usa /api/db/migrate?key=" + ADMIN_KEY + " primero");
      setDbStatus("offline");
      setItems([]);
    }
    setLoading(false);
  }

  async function runMigrate() {
    setMsg("Creando tablas...");
    try {
      const res = await fetch(`/api/db/migrate?key=${ADMIN_KEY}`);
      const json = await res.json();
      setMsg(json.success ? "Tablas creadas OK" : "Error: " + json.error);
      if (json.success) setDbStatus("connected");
    } catch (e) { setMsg("Error de conexion: " + e.message); }
  }

  async function runSeed() {
    setMsg("Importando datos...");
    try {
      const res = await fetch(`/api/db/seed?key=${ADMIN_KEY}`);
      const json = await res.json();
      if (json.success) {
        setMsg(`Importado: ${json.inserted.products} productos, ${json.inserted.blogs} blogs, ${json.inserted.guias} guias, ${json.inserted.comparatives} comparativas`);
        loadItems();
      } else { setMsg("Error: " + json.error); }
    } catch (e) { setMsg("Error: " + e.message); }
  }

  async function saveItem(item) {
    setMsg("Guardando...");
    try {
      const res = await fetch(`/api/db/admin?type=${tab}&key=${ADMIN_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item)
      });
      const json = await res.json();
      if (json.success) { setMsg("Guardado OK"); setEditing(null); loadItems(); }
      else { setMsg("Error: " + json.error); }
    } catch (e) { setMsg("Error: " + e.message); }
  }

  async function deleteItem(slug) {
    if (!confirm("Eliminar " + slug + "?")) return;
    try {
      const res = await fetch(`/api/db/admin?type=${tab}&slug=${slug}&key=${ADMIN_KEY}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { setMsg("Eliminado"); loadItems(); }
      else { setMsg("Error: " + json.error); }
    } catch (e) { setMsg("Error: " + e.message); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#fff", overflow: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "2px solid #E8E7EB", paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#131118" }}>Admin Panel</h1>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4,
              background: dbStatus === "connected" ? "#ECFDF5" : dbStatus === "error" ? "#FEF2F2" : "#FFF7ED",
              color: dbStatus === "connected" ? "#059669" : dbStatus === "error" ? "#DC2626" : "#D97706"
            }}>DB: {dbStatus}</span>
          </div>
          <button onClick={onClose} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
        </div>

        {/* DB Setup buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={runMigrate} style={btnStyle("#3B82F6")}>Crear tablas</button>
          <button onClick={runSeed} style={btnStyle("#8B5CF6")}>Importar datos iniciales</button>
          <button onClick={loadItems} style={btnStyle("#6B7280")}>Refrescar</button>
        </div>
        {msg && <div style={{ padding: "10px 14px", background: "#F6F6F8", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{msg}</div>}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {["products", "blogs", "guias", "comparatives"].map(t => (
            <button key={t} onClick={() => { setTab(t); setEditing(null); }}
              style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tab === t ? "#131118" : "#F6F6F8", color: tab === t ? "#fff" : "#131118" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? <p>Cargando...</p> : editing ? (
          <ItemEditor item={editing} type={tab} onSave={saveItem} onCancel={() => setEditing(null)} />
        ) : (
          <>
            <button onClick={() => setEditing(getEmptyItem(tab))} style={btnStyle("#10B981")}>+ Nuevo</button>
            <div style={{ marginTop: 12 }}>
              {items.length === 0 ? <p style={{ color: "#9CA3AF" }}>Sin datos. Pulsa "Importar datos iniciales" para cargar el contenido.</p> :
                items.map(item => (
                  <div key={item.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #E8E7EB" }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{item.name || item.title}</strong>
                      <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 10 }}>/{item.slug}</span>
                      {item.price && <span style={{ fontSize: 12, color: "#059669", marginLeft: 10 }}>{item.price}&euro;</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditing(item)} style={btnStyle("#3B82F6", true)}>Editar</button>
                      <button onClick={() => deleteItem(item.slug)} style={btnStyle("#EF4444", true)}>Eliminar</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(color, small) {
  return { padding: small ? "4px 10px" : "8px 16px", background: color, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: small ? 12 : 13, fontWeight: 600 };
}

function getEmptyItem(type) {
  if (type === "products") return { slug: "", name: "", shortDesc: "", longDesc: "", price: "", oldPrice: "", image: "", category: "", badge: "", rating: 0, reviews: 0, pros: [], cons: [], verdict: "", amazonUrl: "", metaTitle: "", metaDescription: "", weeklyBest: false };
  if (type === "blogs") return { slug: "", title: "", excerpt: "", content: "", image: "", tag: "Blog", date: new Date().toISOString().split("T")[0], readTime: "5 min", metaTitle: "", metaDescription: "" };
  if (type === "guias") return { slug: "", title: "", excerpt: "", content: "", image: "", readTime: "10 min", metaTitle: "", metaDescription: "" };
  return { slug: "", title: "", subtitle: "", tag: "", image: "", items: [] };
}

function ItemEditor({ item, type, onSave, onCancel }) {
  const [form, setForm] = useState(item);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fields = type === "products"
    ? [["slug","Slug"],["name","Nombre"],["shortDesc","Descripcion corta",true],["longDesc","Descripcion larga",true],["price","Precio"],["oldPrice","Precio anterior"],["image","URL Imagen"],["category","Categoria"],["badge","Badge"],["rating","Rating"],["reviews","Reviews"],["verdict","Veredicto",true],["amazonUrl","URL Amazon"],["metaTitle","Meta Title"],["metaDescription","Meta Description",true]]
    : type === "blogs"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",true],["content","Contenido",true],["image","URL Imagen"],["tag","Tag"],["date","Fecha"],["readTime","Tiempo lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Description",true]]
    : type === "guias"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",true],["content","Contenido",true],["image","URL Imagen"],["readTime","Tiempo lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Description",true]]
    : [["slug","Slug"],["title","Titulo"],["subtitle","Subtitulo",true],["tag","Tag"],["image","URL Imagen"]];

  return (
    <div style={{ background: "#F6F6F8", borderRadius: 12, padding: 20 }}>
      <h3 style={{ marginBottom: 16 }}>{item.slug ? "Editar" : "Nuevo"} {type.slice(0, -1)}</h3>
      {fields.map(([key, label, isTextarea]) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
          {isTextarea
            ? <textarea value={form[key] || ""} onChange={e => set(key, e.target.value)} rows={4} style={inputStyle} />
            : <input value={form[key] ?? ""} onChange={e => set(key, e.target.value)} style={inputStyle} />
          }
        </div>
      ))}
      {type === "products" && <>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Pros (uno por linea)</label>
          <textarea value={(form.pros || []).join("\n")} onChange={e => set("pros", e.target.value.split("\n").filter(Boolean))} rows={3} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Cons (uno por linea)</label>
          <textarea value={(form.cons || []).join("\n")} onChange={e => set("cons", e.target.value.split("\n").filter(Boolean))} rows={3} style={inputStyle} />
        </div>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={form.weeklyBest || false} onChange={e => set("weeklyBest", e.target.checked)} /> Producto destacado
        </label>
      </>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => onSave(form)} style={btnStyle("#10B981")}>Guardar</button>
        <button onClick={onCancel} style={btnStyle("#6B7280")}>Cancelar</button>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E8E7EB", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };

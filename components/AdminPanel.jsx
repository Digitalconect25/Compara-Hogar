"use client";
import { useState, useEffect } from "react";

const ADMIN_KEY = "comparahogar2026";
const API = "/api/db/admin";

function proxyImg(url) {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return "/api/img?url=" + encodeURIComponent(url);
  return url;
}

export default function AdminPanel({ onClose }) {
  const [tab, setTab] = useState("products");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [dbStatus, setDbStatus] = useState("unknown");

  useEffect(() => { loadItems(); }, [tab]);

  function showMsg(text, type) { setMsg(text); setMsgType(type || "info"); }

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(API + "?type=" + tab + "&key=" + ADMIN_KEY);
      const json = await res.json();
      if (json.data) { setItems(json.data); setDbStatus("connected"); }
      else { showMsg("Error: " + (json.error || "Sin datos"), "error"); setDbStatus("error"); }
    } catch (e) {
      showMsg("DB no conectada", "error");
      setDbStatus("offline");
      setItems([]);
    }
    setLoading(false);
  }

  async function runMigrate() {
    showMsg("Creando tablas...");
    try {
      const res = await fetch("/api/db/migrate?key=" + ADMIN_KEY);
      const json = await res.json();
      showMsg(json.success ? "Tablas creadas OK" : "Error: " + json.error, json.success ? "ok" : "error");
      if (json.success) setDbStatus("connected");
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  async function runSeed() {
    showMsg("Importando datos...");
    try {
      const res = await fetch("/api/db/seed?key=" + ADMIN_KEY);
      const json = await res.json();
      if (json.success) {
        showMsg("Importado: " + json.inserted.products + " productos, " + json.inserted.blogs + " blogs, " + json.inserted.guias + " guias", "ok");
        loadItems();
      } else { showMsg("Error: " + json.error, "error"); }
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  async function saveItem(item) {
    if (!item.slug) { showMsg("El slug es obligatorio", "error"); return; }
    showMsg("Guardando...");
    try {
      const res = await fetch(API + "?type=" + tab + "&key=" + ADMIN_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      var json;
      try { json = await res.json(); } catch (pe) { showMsg("Respuesta invalida del servidor", "error"); return; }
      if (json.success) {
        showMsg("Guardado OK: " + (item.name || item.title || item.slug), "ok");
        setEditing(null);
        loadItems();
        fetch("/api/revalidate?key=" + ADMIN_KEY, { method: "POST" }).catch(function(){});
      } else {
        showMsg("Error al guardar: " + (json.error || "desconocido"), "error");
      }
    } catch (e) {
      showMsg("Error de red: " + e.message, "error");
    }
  }

  async function deleteItem(slug) {
    if (!confirm("Eliminar " + slug + "?")) return;
    try {
      const res = await fetch(API + "?type=" + tab + "&slug=" + slug + "&key=" + ADMIN_KEY, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { showMsg("Eliminado", "ok"); loadItems(); fetch("/api/revalidate?key=" + ADMIN_KEY, { method: "POST" }).catch(function(){}); }
      else { showMsg("Error: " + json.error, "error"); }
    } catch (e) { showMsg("Error: " + e.message, "error"); }
  }

  var msgBg = msgType === "ok" ? "#ECFDF5" : msgType === "error" ? "#FEF2F2" : "#F6F6F8";
  var msgColor = msgType === "ok" ? "#059669" : msgType === "error" ? "#DC2626" : "#374151";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#fff", overflow: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "2px solid #E8E7EB", paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#131118" }}>Admin Panel</h1>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: dbStatus === "connected" ? "#ECFDF5" : "#FEF2F2", color: dbStatus === "connected" ? "#059669" : "#DC2626" }}>DB: {dbStatus}</span>
          </div>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }}>X</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={runMigrate} style={btnStyle("#3B82F6")}>Crear tablas</button>
          <button onClick={runSeed} style={btnStyle("#8B5CF6")}>Importar datos iniciales</button>
          <button onClick={loadItems} style={btnStyle("#6B7280")}>Refrescar</button>
        </div>
        {msg && <div style={{ padding: "10px 14px", background: msgBg, color: msgColor, borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>{msg}</div>}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {["products", "blogs", "guias", "comparatives"].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); setEditing(null); setMsg(""); }}
              style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === t ? "#131118" : "#F6F6F8", color: tab === t ? "#fff" : "#131118" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ); })}
        </div>
        {loading ? <p>Cargando...</p> : editing ? (
          <ItemEditor item={editing} type={tab} onSave={saveItem} onCancel={function() { setEditing(null); }} />
        ) : (
          <div>
            <button onClick={function() { setEditing(getEmptyItem(tab)); }} style={btnStyle("#10B981")}>+ Nuevo</button>
            <div style={{ marginTop: 12 }}>
              {items.length === 0 ? <p style={{ color: "#9CA3AF" }}>Sin datos.</p> :
                items.map(function(item) { return (
                  <div key={item.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #E8E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.image && <img src={proxyImg(item.image)} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, background: "#f3f3f3" }} onError={function(e) { e.target.style.display = "none"; }} />}
                      <div>
                        <strong style={{ fontSize: 14 }}>{item.name || item.title}</strong>
                        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 10 }}>/{item.slug}</span>
                        {item.price && <span style={{ fontSize: 12, color: "#059669", marginLeft: 10 }}>{item.price}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={function() { setEditing(JSON.parse(JSON.stringify(item))); }} style={btnStyle("#3B82F6", true)}>Editar</button>
                      <button onClick={function() { deleteItem(item.slug); }} style={btnStyle("#EF4444", true)}>Eliminar</button>
                    </div>
                  </div>
                ); })
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(color, small) {
  return { padding: small ? "4px 10px" : "8px 16px", background: color, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: small ? 12 : 13, fontWeight: 600 };
}

function getEmptyItem(type) {
  if (type === "products") return { slug: "", name: "", shortDesc: "", longDesc: "", price: "", oldPrice: "", image: "", imageAlt: "", category: "", badge: "", badgeColor: "", rating: 0, reviews: 0, pros: [], cons: [], verdict: "", amazonUrl: "", metaTitle: "", metaDescription: "", weeklyBest: false, position: 0 };
  if (type === "blogs") return { slug: "", title: "", excerpt: "", content: "", image: "", imageAlt: "", tag: "Blog", tagColor: "", date: new Date().toISOString().split("T")[0], readTime: "5 min", metaTitle: "", metaDescription: "" };
  if (type === "guias") return { slug: "", title: "", excerpt: "", content: "", image: "", imageAlt: "", readTime: "10 min", metaTitle: "", metaDescription: "" };
  return { slug: "", title: "", subtitle: "", tag: "", image: "", imageAlt: "" };
}

function ItemEditor({ item, type, onSave, onCancel }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(item)));

  function set(k, v) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[k] = v;
      return next;
    });
  }

  var fields = type === "products"
    ? [["slug","Slug"],["name","Nombre"],["shortDesc","Desc. corta",true],["longDesc","Desc. larga",true],["price","Precio"],["oldPrice","Precio anterior"],["image","URL Imagen"],["imageAlt","Alt imagen"],["category","Categoria"],["badge","Badge"],["rating","Rating"],["reviews","Reviews"],["verdict","Veredicto",true],["amazonUrl","URL Amazon"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]]
    : type === "blogs"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",true],["content","Contenido",true],["image","URL Imagen"],["imageAlt","Alt imagen"],["tag","Tag"],["date","Fecha"],["readTime","Tiempo lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]]
    : type === "guias"
    ? [["slug","Slug"],["title","Titulo"],["excerpt","Extracto",true],["content","Contenido",true],["image","URL Imagen"],["imageAlt","Alt imagen"],["readTime","Tiempo lectura"],["metaTitle","Meta Title"],["metaDescription","Meta Desc",true]]
    : [["slug","Slug"],["title","Titulo"],["subtitle","Subtitulo",true],["tag","Tag"],["image","URL Imagen"]];

  return (
    <div style={{ background: "#F6F6F8", borderRadius: 12, padding: 20 }}>
      <h3 style={{ marginBottom: 16 }}>{item.slug ? "Editar" : "Nuevo"}</h3>
      {form.image && <div style={{ marginBottom: 16, textAlign: "center" }}><img src={proxyImg(form.image)} alt="Preview" style={{ maxWidth: 200, maxHeight: 150, objectFit: "contain", borderRadius: 8, background: "#fff", padding: 8 }} onError={function(e) { e.target.style.display = "none"; }} /><p style={{ fontSize: 11, color: "#9CA3AF" }}>Preview</p></div>}
      {fields.map(function(f) {
        var key = f[0], label = f[1], isTextarea = f[2];
        return (
          <div key={key} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
            {isTextarea
              ? <textarea value={form[key] || ""} onChange={function(e) { set(key, e.target.value); }} rows={key === "content" || key === "longDesc" ? 8 : 3} style={inputStyle} />
              : <input value={form[key] == null ? "" : form[key]} onChange={function(e) { set(key, e.target.value); }} style={inputStyle} />
            }
          </div>
        );
      })}
      {type === "products" && <div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Pros (uno por linea)</label>
          <textarea value={Array.isArray(form.pros) ? form.pros.join("\n") : ""} onChange={function(e) { set("pros", e.target.value.split("\n").filter(Boolean)); }} rows={3} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Cons (uno por linea)</label>
          <textarea value={Array.isArray(form.cons) ? form.cons.join("\n") : ""} onChange={function(e) { set("cons", e.target.value.split("\n").filter(Boolean)); }} rows={3} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Posicion</label>
          <input type="number" value={form.position || 0} onChange={function(e) { set("position", parseInt(e.target.value) || 0); }} style={inputStyle} />
        </div>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={form.weeklyBest || false} onChange={function(e) { set("weeklyBest", e.target.checked); }} /> Producto destacado
        </label>
      </div>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={function() { onSave(form); }} style={btnStyle("#10B981")}>Guardar</button>
        <button onClick={onCancel} style={btnStyle("#6B7280")}>Cancelar</button>
      </div>
    </div>
  );
}

var inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E8E7EB", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };

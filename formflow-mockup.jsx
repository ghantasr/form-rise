import { useState } from "react";

const colors = {
  bg: "#FAFAF8",
  card: "#FFFFFF",
  primary: "#1B6B4A",
  primaryLight: "#E8F5EE",
  primaryDark: "#134F36",
  accent: "#E8593C",
  accentLight: "#FEF0EC",
  text: "#1A1A18",
  textMuted: "#6B6B66",
  textLight: "#9C9C96",
  border: "#E8E8E4",
  borderHover: "#D0D0CC",
  purple: "#6B4FBF",
  purpleLight: "#F0ECFA",
  amber: "#C47A0E",
  amberLight: "#FFF6E5",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
};

const font = `"DM Sans", "Segoe UI", system-ui, sans-serif`;
const mono = `"JetBrains Mono", "Fira Code", monospace`;

function Icon({ name, size = 18, color }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    chart: "M18 20V10M12 20V4M6 20v-6",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    qr: "M3 3h5v5H3zM16 3h5v5h-5zM3 16h5v5H3zM16 16h2v2h-2zM21 16v5h-3M16 21h2M21 12h-3M12 3v5M12 12h3M12 12v3",
    users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    fork: "M18 21a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM6 3a3 3 0 100 6 3 3 0 000-6zM6 9v6M18 9v6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
    chevDown: "M6 9l6 6 6-6",
    drag: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
    type: "M4 7V4h16v3M9 20h6M12 4v16",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    check: "M20 6L9 17l-5-5",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    hash: "M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18",
    calendar: "M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
    link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.plus} />
      {name === "eye" && <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}

// Sidebar
function Sidebar({ active, onNav }) {
  const items = [
    { id: "dashboard", icon: "grid", label: "Dashboard" },
    { id: "builder", icon: "layers", label: "Form builder" },
    { id: "responses", icon: "chart", label: "Responses" },
    { id: "templates", icon: "copy", label: "Templates" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];
  return (
    <div style={{ width: 220, background: colors.card, borderRight: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", fontFamily: font, height: "100%" }}>
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="zap" size={18} color="#fff" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 600, color: colors.text, letterSpacing: "-0.02em" }}>FormFlow</span>
      </div>
      <div style={{ padding: "0 12px", flex: 1 }}>
        {items.map(it => (
          <div key={it.id} onClick={() => onNav(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 2,
            background: active === it.id ? colors.primaryLight : "transparent",
            color: active === it.id ? colors.primaryDark : colors.textMuted,
            cursor: "pointer", fontSize: 13.5, fontWeight: active === it.id ? 600 : 400, transition: "all 0.15s"
          }}>
            <Icon name={it.icon} size={18} color={active === it.id ? colors.primary : colors.textMuted} />
            {it.label}
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 16px 20px", borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: colors.purple }}>SG</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>SaGha</div>
            <div style={{ fontSize: 11, color: colors.textLight }}>Pro plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard view
function DashboardView({ onNav }) {
  const stats = [
    { label: "Total forms", value: "24", change: "+3 this week", color: colors.primary, bg: colors.primaryLight },
    { label: "Responses", value: "1,847", change: "+312 this week", color: colors.purple, bg: colors.purpleLight },
    { label: "Active users", value: "89", change: "+12 today", color: colors.blue, bg: colors.blueLight },
    { label: "Completion rate", value: "78%", change: "+5% vs last month", color: colors.amber, bg: colors.amberLight },
  ];
  const forms = [
    { name: "Patient intake form", responses: 342, status: "active", updated: "2 hours ago" },
    { name: "Department feedback", responses: 128, status: "active", updated: "1 day ago" },
    { name: "Event registration", responses: 89, status: "paused", updated: "3 days ago" },
    { name: "Lab equipment checkout", responses: 45, status: "active", updated: "5 days ago" },
    { name: "Course evaluation Q2", responses: 203, status: "closed", updated: "1 week ago" },
  ];
  const statusColors = { active: colors.primary, paused: colors.amber, closed: colors.textLight };
  const statusBg = { active: colors.primaryLight, paused: colors.amberLight, closed: "#F0F0EC" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: colors.text, margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 0" }}>Welcome back, SaGha</p>
        </div>
        <button onClick={() => onNav("builder")} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: colors.primary, color: "#fff",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: font
        }}>
          <Icon name="plus" size={16} color="#fff" /> New form
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "18px 16px" }}>
            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: colors.text, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ background: s.bg, padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Recent forms</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "6px 12px" }}>
            <Icon name="search" size={14} color={colors.textLight} />
            <span style={{ fontSize: 12, color: colors.textLight }}>Search forms...</span>
          </div>
        </div>
        {forms.map((f, i) => (
          <div key={i} onClick={() => onNav("responses")} style={{
            display: "grid", gridTemplateColumns: "1fr 100px 80px 100px", alignItems: "center",
            padding: "14px 20px", borderBottom: i < forms.length - 1 ? `1px solid ${colors.border}` : "none",
            cursor: "pointer", transition: "background 0.1s"
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: colors.text }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: colors.textLight, marginTop: 2 }}>Updated {f.updated}</div>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, fontFamily: mono }}>{f.responses}</div>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
              background: statusBg[f.status], color: statusColors[f.status], textTransform: "capitalize", width: "fit-content"
            }}>{f.status}</span>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="share" size={14} color={colors.textMuted} />
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="qr" size={14} color={colors.textMuted} />
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="eye" size={14} color={colors.textMuted} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Form Builder view
function BuilderView() {
  const [fields] = useState([
    { type: "text", label: "Patient full name", required: true },
    { type: "mail", label: "Email address", required: true },
    { type: "list", label: "Type of prosthesis", required: true, options: ["Complete denture", "Fixed partial", "Removable partial", "Implant-supported"] },
    { type: "calendar", label: "Date of last dental visit", required: false },
    { type: "type", label: "Chief complaint", required: true },
    { type: "list", label: "Pain level (1-10)", required: false, options: ["1-3 Mild", "4-6 Moderate", "7-9 Severe", "10 Emergency"] },
    { type: "upload", label: "Upload X-ray / photos", required: false },
  ]);
  const typeIcons = { text: "type", mail: "mail", list: "list", calendar: "calendar", type: "hash", upload: "upload" };
  const typeLabels = { text: "Short text", mail: "Email", list: "Dropdown", calendar: "Date", type: "Long text", upload: "File upload" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, height: "100%" }}>
      {/* field picker */}
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, alignSelf: "start" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12 }}>Add field</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: "type", label: "Short text" }, { icon: "hash", label: "Long text" },
            { icon: "mail", label: "Email" }, { icon: "list", label: "Dropdown" },
            { icon: "check", label: "Checkbox" }, { icon: "calendar", label: "Date" },
            { icon: "star", label: "Rating" }, { icon: "upload", label: "File upload" },
            { icon: "link", label: "URL" }, { icon: "qr", label: "QR field" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8,
              border: `1px solid ${colors.border}`, cursor: "grab", fontSize: 11.5, color: colors.textMuted,
              background: colors.bg, transition: "border-color 0.15s"
            }}>
              <Icon name={f.icon} size={14} color={colors.textLight} />
              {f.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10 }}>Form settings</div>
          {["Collect email", "Limit 1 response", "Shuffle questions", "Show progress bar"].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 12, color: colors.textMuted }}>
              {s}
              <div style={{
                width: 32, height: 18, borderRadius: 10,
                background: i === 0 ? colors.primary : colors.border,
                position: "relative", cursor: "pointer", transition: "background 0.2s"
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 2, left: i === 0 ? 16 : 2, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* form canvas */}
      <div>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <input defaultValue="Patient intake form" style={{
                fontSize: 20, fontWeight: 600, color: colors.text, border: "none", outline: "none",
                background: "transparent", width: "100%", padding: 0, fontFamily: font
              }} />
              <input defaultValue="Please fill this form before your prosthodontics consultation" style={{
                fontSize: 13, color: colors.textMuted, border: "none", outline: "none",
                background: "transparent", width: "100%", padding: 0, marginTop: 6, fontFamily: font
              }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8,
                border: `1px solid ${colors.border}`, background: colors.card, fontSize: 12, fontWeight: 500,
                color: colors.textMuted, cursor: "pointer", fontFamily: font
              }}>
                <Icon name="eye" size={14} color={colors.textMuted} /> Preview
              </button>
              <button style={{
                display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 8,
                border: "none", background: colors.primary, fontSize: 12, fontWeight: 500,
                color: "#fff", cursor: "pointer", fontFamily: font
              }}>
                <Icon name="share" size={14} color="#fff" /> Publish
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fields.map((f, i) => (
            <div key={i} style={{
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10,
              padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12,
              cursor: "pointer", transition: "border-color 0.15s"
            }}>
              <div style={{ marginTop: 2, color: colors.textLight, cursor: "grab" }}>
                <Icon name="drag" size={16} color={colors.textLight} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 500,
                    color: colors.primary, background: colors.primaryLight, padding: "2px 8px", borderRadius: 4
                  }}>
                    <Icon name={typeIcons[f.type]} size={11} color={colors.primary} />
                    {typeLabels[f.type]}
                  </span>
                  {f.required && <span style={{ fontSize: 10, color: colors.accent, fontWeight: 500 }}>Required</span>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: colors.text, marginBottom: 6 }}>{f.label}</div>
                {f.type === "list" && f.options && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {f.options.map((o, j) => (
                      <span key={j} style={{
                        fontSize: 11, color: colors.textMuted, border: `1px solid ${colors.border}`,
                        padding: "3px 10px", borderRadius: 6, background: colors.bg
                      }}>{o}</span>
                    ))}
                  </div>
                )}
                {f.type !== "list" && (
                  <div style={{
                    height: 34, borderRadius: 6, border: `1px solid ${colors.border}`,
                    background: colors.bg, display: "flex", alignItems: "center", padding: "0 12px",
                    fontSize: 12, color: colors.textLight
                  }}>
                    {f.type === "upload" ? "Click or drag files here..." : `Enter ${f.label.toLowerCase()}...`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Responses view
function ResponsesView() {
  const heatData = [
    { field: "Patient full name", avgTime: "4s", dropoff: "2%", heat: 0.2 },
    { field: "Email address", avgTime: "6s", dropoff: "3%", heat: 0.3 },
    { field: "Type of prosthesis", avgTime: "12s", dropoff: "5%", heat: 0.5 },
    { field: "Date of last visit", avgTime: "8s", dropoff: "4%", heat: 0.35 },
    { field: "Chief complaint", avgTime: "28s", dropoff: "18%", heat: 0.95 },
    { field: "Pain level", avgTime: "5s", dropoff: "2%", heat: 0.2 },
    { field: "Upload X-ray", avgTime: "22s", dropoff: "15%", heat: 0.8 },
  ];
  const heatColor = (v) => {
    if (v < 0.3) return "#D4EDDA";
    if (v < 0.5) return "#FFF3CD";
    if (v < 0.7) return "#FFE0B2";
    if (v < 0.9) return "#FFCCBC";
    return "#F8D7DA";
  };

  const responses = [
    { name: "Priya Sharma", email: "priya@mail.com", type: "Complete denture", date: "2 hours ago", status: "complete" },
    { name: "Ravi Kumar", email: "ravi@mail.com", type: "Fixed partial", date: "5 hours ago", status: "complete" },
    { name: "Anitha B", email: "anitha@mail.com", type: "Implant-supported", date: "1 day ago", status: "complete" },
    { name: "Kiran Reddy", email: "kiran@mail.com", type: "Removable partial", date: "1 day ago", status: "partial" },
    { name: "Meera Joshi", email: "meera@mail.com", type: "Complete denture", date: "2 days ago", status: "complete" },
  ];

  const [tab, setTab] = useState("responses");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: 0 }}>Patient intake form</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 0" }}>342 responses · 78% completion rate</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, fontSize: 12, fontWeight: 500, color: colors.textMuted, cursor: "pointer", fontFamily: font }}>
            <Icon name="qr" size={14} color={colors.textMuted} /> QR codes
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, fontSize: 12, fontWeight: 500, color: colors.textMuted, cursor: "pointer", fontFamily: font }}>
            <Icon name="globe" size={14} color={colors.textMuted} /> Translate
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: "none", background: colors.primary, fontSize: 12, fontWeight: 500, color: "#fff", cursor: "pointer", fontFamily: font }}>
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
        {["responses", "heatmap", "analytics"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 13, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? colors.primary : colors.textMuted, cursor: "pointer",
            borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent",
            textTransform: "capitalize", transition: "all 0.15s"
          }}>{t}</div>
        ))}
      </div>

      {tab === "responses" && (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                {["Name", "Email", "Prosthesis type", "Submitted", "Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((r, i) => (
                <tr key={i} style={{ borderBottom: i < responses.length - 1 ? `1px solid ${colors.border}` : "none", cursor: "pointer" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: colors.text }}>{r.name}</td>
                  <td style={{ padding: "12px 16px", color: colors.textMuted, fontFamily: mono, fontSize: 12 }}>{r.email}</td>
                  <td style={{ padding: "12px 16px", color: colors.textMuted }}>{r.type}</td>
                  <td style={{ padding: "12px 16px", color: colors.textLight, fontSize: 12 }}>{r.date}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                      background: r.status === "complete" ? colors.primaryLight : colors.amberLight,
                      color: r.status === "complete" ? colors.primary : colors.amber
                    }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "heatmap" && (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 }}>Respondent behavior heatmap</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>See where respondents hesitate, slow down, or abandon</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {heatData.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 60px", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: heatColor(h.heat) }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{h.field}</div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${h.heat * 100}%`, borderRadius: 4, background: h.heat > 0.7 ? colors.accent : h.heat > 0.4 ? colors.amber : colors.primary, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", fontFamily: mono }}>{h.avgTime}</div>
                <div style={{ fontSize: 12, color: h.heat > 0.7 ? colors.accent : colors.textMuted, textAlign: "center", fontWeight: h.heat > 0.7 ? 600 : 400, fontFamily: mono }}>{h.dropoff}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: colors.textLight }}>
            <span>← Low friction</span>
            <span style={{ display: "flex", gap: 12 }}>
              <span>Avg time per field</span>
              <span>Drop-off %</span>
            </span>
            <span>High friction →</span>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Responses over time</div>
            <svg viewBox="0 0 300 120" style={{ width: "100%" }}>
              <polyline points="0,100 30,85 60,70 90,75 120,50 150,45 180,30 210,35 240,20 270,25 300,10" fill="none" stroke={colors.primary} strokeWidth="2" />
              <polyline points="0,100 30,85 60,70 90,75 120,50 150,45 180,30 210,35 240,20 270,25 300,10" fill={colors.primaryLight} stroke="none" opacity="0.4" />
              <line x1="0" y1="110" x2="300" y2="110" stroke={colors.border} strokeWidth="0.5" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.textLight, marginTop: 6 }}>
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Prosthesis type breakdown</div>
            {[
              { label: "Complete denture", pct: 42, color: colors.primary },
              { label: "Fixed partial", pct: 28, color: colors.purple },
              { label: "Removable partial", pct: 18, color: colors.amber },
              { label: "Implant-supported", pct: 12, color: colors.blue },
            ].map((d, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                  <span>{d.label}</span><span style={{ fontWeight: 600, fontFamily: mono }}>{d.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: colors.bg }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, borderRadius: 3, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main app
export default function FormFlowApp() {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: font, background: colors.bg, overflow: "hidden" }}>
      <Sidebar active={page} onNav={setPage} />
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
        {page === "dashboard" && <DashboardView onNav={setPage} />}
        {page === "builder" && <BuilderView />}
        {page === "responses" && <ResponsesView />}
        {page === "templates" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>Community templates</h1>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 24px" }}>Fork any template and make it yours</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { name: "Patient history intake", forks: 128, cat: "Healthcare", color: colors.primary, bg: colors.primaryLight },
                { name: "Event registration", forks: 89, cat: "Events", color: colors.purple, bg: colors.purpleLight },
                { name: "Course feedback", forks: 234, cat: "Education", color: colors.blue, bg: colors.blueLight },
                { name: "Job application", forks: 67, cat: "HR", color: colors.amber, bg: colors.amberLight },
                { name: "Product survey", forks: 156, cat: "Business", color: colors.primary, bg: colors.primaryLight },
                { name: "Lab equipment log", forks: 45, cat: "Research", color: colors.purple, bg: colors.purpleLight },
              ].map((t, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18, cursor: "pointer" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: t.bg, color: t.color }}>{t.cat}</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: "10px 0 6px" }}>{t.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: colors.textMuted }}>
                    <Icon name="fork" size={13} color={colors.textMuted} /> {t.forks} forks
                  </div>
                  <button style={{
                    marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 8,
                    border: `1px solid ${colors.border}`, background: colors.bg,
                    fontSize: 12, fontWeight: 500, color: colors.text, cursor: "pointer", fontFamily: font
                  }}>Fork this template</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {page === "settings" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: colors.text, margin: "0 0 24px" }}>Settings</h1>
            <div style={{ display: "grid", gap: 16, maxWidth: 500 }}>
              {[
                { label: "Display name", value: "SaGha", type: "text" },
                { label: "Email", value: "sagha@example.com", type: "text" },
                { label: "Default language", value: "English", type: "select" },
                { label: "Webhook URL", value: "https://", type: "text" },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input defaultValue={f.value} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${colors.border}`,
                    fontSize: 13, color: colors.text, fontFamily: font, background: colors.card, boxSizing: "border-box"
                  }} />
                </div>
              ))}
              <button style={{
                padding: "10px 24px", borderRadius: 8, border: "none", background: colors.primary,
                color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: font, width: "fit-content"
              }}>Save changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

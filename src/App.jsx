import { useState, useEffect, useMemo, useRef } from "react";
import { Printer, Save, Plus, Trash2, FileSpreadsheet, Package, ArrowLeft, Settings, X, FileDown, RefreshCw, Database, Users, Send, Scissors, Mail } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CONSTANTS
═══════════════════════════════════════════════════════════════ */
const DEFAULT_SAMPLE_TYPES = [
  "Bath Towel (70x140)", "Hand Towel (40x60)", "Face Towel (30x30)",
  "Bath Mat", "Kitchen Towel", "Pool Towel", "Gym Towel", "Terry Fabric Swatch"
];
const DEFAULT_COURIERS = [
  "DTDC", "Trackon", "Professional Couriers", "Maruti",
  "Anjani", "Tirupati", "Blue Dart", "DHL", "FedEx"
];
const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbymS4iJvn2urnKLIyaTw49Xmo0Ltjb0k5_Q1hbNJeLyrfjkcuFMgC04PmJEbx-NY-8B/exec";
const DEFAULT_PRODUCTS_DRIVE_URL = "https://script.google.com/macros/s/AKfycbz4cSEAqiENHZhkBDOJUiRoaXvmV7h7WY5Rilb_-hIUSLn3Of-I2pTk60voDP63k8Nf/exec";
/* ─────────────────────────────────────────────────────────────────
   GLOBAL ACTIVITY LOGGER
   Call logActivity(icon, title, sub, module) from anywhere.
   Stores up to 60 events in localStorage. HomeModule reads them.
───────────────────────────────────────────────────────────────── */
const ACTIVITY_KEY = "kht_activity_log";
function logActivity(icon, title, sub, module = "") {
  try {
    const prev = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]");
    const entry = { id: Date.now(), ts: Date.now(), icon, title, sub, module };
    const next = [entry, ...prev].slice(0, 60);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
  } catch {}
}
function getActivity() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
}
function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60)  return "just now";
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}


// Shared Anthropic API helper — reads key from localStorage
const anthropicFetch = (prompt, systemPrompt = "") => {
  const key = localStorage.getItem("kht_anthropic_key") || "";
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
};
const getAnthropicKey = () => localStorage.getItem("kht_anthropic_key") || "";
const SENDER = {
  name: "Kshirsagar Hometextiles",
  website: "www.terrytowel.in",
  quotationLink: "terrytowel.in/quotation",
  address: "Nath Pride, Near Civil Hospital",
  address2: "Civil Chowk",
  city: "Solapur", state: "Maharashtra", zip: "413003", country: "India",
  email: "info@kshirsagar.com", phone: "+91 98225 49824", gst: "27ANLPK9383J1Z8"
};

const formatDateIndian = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString("en-IN");
  } catch { return dateVal; }
};

/* ═══════════════════════════════════════════════════════════════
   SAMPLE DATA (other modules)
═══════════════════════════════════════════════════════════════ */
const CUSTOMERS = [
  { id: 1, name: "Rajesh Mehta", biz: "Home Needs Store, Pune", phone: "9876543210", email: "rajesh@homeneedsstore.com", city: "Pune", status: "Hot", lastContact: "2 days ago" },
  { id: 2, name: "Sunita Kapoor", biz: "Kapoor Textiles, Nagpur", phone: "9823456789", email: "sunita@kpoortex.com", city: "Nagpur", status: "Warm", lastContact: "1 week ago" },
  { id: 3, name: "Amit Sharma", biz: "Sharma Wholesale, Mumbai", phone: "9765432109", email: "amit@sharmawhol.com", city: "Mumbai", status: "New", lastContact: "3 days ago" },
  { id: 4, name: "Priya Desai", biz: "D-Mart Supplier", phone: "9012345678", email: "priya.desai@supplier.com", city: "Ahmedabad", status: "Warm", lastContact: "5 days ago" },
  { id: 5, name: "Vikram Joshi", biz: "Joshi General Stores", phone: "8888123456", email: "vjoshi@gmail.com", city: "Nashik", status: "Cold", lastContact: "3 weeks ago" },
];
const PRODUCTS_DATA = [
  { id: 1, name: "Classic Bath Towel", cat: "Bath Towels", gsm: "450", price: "₹280", emoji: "🛁", sizes: "70x140 cm" },
  { id: 2, name: "Premium Hand Towel", cat: "Hand Towels", gsm: "550", price: "₹140", emoji: "🤲", sizes: "40x60 cm" },
  { id: 3, name: "Microfibre Sports", cat: "Sports Towels", gsm: "300", price: "₹180", emoji: "💪", sizes: "50x100 cm" },
  { id: 4, name: "Luxury Bath Robe", cat: "Bath Robes", gsm: "600", price: "₹1200", emoji: "🥋", sizes: "Free Size" },
  { id: 5, name: "Anti-slip Bath Mat", cat: "Bath Mats", gsm: "900", price: "₹320", emoji: "🟫", sizes: "45x75 cm" },
  { id: 6, name: "Kids Hooded Towel", cat: "Kids Range", gsm: "400", price: "₹360", emoji: "👶", sizes: "60x120 cm" },
  { id: 7, name: "Face Towel Set", cat: "Face Towels", gsm: "500", price: "₹95", emoji: "😊", sizes: "30x30 cm" },
  { id: 8, name: "Pool Towel XL", cat: "Pool Towels", gsm: "350", price: "₹420", emoji: "🏊", sizes: "100x180 cm" },
];
const DOCS = [
  { id: 1, name: "GST Registration.pdf", cat: "Legal & Tax", icon: "📄", size: "1.2 MB", date: "Jan 2024", preview: "pdf" },
  { id: 2, name: "MSME Certificate.pdf", cat: "Legal & Tax", icon: "📄", size: "800 KB", date: "Mar 2023", preview: "pdf" },
  { id: 3, name: "Price List Q1 2025.xlsx", cat: "Price Lists", icon: "📊", size: "320 KB", date: "Jan 2025", preview: "excel" },
  { id: 4, name: "Price List Q4 2024.xlsx", cat: "Price Lists", icon: "📊", size: "300 KB", date: "Oct 2024", preview: "excel" },
  { id: 5, name: "Quotation - Rajesh Mehta.pdf", cat: "Quotations", icon: "📋", size: "200 KB", date: "Dec 2024", preview: "pdf" },
  { id: 6, name: "Quotation - Kapoor Textiles.pdf", cat: "Quotations", icon: "📋", size: "210 KB", date: "Nov 2024", preview: "pdf" },
  { id: 7, name: "Fabric Swatches 2025.jpg", cat: "Images", icon: "🖼️", size: "4.5 MB", date: "Feb 2025", preview: "image" },
  { id: 8, name: "Logistics Partner MOU.pdf", cat: "Logistics", icon: "🚚", size: "600 KB", date: "Aug 2024", preview: "pdf" },
  { id: 9, name: "Annual Sales Report 2024.xlsx", cat: "Reports", icon: "📈", size: "1.8 MB", date: "Jan 2025", preview: "excel" },
];



/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES — v3 REDESIGN
═══════════════════════════════════════════════════════════════ */
const KHT_LOGO = "data:image/jpeg;base64,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";

const GLOBAL_STYLE = `
/* ─────────────────────────────────────────────────────────────────
   KHT · iOS Light — White translucent glass, data-first
   Background: very soft warm-white with faint blue tint
   Glass: bright frosted white panels, dark readable text
───────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body, #root {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  background: #E8EDF5;
  height: 100vh; overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  /* Glass layers */
  --glass:        rgba(255,255,255,.72);
  --glass-hover:  rgba(255,255,255,.86);
  --glass-strong: rgba(255,255,255,.90);
  --glass-border: rgba(0,0,0,.06);
  --glass-sep:    rgba(0,0,0,.07);

  /* Labels — dark on light */
  --label:   rgba(0,0,0,.90);
  --label2:  rgba(0,0,0,.55);
  --label3:  rgba(0,0,0,.36);
  --label4:  rgba(0,0,0,.18);

  /* iOS system colours */
  --blue:       #007AFF;
  --blue-l:     rgba(0,122,255,.12);
  --green:      #34C759;
  --green-l:    rgba(52,199,89,.13);
  --red:        #FF3B30;
  --red-l:      rgba(255,59,48,.11);
  --orange:     #FF9500;
  --orange-l:   rgba(255,149,0,.13);
  --purple:     #AF52DE;
  --teal:       #5AC8FA;

  /* Legacy compat */
  --bg:         transparent;
  --bg2:        rgba(255,255,255,.80);
  --bg3:        rgba(255,255,255,.50);
  --cream:      rgba(255,255,255,.60);
  --white:      #ffffff;
  --border:     rgba(0,0,0,.08);
  --border-l:   rgba(0,0,0,.05);
  --sep:        rgba(0,0,0,.07);
  --sep-opaque: rgba(0,0,0,.12);
  --text-dark:  rgba(0,0,0,.90);
  --text-mid:   rgba(0,0,0,.55);
  --text-light: rgba(0,0,0,.36);
  --fill:       rgba(0,0,0,.05);
  --fill2:      rgba(0,0,0,.04);
  --fill3:      rgba(0,0,0,.03);
  --gold:       #FF9500;
  --gold-l:     #FFCC00;
  --gold-p:     rgba(255,149,0,.12);
  --gold-pp:    rgba(255,149,0,.06);
  --navy:       #1C1C1E;
  --radius:    14px;
  --radius-sm: 10px;
  --radius-xs: 7px;
  --shadow-sm:  0 1px 6px rgba(0,0,0,.07), 0 0 0 0.5px rgba(0,0,0,.05);
  --shadow-md:  0 4px 20px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.06);
  --shadow-lg:  0 12px 48px rgba(0,0,0,.14), 0 4px 12px rgba(0,0,0,.08);
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.14); border-radius: 8px; }

/* ── SHELL — soft warm-white wallpaper ── */
.erp-shell {
  display: flex; height: 100vh; overflow: hidden;
  background:
    radial-gradient(ellipse 700px 500px at 15% 20%, rgba(0,122,255,.07) 0%, transparent 60%),
    radial-gradient(ellipse 600px 400px at 85% 80%, rgba(88,86,214,.06) 0%, transparent 60%),
    radial-gradient(ellipse 500px 400px at 80% 10%, rgba(52,199,89,.05) 0%, transparent 55%),
    #EDF0F7;
  position: relative;
}

/* ── SIDEBAR — frosted white, macOS Finder style ── */
.sb {
  width: 222px; min-width: 222px; flex-shrink: 0;
  background: rgba(248,249,252,.88);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-right: 0.5px solid rgba(0,0,0,.09);
  display: flex; flex-direction: column;
  position: relative; z-index: 2;
}
.sb-logo { padding: 16px 16px 14px; border-bottom: 0.5px solid rgba(0,0,0,.08); }
.sb-logo h1 { font-size: 15px; font-weight: 700; color: var(--label); line-height: 1.3; letter-spacing: -.025em; }
.sb-logo span { display: block; font-size: 10.5px; font-weight: 400; color: var(--label3); margin-top: 3px; }
.sb-nav { flex: 1; padding: 10px 8px; overflow-y: auto; }
.sb-section { font-size: 10px; font-weight: 600; color: var(--label3); padding: 14px 10px 4px; text-transform: uppercase; letter-spacing: .08em; }
.sb-item {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 11px; border-radius: var(--radius-sm);
  cursor: pointer; margin-bottom: 1px;
  color: var(--label2); font-size: 13.5px; font-weight: 500;
  transition: all .14s ease; user-select: none;
}
.sb-item:hover { background: rgba(0,0,0,.05); color: var(--label); }
.sb-item.active { background: var(--blue); color: #fff; box-shadow: 0 2px 12px rgba(0,122,255,.30); }
.sb-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
.sb-foot { padding: 12px 18px; border-top: 0.5px solid rgba(0,0,0,.08); }
.sb-foot p { font-size: 11px; color: var(--label3); line-height: 1.6; }
.sb-foot strong { color: var(--label2); font-weight: 600; }

/* ── MAIN ── */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; z-index: 1; }
.topbar {
  background: rgba(255,255,255,.80);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-bottom: 0.5px solid rgba(0,0,0,.09);
  height: 52px; padding: 0 22px;
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.topbar-title { font-size: 17px; font-weight: 600; color: var(--label); letter-spacing: -.025em; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.topbar-pill {
  background: rgba(0,0,0,.06); color: var(--label2);
  font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 20px;
}
.topbar-av {
  width: 30px; height: 30px; border-radius: 50%; background: var(--blue);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
  box-shadow: 0 2px 8px rgba(0,122,255,.30);
}
.content { flex: 1; overflow-y: auto; padding: 22px 22px; background: transparent; }

/* ── CARD — white frosted glass panel ── */
.card {
  background: var(--glass);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-radius: var(--radius);
  border: 0.5px solid rgba(255,255,255,.9);
  box-shadow: var(--shadow-sm);
  padding: 16px 18px;
  transition: background .2s, box-shadow .2s;
}
.card:hover { background: var(--glass-hover); box-shadow: var(--shadow-md); }
.card-title { font-size: 15px; font-weight: 600; color: var(--label); margin-bottom: 2px; letter-spacing: -.02em; }
.card-sub { font-size: 12px; color: var(--label3); margin-bottom: 14px; }

/* ── STAT CARDS ── */
.stat {
  background: var(--glass);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-radius: var(--radius);
  border: 0.5px solid rgba(255,255,255,.9);
  box-shadow: var(--shadow-sm);
  padding: 16px 18px; position: relative; overflow: hidden;
  transition: all .2s; cursor: pointer;
}
.stat:hover { background: var(--glass-hover); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat::before { content:''; position:absolute; left:0; top:18px; bottom:18px; width:3px; border-radius:0 3px 3px 0; }
.stat.gold::before  { background: var(--orange); }
.stat.blue::before  { background: var(--blue); }
.stat.green::before { background: var(--green); }
.stat.red::before   { background: var(--red); }
.stat-n { font-size: 30px; font-weight: 700; color: var(--label); line-height: 1; margin-top: 4px; letter-spacing: -.04em; }
.stat-l { font-size: 12px; color: var(--label2); font-weight: 500; margin-top: 5px; }
.stat-s { font-size: 11px; color: var(--label3); margin-top: 2px; }

/* ── GRIDS ── */
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.g4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer; border: none;
  transition: all .14s; white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -.01em;
}
.btn-gold    { background: var(--blue); color: #fff; }
.btn-gold:hover { background: #0066DD; }
.btn-out     { background: rgba(0,0,0,.06); color: var(--label); border: none; }
.btn-out:hover  { background: rgba(0,0,0,.10); }
.btn-red     { background: var(--red-l); color: var(--red); border: none; }
.btn-success { background: var(--green-l); color: #1A8A3C; border: none; }
.btn-sm { padding: 5px 12px; font-size: 12px; border-radius: var(--radius-xs); }
.btn-full { width: 100%; justify-content: center; }
.btn:disabled { opacity: .35; cursor: not-allowed; }

/* ── FORM ── */
.inp, .sel, .ta {
  width: 100%; padding: 10px 12px; border: none;
  border-radius: var(--radius-sm); font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  color: var(--label); background: rgba(0,0,0,.05);
  outline: none; transition: all .14s;
}
.inp::placeholder, .ta::placeholder { color: var(--label3); }
.inp:focus, .sel:focus, .ta:focus {
  background: rgba(0,0,0,.07);
  box-shadow: 0 0 0 3px rgba(0,122,255,.18);
}
.sel option { background: #fff; color: #000; }
.ta { resize: vertical; min-height: 76px; }
.lbl { display: block; font-size: 11.5px; font-weight: 600; color: var(--label2); margin-bottom: 5px; }
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-bottom: 11px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 11px; margin-bottom: 11px; }

/* ── TABLE ── */
.tbl { width: 100%; border-collapse: collapse; }
.tbl th {
  text-align: left; font-size: 10.5px; font-weight: 600;
  color: var(--label3); letter-spacing: .06em;
  padding: 8px 12px; border-bottom: 0.5px solid rgba(0,0,0,.08);
  background: rgba(0,0,0,.02); text-transform: uppercase;
}
.tbl td { padding: 11px 12px; font-size: 13px; color: var(--label); border-bottom: 0.5px solid rgba(0,0,0,.06); vertical-align: middle; }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: rgba(0,122,255,.04); }

/* ── TAGS ── */
.tag { display: inline-block; padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.tag-gold  { background: var(--orange-l); color: #A05A00; }
.tag-blue  { background: var(--blue-l);   color: var(--blue); }
.tag-green { background: var(--green-l);  color: #1A7A3A; }
.tag-red   { background: var(--red-l);    color: var(--red); }
.tag-gray  { background: rgba(0,0,0,.07); color: var(--label2); }

/* ── SECTION HEADER ── */
.sh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.st { font-size: 18px; font-weight: 700; color: var(--label); letter-spacing: -.03em; }

/* ── DISPATCH ── */
.paste-area {
  border: 1.5px dashed rgba(0,122,255,.30); border-radius: var(--radius-sm); padding: 14px;
  background: rgba(0,122,255,.04); font-size: 13px; color: var(--label2);
  font-family: -apple-system, BlinkMacSystemFont, monospace;
  outline: none; resize: vertical; min-height: 100px; transition: border-color .15s; width: 100%;
}
.paste-area:focus { border-color: var(--blue); }
.paste-area::placeholder { color: var(--label3); }
.num-badge {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--blue-l); color: var(--blue);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.action-btn {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 11px 16px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer; border: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; transition: all .15s;
}

/* ── PRINT PREVIEW ── */
.print-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(8px); z-index: 9999; display: flex; flex-direction: column; }
.print-topbar {
  background: rgba(255,255,255,.90); backdrop-filter: blur(24px);
  padding: 13px 22px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 0.5px solid rgba(0,0,0,.08); flex-shrink: 0;
}
.print-canvas { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 32px 24px; gap: 24px; background: #e0e4ec; }

/* ── NOTIFICATION ── */
.notif {
  position: fixed; top: 16px; right: 16px;
  background: rgba(255,255,255,.90);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  color: var(--label); padding: 10px 18px; border-radius: 14px;
  font-size: 13px; font-weight: 500; z-index: 99999;
  border: 0.5px solid rgba(0,0,0,.08); box-shadow: var(--shadow-lg);
  animation: slideIn .25s cubic-bezier(.34,1.56,.64,1);
}
@keyframes slideIn { from{opacity:0;transform:translateY(-14px) scale(.94)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.spin { animation: spin 1s linear infinite; }

/* ── CRM ── */
.avatar {
  width: 36px; height: 36px; border-radius: 50%; background: var(--blue);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.cust-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; transition: all .12s; }
.cust-row:hover { background: rgba(0,0,0,.05); }
.cust-row.sel { background: var(--blue-l); }

/* ── PRODUCTS ── */
.prod-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); gap: 12px; }
.prod-card {
  border-radius: var(--radius); overflow: hidden;
  background: var(--glass); cursor: pointer;
  border: 0.5px solid rgba(255,255,255,.9); box-shadow: var(--shadow-sm);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  transition: all .2s;
}
.prod-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); background: var(--glass-hover); }
.prod-img { width: 100%; height: 110px; background: rgba(0,0,0,.04); display: flex; align-items: center; justify-content: center; font-size: 32px; }
.prod-info { padding: 10px 12px; }

/* ── DOCUMENTS ── */
.doc-split {
  display: flex; border-radius: var(--radius); overflow: hidden; height: calc(100vh - 140px);
  background: var(--glass); backdrop-filter: blur(24px); border: 0.5px solid rgba(255,255,255,.9); box-shadow: var(--shadow-sm);
}
.doc-left { width: 260px; min-width: 260px; border-right: 0.5px solid rgba(0,0,0,.08); overflow-y: auto; padding: 8px; background: rgba(0,0,0,.02); }
.doc-right { flex: 1; padding: 20px; overflow-y: auto; }
.doc-item { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: var(--radius-xs); cursor: pointer; margin-bottom: 1px; transition: all .12s; }
.doc-item:hover { background: rgba(0,0,0,.05); }
.doc-item.sel { background: var(--blue-l); }
.doc-cat-h { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--label3); padding: 10px 11px 4px; }

/* ── AI ── */
.ai-box {
  background: rgba(0,0,0,.04); border: 0.5px solid rgba(0,0,0,.08);
  border-radius: var(--radius-sm); padding: 14px;
  font-size: 13px; line-height: 1.7; color: var(--label); white-space: pre-wrap; min-height: 100px;
}
.dots { display: inline-flex; gap: 4px; }
.dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); animation: pulse 1.2s infinite; }
.dots span:nth-child(2){animation-delay:.2s} .dots span:nth-child(3){animation-delay:.4s}
@keyframes pulse{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
@keyframes livepulse{0%,100%{box-shadow:0 0 0 3px rgba(52,199,89,.25)}50%{box-shadow:0 0 0 6px rgba(52,199,89,.08)}}

/* ── WA BUTTON ── */
.wa-btn {
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--green-l); color: #1A8A3C; border: none;
  padding: 8px 16px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}
.wa-btn:hover { background: rgba(52,199,89,.22); }

/* ── UTILITY ── */
.divider { border: none; border-top: 0.5px solid rgba(0,0,0,.08); margin: 14px 0; }
.upload-z {
  border: 1.5px dashed rgba(0,122,255,.25); border-radius: var(--radius-sm);
  padding: 28px; text-align: center; cursor: pointer; transition: all .15s;
  background: rgba(0,0,0,.03);
}
.upload-z:hover { border-color: var(--blue); background: var(--blue-l); }
.mt2{margin-top:8px} .mt3{margin-top:12px} .mt4{margin-top:16px}
.mb2{margin-bottom:8px} .mb3{margin-bottom:12px} .mb4{margin-bottom:16px}
.flex{display:flex} .items-c{align-items:center} .justify-b{justify-content:space-between}
.gap2{gap:8px} .gap3{gap:12px} .gap4{gap:16px} .w100{width:100%} .fw6{font-weight:600}
.text-sm{font-size:12.5px} .text-xs{font-size:11px}
.text-gold{color:var(--orange)} .text-lt{color:var(--label3)}
.sticky-top{position:sticky;top:0;z-index:10}

@media print {
  body * { visibility: hidden !important; }
  #doc-preview, #doc-preview * { visibility: visible !important; }
  #doc-preview { position: fixed !important; left: 0 !important; top: 0 !important; margin: 0 !important; box-shadow: none !important; }
}`

/* ═══════════════════════════════════════════════════════════════
   PRINT TEMPLATES — v3 REDESIGN
═══════════════════════════════════════════════════════════════ */
function HalfSheet({ data, type }) {
  const { recipient, dispatchInfo, items, sender } = data;
  const totalQty = items.reduce((acc, i) => acc + parseInt(i.qty || 0), 0);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent("https://terrytowel.in/")}`;
  const isCourier = type === "COURIER COPY";
  const navy = "#0D1B2A", gold = "#C9A84C";

  return (
    <div style={{ fontFamily: "'Arial', sans-serif", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", background: "white", overflow: "hidden" }}>

      {/* ── TOP HEADER BAND ── */}
      <div style={{ background: navy, padding: "7px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>{sender.name}</div>
          <div style={{ fontSize: 7.5, color: gold, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 3 }}>
            {sender.address}, {sender.address2}, {sender.city} – {sender.zip} &nbsp;|&nbsp; {sender.phone} &nbsp;|&nbsp; {sender.website}
          </div>
        </div>
        <div style={{ background: isCourier ? gold : "#FFFFFF22", color: isCourier ? navy : "white", fontSize: 8, fontWeight: 900, padding: "5px 14px", letterSpacing: "0.18em", textTransform: "uppercase", borderRadius: 3, border: isCourier ? "none" : "1.5px solid #ffffff44", whiteSpace: "nowrap" }}>
          ✦ {type}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT — SHIP TO (dominant, max space) */}
        <div style={{ flex: "0 0 58%", borderRight: `3px solid ${navy}`, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>

          {/* FROM section */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 7, fontWeight: 900, color: "#999", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 4 }}>From</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: navy }}>{sender.name}</div>
            <div style={{ fontSize: 9, color: "#555", lineHeight: 1.5, marginTop: 1 }}>{sender.address}, {sender.city} – {sender.zip}</div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `2px solid ${gold}`, marginBottom: 12 }} />

          {/* BIG TO ADDRESS */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, color: gold, textTransform: "uppercase", letterSpacing: "0.22em", whiteSpace: "nowrap" }}>Ship To</div>
              <div style={{ flex: 1, height: "1.5px", background: `${gold}55` }} />
            </div>

            {/* RECIPIENT NAME — super large */}
            <div style={{ fontSize: 28, fontWeight: 900, color: navy, lineHeight: 1.1, marginBottom: 4, wordBreak: "break-word" }}>
              {recipient.name}
            </div>

            {recipient.company && (
              <div style={{ fontSize: 14, fontWeight: 800, color: "#333", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #eee" }}>
                {recipient.company}
              </div>
            )}

            <div style={{ fontSize: 15, color: "#333", lineHeight: 1.9, marginBottom: 2 }}>
              {(() => {
                const parts = (recipient.address || "").split(",");
                const line1 = parts.slice(0, 2).join(",");
                const line2 = parts.slice(2).join(",").trim();
                return (<>{line1}{line2 && <><br />{line2}</>}</>);
              })()}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: navy, marginBottom: 8 }}>
              {recipient.city}{recipient.state ? `,\u00A0${recipient.state}` : ""} &nbsp;–&nbsp; <span style={{ letterSpacing: "0.08em" }}>{recipient.zip}</span>
            </div>

            {recipient.phone && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0F4F8", border: `1.5px solid #D8E2EE`, borderRadius: 5, padding: "5px 12px" }}>
                <span style={{ fontSize: 13 }}>📞</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: navy, letterSpacing: "0.04em" }}>{recipient.phone}</span>
              </div>
            )}
          </div>

          {/* Signature row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12, paddingTop: 10, borderTop: "1px solid #E8EDF3" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 90, borderBottom: "1.5px solid #555", marginBottom: 3 }} />
              <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", fontWeight: 700 }}>Receiver's Signature</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: "#555", marginBottom: 14 }}>For {sender.name}</div>
              <div style={{ width: 90, borderBottom: "1.5px solid #555", marginBottom: 3 }} />
              <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", fontWeight: 700 }}>Authorised Signatory</div>
            </div>
          </div>
        </div>

        {/* RIGHT — DISPATCH INFO + ITEMS */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 14px 10px" }}>

          {/* QR Code */}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <img src={qrUrl} alt="QR" style={{ width: 72, height: 72, border: `2px solid ${navy}`, borderRadius: 6 }} />
            <div style={{ fontSize: 7, color: "#aaa", marginTop: 3, letterSpacing: "0.1em", fontWeight: 700 }}>SCAN TO VERIFY</div>
          </div>

          {/* Dispatch Meta */}
          <div style={{ borderRadius: 6, overflow: "hidden", border: `1.5px solid #D8E2EE`, marginBottom: 10 }}>
            <div style={{ background: navy, padding: "5px 10px" }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: "white", letterSpacing: "0.14em", textTransform: "uppercase" }}>Dispatch Details</div>
            </div>
            {[
              ["Date", formatDateIndian(dispatchInfo.date)],
              ["Via", dispatchInfo.courierName],
              ...(dispatchInfo.trackingNo ? [["Tracking #", dispatchInfo.trackingNo]] : []),
              ...(dispatchInfo.weight ? [["Weight", `${dispatchInfo.weight} ${dispatchInfo.weightUnit}`]] : []),
              ["Value", `₹ ${dispatchInfo.declaredValue || "0"}`],
            ].map(([k, v], idx, arr) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 10px", borderBottom: idx < arr.length - 1 ? "1px solid #F0F4F8" : "none", background: idx % 2 === 0 ? "white" : "#FAFCFF" }}>
                <span style={{ fontSize: 8, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{k}</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: navy, textAlign: "right", maxWidth: "58%", wordBreak: "break-word" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <div style={{ borderRadius: 6, overflow: "hidden", border: `1.5px solid #D8E2EE`, flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5 }}>
              <thead>
                <tr>
                  <th style={{ background: gold, color: navy, padding: "5px 8px", fontSize: 7.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left" }}>Items Dispatched</th>
                  <th style={{ background: gold, color: navy, padding: "5px 8px", fontSize: 7.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", width: 32 }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#FFFDF5" }}>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #F5F0E8", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 800, color: navy, fontSize: 8.5 }}>{item.type}</div>
                      {item.desc && <div style={{ color: "#888", fontSize: 7.5, marginTop: 1 }}>{item.desc}</div>}
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #F5F0E8", textAlign: "center", fontWeight: 900, color: navy }}>{item.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: `${navy}11` }}>
                  <td style={{ padding: "5px 8px", fontWeight: 900, textAlign: "right", color: navy, fontSize: 9, borderTop: `2px solid ${navy}` }}>Total Pieces</td>
                  <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 900, color: navy, fontSize: 11, borderTop: `2px solid ${navy}` }}>{totalQty}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* GST note */}
          <div style={{ marginTop: 8, fontSize: 7.5, color: "#888", textAlign: "center" }}>
            GST: <strong style={{ color: navy }}>{sender.gst}</strong> &nbsp;·&nbsp; No Commercial Value
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintTemplate({ data }) {
  return (
    <div style={{ width: "210mm", height: "296mm", background: "white", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>

      {/* ── COURIER COPY (top half — paste on parcel) ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <HalfSheet data={data} type="COURIER COPY" />
      </div>

      {/* ── CUT LINE ── */}
      <div style={{ flexShrink: 0, height: 22, display: "flex", alignItems: "center", background: "#F8FAFC" }}>
        <div style={{ flex: 1, borderTop: "2px dashed #94A3B8" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", fontSize: 8, color: "#64748B", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          <Scissors size={12} color="#94A3B8" />
          CUT &amp; PASTE ON PARCEL
          <Scissors size={12} color="#94A3B8" style={{ transform: "scaleX(-1)" }} />
        </div>
        <div style={{ flex: 1, borderTop: "2px dashed #94A3B8" }} />
      </div>

      {/* ── OFFICE COPY (bottom half — keep for records) ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <HalfSheet data={data} type="OFFICE COPY" />
      </div>

    </div>
  );
}

function EnvelopeTemplate({ data }) {
  const { recipient } = data;
  return (
    <div style={{ width: "9in", height: "4.5in", background: "white", position: "relative", padding: 16, display: "flex", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", left: "45%", top: "1.5cm", width: "50%" }}>
        <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>To:</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 4 }}>{recipient.name}</div>
        {recipient.company && <div style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{recipient.company}</div>}
        <div style={{ fontSize: 14, color: "#333", lineHeight: 1.4 }}>{recipient.address}</div>
        <div style={{ fontSize: 14, color: "#333", fontWeight: 600, marginTop: 4 }}>
          {recipient.city}{recipient.state ? `, ${recipient.state}` : ""} - {recipient.zip}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>Ph: {recipient.phone}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRINT PREVIEW OVERLAY
═══════════════════════════════════════════════════════════════ */
function PrintOverlay({ printData, previewMode, onClose }) {
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [notif, setNotif] = useState(null);

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 2800); };

  useEffect(() => {
    const loadScript = (src) => new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement("script");
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.body.appendChild(s);
    });
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js")
      .then(() => setIsPdfReady(true)).catch(() => {});
  }, []);

  const handleDownloadPdf = () => {
    if (!window.html2pdf || !printData) return;
    const el = document.getElementById("doc-preview");
    const opt = previewMode === "envelope"
      ? { margin: 0, filename: `Envelope_${printData.recipient.name}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: [9, 4.5], orientation: "landscape" } }
      : { margin: 0, filename: `Dispatch_${printData.recipient.name}_${printData.dispatchInfo.date}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, scrollY: 0, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }, pagebreak: { mode: ["avoid-all"] } };
    showNotif("Generating PDF…");
    window.html2pdf().set(opt).from(el).save().then(() => showNotif("Downloaded!"));
  };

  return (
    <div className="print-overlay">
      {notif && <div className="notif">{notif}</div>}
      <div className="print-topbar">
        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--label)", display: "flex", alignItems: "center", gap: 10 }}>
          <Printer size={20} color="#C9A84C" />
          {previewMode === "envelope" ? "Envelope Preview" : "Dispatch Label Preview"}
        </div>
        <div className="flex gap3 items-c">
          <button className="btn btn-gold" onClick={handleDownloadPdf} disabled={!isPdfReady}>
            <FileDown size={16} /> {isPdfReady ? "Save PDF" : "Loading…"}
          </button>
          <button className="btn btn-navy" onClick={() => window.print()}>
            <Printer size={16} /> Print Now
          </button>
          <button className="btn btn-out" onClick={onClose}><X size={16} /> Close</button>
        </div>
      </div>
      <div className="print-canvas">
        <div id="doc-preview" style={{ background: "white", boxShadow: "0 8px 40px rgba(0,0,0,.4)", borderRadius: 4 }}>
          {previewMode === "envelope" ? <EnvelopeTemplate data={printData} /> : <PrintTemplate data={printData} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DISPATCH MODULE (full implementation)
═══════════════════════════════════════════════════════════════ */
function DispatchModule({ showNotif }) {
  const [dispView, setDispView] = useState("form");
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [previewMode, setPreviewMode] = useState("dispatch");
  const [isSaving, setIsSaving] = useState(false);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(DEFAULT_WEBHOOK_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [availableTypes, setAvailableTypes] = useState(DEFAULT_SAMPLE_TYPES);
  const [availableCouriers, setAvailableCouriers] = useState(DEFAULT_COURIERS);
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [isAddingCourier, setIsAddingCourier] = useState(false);
  const [newCourierName, setNewCourierName] = useState("");

  const [recipient, setRecipient] = useState({ name: "", company: "", address: "", city: "", state: "", zip: "", phone: "" });
  const [dispatchInfo, setDispatchInfo] = useState({
    date: new Date().toISOString().split("T")[0],
    courierName: DEFAULT_COURIERS[0], trackingNo: "", declaredValue: 0, weight: "", weightUnit: "kg"
  });
  const [items, setItems] = useState([{ id: 1, type: DEFAULT_SAMPLE_TYPES[0], desc: "GSM 450, White", qty: 1 }]);

  const contacts = useMemo(() => {
    const unique = new Map();
    history.forEach(item => {
      const key = `${item.recipient.name?.trim().toLowerCase()}-${(item.recipient.company || "").trim().toLowerCase()}`;
      if (!unique.has(key) && item.recipient.name) unique.set(key, item.recipient);
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [history]);

  useEffect(() => {
    if (dispView === "history" || dispView === "contacts") fetchSheetHistory();
  }, [dispView]);

  const fetchSheetHistory = async () => {
    if (!sheetWebhookUrl) { showNotif("Webhook URL missing!"); return; }
    setIsLoadingHistory(true);
    try {
      const response = await fetch(sheetWebhookUrl);
      const rawData = await response.json();
      let startIndex = rawData.length > 0 && String(rawData[0][0]).toLowerCase().includes("date") ? 1 : 0;
      const parsedHistory = rawData.slice(startIndex).map((row, index) => {
        if (!row || !row[0]) return null;
        let h = { id: `sheet-${index}`, recipient: { name: "", company: "", address: "", city: "", state: "", zip: "", phone: "" }, dispatchInfo: { date: row[0], courierName: "", trackingNo: "", declaredValue: "", weight: "", weightUnit: "" }, items: [] };
        const extractPhone = (addrStr) => {
          if (!addrStr) return { address: "", phone: "" };
          const match = addrStr.match(/\{P:(.*?)\}/);
          return match ? { address: addrStr.replace(match[0], "").trim(), phone: match[1].trim() } : { address: addrStr, phone: "" };
        };
        const parseWeight = (wStr) => {
          if (!wStr) return { weight: "", weightUnit: "kg" };
          const match = wStr.match(/^(\d+(\.\d+)?)\s*(kg|grams)$/i);
          return match ? { weight: match[1], weightUnit: match[3].toLowerCase() } : { weight: wStr, weightUnit: "kg" };
        };
        const parseItems = (itemString) => {
          if (!itemString) return [];
          return itemString.split(",").map((s, i) => {
            const match = s.trim().match(/^(\d+)x\s(.+)$/);
            return match ? { id: i, qty: match[1], type: match[2], desc: "" } : { id: i, qty: 1, type: s.trim(), desc: "" };
          });
        };
        if (row.length >= 11) {
          const { weight, weightUnit } = parseWeight(row[9]);
          let phone = row[10] || ""; let address = row[3];
          if (!phone) { const e = extractPhone(row[3]); address = e.address; phone = e.phone; }
          h.recipient = { name: row[1] || "", company: row[2] || "", address, city: row[4] || "", state: "", zip: "", phone };
          h.dispatchInfo = { date: row[0], courierName: row[5] || "", trackingNo: row[6] || "", declaredValue: row[8] || "", weight, weightUnit };
          h.items = parseItems(row[7] || "");
        } else if (row.length >= 10) {
          const { address, phone } = extractPhone(row[3]); const { weight, weightUnit } = parseWeight(row[9]);
          h.recipient = { name: row[1] || "", company: row[2] || "", address, city: row[4] || "", state: "", zip: "", phone };
          h.dispatchInfo = { date: row[0], courierName: row[5] || "", trackingNo: row[6] || "", declaredValue: row[8] || "", weight, weightUnit };
          h.items = parseItems(row[7] || "");
        } else {
          const { address, phone } = extractPhone(row[2]);
          h.recipient = { name: row[1] || "", address, city: row[3] || "", phone };
          h.dispatchInfo = { date: row[0], courierName: row[4] || "", trackingNo: row[5] || "", declaredValue: row[7] || "", weight: "", weightUnit: "" };
          h.items = parseItems(row[6] || "");
        }
        return h;
      }).filter(Boolean).reverse();
      setHistory(parsedHistory);
      if (dispView === "history") showNotif("Synced with Google Sheet ✓");
    } catch (error) {
      showNotif("Could not fetch Sheet — check webhook URL");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewDispatch = () => {
    setRecipient({ name: "", company: "", address: "", city: "", state: "", zip: "", phone: "" });
    setDispatchInfo({ date: new Date().toISOString().split("T")[0], courierName: DEFAULT_COURIERS[0], trackingNo: "", declaredValue: 0, weight: "", weightUnit: "kg" });
    setItems([{ id: Date.now(), type: DEFAULT_SAMPLE_TYPES[0], desc: "GSM 450, White", qty: 1 }]);
    setDispView("form");
    showNotif("Ready for new dispatch");
  };

  const handleSave = async (silent = false) => {
    if (!recipient.name) { showNotif("Please fill recipient name."); return false; }
    setIsSaving(true);
    try {
      let fullAddress = recipient.address;
      if (recipient.city && !fullAddress.includes(recipient.city)) fullAddress += `, ${recipient.city}`;
      if (recipient.state && !fullAddress.includes(recipient.state)) fullAddress += `, ${recipient.state}`;
      if (recipient.zip && !fullAddress.includes(recipient.zip)) fullAddress += ` - ${recipient.zip}`;
      const weightString = dispatchInfo.weight ? `${dispatchInfo.weight} ${dispatchInfo.weightUnit}` : "";
      if (sheetWebhookUrl) {
        const sheetPayload = {
          date: new Date(dispatchInfo.date).toLocaleDateString("en-IN"),
          contactName: recipient.name, companyName: recipient.company,
          address: fullAddress, city: recipient.city,
          courier: dispatchInfo.courierName, tracking: dispatchInfo.trackingNo,
          items: items.map(i => `${i.qty}x ${i.type}`).join(", "),
          value: dispatchInfo.declaredValue, weight: weightString, phone: recipient.phone
        };
        fetch(sheetWebhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sheetPayload) }).catch(() => {});
      }
      if (!silent) showNotif("Saved to Google Sheet ✓");
      logActivity("📦", `Dispatch: ${recipient.name}`, dispatchInfo.courierName ? `via ${dispatchInfo.courierName}` : items.map(i=>`${i.qty}× ${i.type}`).join(", "), "dispatch");
      return true;
    } catch (e) { return false; } finally { setIsSaving(false); }
  };

  const handlePrintForm = async () => {
    const success = await handleSave(true);
    if (success || recipient.name) {
      setPrintData({ recipient, dispatchInfo, items, sender: SENDER });
      setPreviewMode("dispatch");
    }
  };

  const handlePrintEnvelope = () => {
    if (!recipient.name) { showNotif("Enter recipient name first"); return; }
    setPrintData({ recipient, dispatchInfo, items, sender: SENDER });
    setPreviewMode("envelope");
  };

  const handleReprint = (h) => {
    setPrintData({ recipient: h.recipient, dispatchInfo: h.dispatchInfo, items: h.items, sender: SENDER });
    setPreviewMode("dispatch");
  };

  const handleCreateShipment = (contact) => {
    let nr = { name: contact.name || "", company: contact.company || "", address: contact.address || "", city: contact.city || "", state: contact.state || "", zip: contact.zip || "", phone: contact.phone || "" };
    if ((!nr.city || !nr.zip) && nr.address && nr.address.includes(",")) {
      let addr = nr.address.replace(/\{P:.*?\}/g, "").trim();
      const parts = addr.split(",").map(p => p.trim());
      const zipMatch = addr.match(/\b\d{6}\b/);
      if (zipMatch) { nr.zip = zipMatch[0]; addr = addr.replace(zipMatch[0], "").trim().replace(/[-,\s]+$/, ""); }
      if (parts.length >= 2) {
        if (!nr.state) nr.state = parts.pop();
        if (!nr.city && parts.length > 0) nr.city = parts.pop();
        addr = parts.join(", ");
      }
      nr.address = addr;
    }
    setRecipient(nr);
    setDispatchInfo({ ...dispatchInfo, date: new Date().toISOString().split("T")[0], trackingNo: "", declaredValue: 0, weight: "", weightUnit: "kg" });
    setItems([{ id: Date.now(), type: DEFAULT_SAMPLE_TYPES[0], desc: "GSM 450, White", qty: 1 }]);
    setDispView("form");
    showNotif(`Loaded: ${contact.name}`);
  };

  const addType = () => {
    if (!newTypeName.trim()) return;
    setAvailableTypes([...availableTypes, newTypeName.trim()]);
    setNewTypeName(""); setIsAddingType(false);
    showNotif("Item type added");
  };

  const addCourier = () => {
    if (!newCourierName.trim()) return;
    setAvailableCouriers([...availableCouriers, newCourierName.trim()]);
    setNewCourierName(""); setIsAddingCourier(false);
    showNotif("Courier added");
  };

  return (
    <>
      {printData && (
        <PrintOverlay
          printData={printData}
          previewMode={previewMode}
          onClose={() => setPrintData(null)}
        />
      )}

      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.40)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ width: 420, padding: 24 }}>
            <div className="flex justify-b items-c mb4">
              <div style={{ fontSize: 18, fontWeight: 600 }}>⚙️ Settings</div>
              <button className="btn btn-out btn-sm" onClick={() => setShowSettings(false)}><X size={14} /></button>
            </div>
            <label className="lbl">Google Sheet Webhook URL</label>
            <input className="inp mb4" value={sheetWebhookUrl} onChange={e => setSheetWebhookUrl(e.target.value)} />
            <label className="lbl">Claude API Key (for AI features)</label>
            <input className="inp mb4" type="password" placeholder="sk-ant-…"
              defaultValue={localStorage.getItem("kht_anthropic_key") || ""}
              onChange={e => localStorage.setItem("kht_anthropic_key", e.target.value)}
            />
            <div className="text-xs text-lt mb3" style={{ marginTop: -12 }}>Used in CRM pitches, Marketing Studio. Get your key at console.anthropic.com</div>
            <div className="flex gap2" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-out" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={() => { setShowSettings(false); showNotif("Settings saved"); }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-nav */}
      <div className="sh">
        <div className="st">📦 Dispatch Manager</div>
        <div className="flex gap2">
          <button className="btn btn-out btn-sm" onClick={() => setShowSettings(true)}><Settings size={14} /> Settings</button>
          <button className={`btn btn-sm ${dispView === "form" ? "btn-gold" : "btn-out"}`} onClick={handleNewDispatch}><Plus size={14} /> New</button>
          <button className={`btn btn-sm ${dispView === "contacts" ? "btn-gold" : "btn-out"}`} onClick={() => setDispView("contacts")}><Users size={14} /> Contacts</button>
          <button className={`btn btn-sm ${dispView === "history" ? "btn-gold" : "btn-out"}`} onClick={() => setDispView("history")}><Database size={14} /> Database</button>
        </div>
      </div>

      {dispView === "form" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Party Details */}
            <div className="card">
              <div className="flex gap2 items-c mb3">
                <div className="num-badge">1</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Party Details</div>
              </div>
              <div className="form-row">
                <div><label className="lbl">Contact Name *</label><input className="inp" placeholder="Full Name" value={recipient.name} onChange={e => setRecipient({ ...recipient, name: e.target.value })} /></div>
                <div><label className="lbl">Company</label><input className="inp" placeholder="Business Name" value={recipient.company} onChange={e => setRecipient({ ...recipient, company: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div><label className="lbl">Phone</label><input className="inp" placeholder="+91 XXXXX XXXXX" value={recipient.phone} onChange={e => setRecipient({ ...recipient, phone: e.target.value })} /></div>
                <div><label className="lbl">Address Line</label><input className="inp" placeholder="Street / Area" value={recipient.address} onChange={e => setRecipient({ ...recipient, address: e.target.value })} /></div>
              </div>
              <div className="form-row-3">
                <div><label className="lbl">City</label><input className="inp" placeholder="City" value={recipient.city} onChange={e => setRecipient({ ...recipient, city: e.target.value })} /></div>
                <div><label className="lbl">State</label><input className="inp" placeholder="State" value={recipient.state} onChange={e => setRecipient({ ...recipient, state: e.target.value })} /></div>
                <div><label className="lbl">PIN</label><input className="inp" placeholder="6-digit PIN" value={recipient.zip} onChange={e => setRecipient({ ...recipient, zip: e.target.value })} /></div>
              </div>
            </div>

            {/* Sample Items */}
            <div className="card">
              <div className="flex justify-b items-c mb3">
                <div className="flex gap2 items-c">
                  <div className="num-badge">2</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Sample Items</div>
                </div>
                <div className="flex gap2">
                  <button className="btn btn-out btn-sm" onClick={() => setIsAddingType(!isAddingType)}><Settings size={12} /> Manage</button>
                  <button className="btn btn-gold btn-sm" onClick={() => setItems([...items, { id: Date.now(), type: availableTypes[0], desc: "", qty: 1 }])}><Plus size={13} /> Add</button>
                </div>
              </div>
              {isAddingType && (
                <div className="flex gap2 mb3" style={{ background: "#F7EDD022", padding: "8px 10px", borderRadius: 7, border: "1px solid #C9A84C33" }}>
                  <input className="inp" placeholder="New item type name…" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn btn-gold btn-sm" onClick={addType}>Add</button>
                  <button className="btn btn-out btn-sm" onClick={() => setIsAddingType(false)}><X size={13} /></button>
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="flex gap2 items-c mb2" style={{ background: "#FAFBFC", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "5fr 5fr 2fr", gap: 8, flex: 1 }}>
                    <select className="sel" value={item.type} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, type: e.target.value } : i))}>
                      {availableTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input className="inp" placeholder="Description (GSM, Color…)" value={item.desc} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, desc: e.target.value } : i))} />
                    <input className="inp" type="number" placeholder="Qty" value={item.qty} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, qty: e.target.value } : i))} />
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => setItems(items.filter(i => i.id !== item.id))}><Trash2 size={13} /></button>
                </div>
              ))}
              <div className="divider" />
              <label className="lbl">Total Weight</label>
              <div className="flex gap2" style={{ maxWidth: 220 }}>
                <input className="inp" type="number" placeholder="0" value={dispatchInfo.weight} onChange={e => setDispatchInfo({ ...dispatchInfo, weight: e.target.value })} />
                <select className="sel" style={{ width: 90 }} value={dispatchInfo.weightUnit} onChange={e => setDispatchInfo({ ...dispatchInfo, weightUnit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="grams">grams</option>
                </select>
              </div>
            </div>

            {/* Dispatch Info */}
            <div className="card">
              <div className="flex gap2 items-c mb3">
                <div className="num-badge">3</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Dispatch Info</div>
              </div>
              <div className="form-row">
                <div><label className="lbl">Dispatch Date</label><input className="inp" type="date" value={dispatchInfo.date} onChange={e => setDispatchInfo({ ...dispatchInfo, date: e.target.value })} /></div>
                <div><label className="lbl">Declared Value (₹)</label><input className="inp" type="number" value={dispatchInfo.declaredValue} onChange={e => setDispatchInfo({ ...dispatchInfo, declaredValue: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div>
                  <label className="lbl">Courier Service</label>
                  <div className="flex gap2">
                    <select className="sel" value={dispatchInfo.courierName} onChange={e => setDispatchInfo({ ...dispatchInfo, courierName: e.target.value })}>
                      {availableCouriers.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button className="btn btn-out btn-sm" onClick={() => setIsAddingCourier(!isAddingCourier)}><Plus size={13} /></button>
                  </div>
                  {isAddingCourier && (
                    <div className="flex gap2 mt2">
                      <input className="inp" placeholder="New courier…" value={newCourierName} onChange={e => setNewCourierName(e.target.value)} />
                      <button className="btn btn-gold btn-sm" onClick={addCourier}>Add</button>
                    </div>
                  )}
                </div>
                <div><label className="lbl">Tracking / AWB No.</label><input className="inp" placeholder="Tracking number" value={dispatchInfo.trackingNo} onChange={e => setDispatchInfo({ ...dispatchInfo, trackingNo: e.target.value })} /></div>
              </div>
            </div>
          </div>

          {/* RIGHT - Actions */}
          <div>
            <div className="card sticky-top" style={{ top: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={async () => { await handlePrintForm(); }}
                  className="action-btn"
                  style={{ background: "var(--blue)", color: "#fff" }}
                >
                  <Printer size={18} /> Print Label & Save
                </button>
                <button
                  onClick={handlePrintEnvelope}
                  className="action-btn"
                  style={{ background: "var(--fill)", color: "var(--label)" }}
                >
                  <Mail size={18} /> Print Envelope
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="action-btn"
                  style={{ background: "var(--fill)", color: "var(--label2)" }}
                >
                  <Save size={18} /> {isSaving ? "Saving…" : "Save Draft"}
                </button>
              </div>

              {recipient.name && (
                <div className="mt4 divider" />
              )}
              {recipient.name && (
                <div style={{ background: "var(--gold-pp)", borderRadius: 8, padding: "12px 14px", marginTop: 4 }}>
                  <div className="text-xs text-lt mb2">SHIPPING TO</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{recipient.name}</div>
                  {recipient.company && <div className="text-sm text-lt">{recipient.company}</div>}
                  <div className="text-sm text-lt">{recipient.city}{recipient.state ? `, ${recipient.state}` : ""}</div>
                  {recipient.phone && <div className="text-sm" style={{ marginTop: 4 }}>📞 {recipient.phone}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {dispView === "history" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#FAFBFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="flex gap3 items-c">
              <div style={{ fontSize: 17, fontWeight: 600 }}>Dispatch Log</div>
              <span className="tag tag-gray">Google Sheet</span>
              <button className="btn btn-out btn-sm" onClick={fetchSheetHistory}>
                <RefreshCw size={13} style={{ animation: isLoadingHistory ? "spin 1s linear infinite" : "none" }} /> Sync
              </button>
            </div>
            <button className="btn btn-success btn-sm"><FileSpreadsheet size={14} /> Export CSV</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Party</th><th>Company</th><th>Location</th><th>Courier</th><th>Tracking</th><th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-light)" }}>
                    {isLoadingHistory ? "Loading from Google Sheet…" : "No records. Click Sync to load from your Google Sheet."}
                  </td></tr>
                ) : history.map(h => (
                  <tr key={h.id}>
                    <td>{formatDateIndian(h.dispatchInfo.date)}</td>
                    <td><div className="fw6">{h.recipient.name}</div></td>
                    <td className="text-lt">{h.recipient.company}</td>
                    <td>{h.recipient.city}</td>
                    <td>{h.dispatchInfo.courierName}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{h.dispatchInfo.trackingNo}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-out btn-sm" onClick={() => handleReprint(h)}><Printer size={13} /> Reprint</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dispView === "contacts" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#FAFBFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="flex gap3 items-c">
              <div style={{ fontSize: 17, fontWeight: 600 }}>All Contacts</div>
              <button className="btn btn-out btn-sm" onClick={fetchSheetHistory}>
                <RefreshCw size={13} style={{ animation: isLoadingHistory ? "spin 1s linear infinite" : "none" }} /> Refresh
              </button>
            </div>
            <span className="text-xs text-lt">{contacts.length} contacts found</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Address</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-light)" }}>
                    {isLoadingHistory ? "Loading…" : "No contacts yet. Sync the database first."}
                  </td></tr>
                ) : contacts.map((c, i) => (
                  <tr key={i}>
                    <td className="fw6">{c.name}</td>
                    <td className="text-lt">{c.company || "—"}</td>
                    <td>{c.phone || "—"}</td>
                    <td className="text-lt" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-gold btn-sm" onClick={() => handleCreateShipment(c)}><Send size={13} /> Ship</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OTHER MODULES
═══════════════════════════════════════════════════════════════ */
function StatusTag({ s }) {
  const m = { Hot: "tag-red", Warm: "tag-gold", New: "tag-blue", Cold: "tag-gray" };
  return <span className={`tag ${m[s] || "tag-gray"}`}>{s}</span>;
}

function HomeModule({ setActive }) {
  const [activity, setActivity] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Reload activity every 5 s so new events surface immediately
  useEffect(() => {
    const load = () => setActivity(getActivity());
    load();
    const t = setInterval(() => { load(); setNow(Date.now()); }, 5000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { label: "Orders (Month)", value: "247", sub: "+12% vs last month", c: "gold",  target: "dispatch" },
    { label: "Active Customers", value: "84",  sub: "5 new this week",    c: "blue",  target: "crm" },
    { label: "Products Listed", value: "32",  sub: "8 categories",        c: "green", target: "products" },
    { label: "Pending Dispatch", value: "18",  sub: "Due today: 7",       c: "red",   target: "dispatch" },
  ];

  const quickActions = [
    { icon: "🏷️", label: "New Dispatch", target: "dispatch",  color: "var(--blue)" },
    { icon: "🖼️", label: "Quotation",    target: "designer",  color: "var(--purple)" },
    { icon: "👥", label: "CRM",          target: "crm",       color: "var(--green)" },
    { icon: "📦", label: "Products",     target: "products",  color: "var(--orange)" },
    { icon: "📣", label: "Marketing",    target: "marketing", color: "var(--teal)" },
    { icon: "📂", label: "Documents",    target: "documents", color: "rgba(255,255,255,.4)" },
  ];

  // Module pill colours
  const modMeta = {
    dispatch: { label: "Dispatch", color: "var(--blue)" },
    products: { label: "Products", color: "var(--orange)" },
    designer: { label: "Quotation", color: "var(--purple)" },
    crm:      { label: "CRM", color: "var(--green)" },
    marketing:{ label: "Marketing", color: "var(--teal)" },
  };

  // Greeting
  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  // Seed demo data on very first load
  useEffect(() => {
    const stored = getActivity();
    if (stored.length === 0) {
      const seeds = [
        { icon:"📦", title:"Dispatched to Rajesh Mehta",      sub:"Bath Towel 450GSM × 50 · DTDC",                module:"dispatch", time: Date.now()-3*60000 },
        { icon:"🧾", title:"Quotation printed for Sunita Kapoor", sub:"3 products · Ref: KHT-2024-091",            module:"designer", time: Date.now()-18*60000 },
        { icon:"📦", title:"Dispatched to Amit Sharma",        sub:"Hand Towel Set × 100 · Blue Dart",             module:"dispatch", time: Date.now()-2*3600000 },
        { icon:"🖼️", title:"Photo uploaded: bathtowel_white.jpg", sub:"Category: Bath Towels",                     module:"products", time: Date.now()-5*3600000 },
        { icon:"🧾", title:"Quotation printed for Vikram Joshi",  sub:"2 products · Ref: KHT-2024-090",            module:"designer", time: Date.now()-8*3600000 },
        { icon:"📦", title:"Dispatched to Priya Desai",        sub:"Bath Mat × 30 · Professional Couriers",        module:"dispatch", time: Date.now()-24*3600000 },
      ];
      try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(seeds)); setActivity(seeds); } catch {}
    }
  }, []);

  return (
    <div>
      {/* ── Header ── */}
      <div className="sh" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--label)", letterSpacing: "-.04em" }}>
            {greeting} 👋
          </div>
          <div style={{ fontSize: 13, color: "var(--label3)", marginTop: 3 }}>
            Kshirsagar Hometextiles · Here's what's happening
          </div>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setActive("dispatch")}>
          + New Dispatch
        </button>
      </div>

      {/* ── Stat row ── */}
      <div className="g4 mb4">
        {stats.map(s => (
          <div key={s.label} className={`stat ${s.c}`} onClick={() => setActive(s.target)}>
            <div className="stat-n">{s.value}</div>
            <div className="stat-l">{s.label}</div>
            <div className="stat-s">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2-col: activity + quick actions ── */}
      <div className="g2" style={{ alignItems: "start" }}>

        {/* Live Activity Feed */}
        <div className="card" style={{ padding: "16px 0" }}>
          <div style={{ padding: "0 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Live Activity</div>
              <div className="card-sub" style={{ marginBottom: 0 }}>Everything happening across all modules</div>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "var(--green)",
              animation: "livepulse 2s infinite"
            }} />
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: "var(--glass-sep)", margin: "0 0 4px" }} />

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {activity.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--label3)", fontSize: 13 }}>
                No activity yet. Start dispatching, uploading products, or printing quotations — everything will appear here.
              </div>
            ) : activity.map((ev, i) => {
              const meta = modMeta[ev.module] || { label: ev.module, color: "var(--label3)" };
              return (
                <div
                  key={ev.id || i}
                  onClick={() => ev.module && setActive(ev.module)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "11px 18px",
                    borderBottom: i < activity.length - 1 ? "0.5px solid rgba(0,0,0,.06)" : "none",
                    cursor: ev.module ? "pointer" : "default",
                    transition: "background .12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,122,255,.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Icon bubble */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(0,0,0,.05)",
                    border: "0.5px solid rgba(0,0,0,.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16
                  }}>{ev.icon}</div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--label)", lineHeight: 1.3, marginBottom: 2 }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--label3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.sub}
                    </div>
                  </div>

                  {/* Right: module pill + time */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {ev.module && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                        background: meta.color + "22",
                        color: meta.color,
                        border: `1px solid ${meta.color}33`,
                      }}>{meta.label}</span>
                    )}
                    <span style={{ fontSize: 10.5, color: "var(--label4)" }}>
                      {timeAgo(ev.time || ev.ts)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Quick Access</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
              {quickActions.map(({ icon, label, target, color }) => (
                <div
                  key={label}
                  onClick={() => setActive(target)}
                  style={{
                    background: "rgba(0,0,0,.04)",
                    border: "0.5px solid rgba(0,0,0,.07)",
                    borderRadius: 12, padding: "14px 10px",
                    cursor: "pointer", textAlign: "center",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,122,255,.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.04)"; e.currentTarget.style.transform = ""; }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--label2)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's summary pill */}
          <div className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--label3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              Today's Summary
            </div>
            {[
              { label: "Events logged", value: activity.filter(e => Date.now() - (e.time||e.ts) < 86400000).length, color: "var(--blue)" },
              { label: "Dispatches",    value: activity.filter(e => e.module === "dispatch" && Date.now() - (e.time||e.ts) < 86400000).length, color: "var(--green)" },
              { label: "Quotations",    value: activity.filter(e => e.module === "designer" && Date.now() - (e.time||e.ts) < 86400000).length, color: "var(--purple)" },
              { label: "Uploads",       value: activity.filter(e => e.module === "products" && Date.now() - (e.time||e.ts) < 86400000).length, color: "var(--orange)" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,.06)" }}>
                <span style={{ fontSize: 12.5, color: "var(--label2)" }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



function ProductsModule() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [multiSel, setMultiSel] = useState([]); // multi-select IDs
  const [multiMode, setMultiMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCat, setUploadCat] = useState("");
  const [driveUrl, setDriveUrl] = useState(() => localStorage.getItem("kht_products_drive") || DEFAULT_PRODUCTS_DRIVE_URL);
  const [showSetup, setShowSetup] = useState(false);
  const [tempUrl, setTempUrl] = useState(driveUrl);
  const [shareToast, setShareToast] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [waSharing, setWaSharing] = useState(false);
  const fileRef = useRef();

  const fetchImages = async () => {
    if (!driveUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${driveUrl}?action=list&t=${Date.now()}`);
      const data = await res.json();
      if (data.ok) setImages(data.images || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchImages(); }, [driveUrl]);
  useEffect(() => {
    if (!driveUrl) return;
    const t = setInterval(fetchImages, 30000);
    return () => clearInterval(t);
  }, [driveUrl]);

  const cats = Array.from(new Set(images.map(i => i.cat))).sort();
  const filtered = images.filter(img =>
    (filter === "All" || img.cat === filter) &&
    img.name.toLowerCase().includes(search.toLowerCase())
  );

  const catCounts = images.reduce((acc, img) => {
    acc[img.cat] = (acc[img.cat] || 0) + 1;
    return acc;
  }, {});

  // Folder emoji map
  const folderEmoji = (cat) => {
    const map = {
      "Bath Towels": "🛁", "Hand Towels": "🤲", "Face Towels": "💆",
      "Bath Mats": "🟫", "Sports Towels": "💪", "Kitchen Towels": "🍽️",
      "Pool Towels": "🏊", "Bath Robes": "🥋", "Fabric Swatches": "🧵",
      "Uncategorised": "📄"
    };
    return map[cat] || "📁";
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !driveUrl) return;
    const cat = uploadCat || (filter !== "All" ? filter : "Uncategorised");
    setUploading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch(driveUrl, {
        method: "POST",
        body: JSON.stringify({ base64, mimeType: file.type, filename: file.name, category: cat })
      });
      const data = await resp.json();
      if (data.ok) { setImages(prev => [data, ...prev]); setSelected(data);
        logActivity("🖼️", `Photo uploaded: ${file.name}`, `Category: ${cat||"Uncategorised"}`, "products"); }
    } catch { alert("Upload failed. Check your script URL."); }
    setUploading(false);
    e.target.value = "";
  };

  const createCategory = async () => {
    if (!newCatName.trim() || !driveUrl) return;
    setCreatingCat(true);
    try {
      // Upload a tiny placeholder to create the folder, then delete it client-side
      const placeholder = btoa("KHT");
      const resp = await fetch(driveUrl, {
        method: "POST",
        body: JSON.stringify({ base64: placeholder, mimeType: "image/png", filename: ".keep", category: newCatName.trim() })
      });
      const data = await resp.json();
      if (data.ok) {
        setShowAddCat(false);
        setNewCatName("");
        setFilter(newCatName.trim());
        await fetchImages();
        setShareToast(`📁 "${newCatName.trim()}" folder created!`);
        setTimeout(() => setShareToast(null), 2500);
      }
    } catch { alert("Could not create folder."); }
    setCreatingCat(false);
  };

  // Single image: share actual photo via Web Share API, fallback to link
  const sharePhotoDirectly = async (img) => {
    if (navigator.canShare) {
      try {
        setWaSharing(true);
        setShareToast("Fetching image…");
        const resp = await fetch(`https://drive.google.com/uc?export=download&id=${img.id}`);
        const blob = await resp.blob();
        const file = new File([blob], img.filename || `${img.name}.jpg`, { type: blob.type || "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          setShareToast(null);
          await navigator.share({ files: [file], title: img.name, text: "From Kshirsagar Hometextiles" });
          setWaSharing(false);
          return;
        }
      } catch (e) { /* fall through to link */ }
      setWaSharing(false);
    }
    // Fallback: open WhatsApp with link
    window.open(`https://wa.me/?text=${encodeURIComponent(img.name + "\n" + img.shareUrl)}`, "_blank");
  };

  // Multiple images: send all links in one WhatsApp message
  const shareMultipleViaWA = (imgs) => {
    const text = `*Kshirsagar Hometextiles — Product Images*\n\n` +
      imgs.map((img, i) => `${i + 1}. *${img.name}*\n${img.shareUrl}`).join("\n\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOptions = (img) => [
    { label: "📋 Copy Link", action: () => { navigator.clipboard.writeText(img.shareUrl); setShareToast("Link copied!"); setTimeout(() => setShareToast(null), 2500); } },
    { label: waSharing ? "⏳ Preparing…" : "💬 WhatsApp (Photo)", action: () => !waSharing && sharePhotoDirectly(img) },
    { label: "✉️ Email", action: () => window.open(`mailto:?subject=${encodeURIComponent(img.name)}&body=${encodeURIComponent("Product image:\n" + img.shareUrl)}`, "_blank") },
    { label: "⬇️ Download", action: () => window.open(`https://drive.google.com/uc?export=download&id=${img.id}`, "_blank") },
    { label: "🔗 Open in Drive", action: () => window.open(img.shareUrl, "_blank") },
  ];

  // Toggle image in multi-select
  const toggleMultiSel = (img) => {
    setMultiSel(prev => prev.find(i => i.id === img.id)
      ? prev.filter(i => i.id !== img.id)
      : [...prev, img]
    );
  };

  const saveUrl = () => {
    localStorage.setItem("kht_products_drive", tempUrl);
    setDriveUrl(tempUrl);
    setShowSetup(false);
  };

  return (
    <div>
      {shareToast && <div className="notif">{shareToast}</div>}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />

      {/* HEADER */}
      <div className="sh">
        <div>
          <div className="st">📦 Products Database</div>
          <div className="text-sm text-lt" style={{ marginTop: 2 }}>
            {driveUrl ? `${images.length} photos · ${cats.length} categories · synced from Google Drive` : "Connect Google Drive to get started"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {driveUrl && <>
            <button className="btn btn-out btn-sm" onClick={fetchImages} disabled={loading}>
              <RefreshCw size={13} className={loading ? "spin" : ""} /> {loading ? "Syncing…" : "Sync"}
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => {
              setUploadCat(filter !== "All" ? filter : "Uncategorised");
              fileRef.current?.click();
            }} disabled={uploading}>
              {uploading ? "Uploading…" : "📸 Upload Photo"}
            </button>
          </>}
          <button className="btn btn-out btn-sm" onClick={() => { setTempUrl(driveUrl); setShowSetup(true); }}>
            <Settings size={13} /> {driveUrl ? "Settings" : "⚠️ Connect Drive"}
          </button>
        </div>
      </div>

      {/* NOT CONNECTED */}
      {!driveUrl && (
        <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Connect Google Drive</div>
          <div className="text-sm text-lt" style={{ maxWidth: 420, margin: "0 auto 20px" }}>
            Deploy the Products Drive Apps Script, paste the URL here. Drive folders become product categories automatically.
          </div>
          <button className="btn btn-gold" onClick={() => setShowSetup(true)}>Connect Now →</button>
        </div>
      )}

      {driveUrl && (
        <>
          {/* ── FOLDER TILES ROW ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: ".12em" }}>Categories</div>
              <button className="btn btn-out btn-sm" onClick={() => setShowAddCat(true)} style={{ fontSize: 11 }}>
                <Plus size={12} /> New Category
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* ALL tile */}
              <div
                onClick={() => setFilter("All")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  width: 90, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                  border: filter === "All" ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                  background: filter === "All" ? "var(--gold-p)" : "var(--white)",
                  transition: "all .15s", boxShadow: filter === "All" ? "0 2px 8px rgba(196,145,58,.2)" : "var(--shadow-sm)"
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1 }}>🗂️</div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 5, color: filter === "All" ? "var(--gold)" : "var(--text-dark)", textAlign: "center" }}>All</div>
                <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 2 }}>{images.length} photos</div>
              </div>

              {/* Category tiles */}
              {cats.map(cat => (
                <div
                  key={cat}
                  onClick={() => { setFilter(cat); setUploadCat(cat); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    width: 90, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                    border: filter === cat ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                    background: filter === cat ? "var(--gold-p)" : "var(--white)",
                    transition: "all .15s", boxShadow: filter === cat ? "0 2px 8px rgba(196,145,58,.2)" : "var(--shadow-sm)"
                  }}
                >
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{folderEmoji(cat)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 5, color: filter === cat ? "var(--gold)" : "var(--text-dark)", textAlign: "center", lineHeight: 1.3, wordBreak: "break-word" }}>{cat}</div>
                  <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 2 }}>{catCounts[cat] || 0} photos</div>
                </div>
              ))}

              {/* Add new folder tile */}
              <div
                onClick={() => setShowAddCat(true)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  width: 90, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                  border: "1.5px dashed var(--border)",
                  background: "transparent", transition: "all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.background = "var(--gold-pp)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ fontSize: 28, lineHeight: 1, opacity: .5 }}>📁</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 5, color: "var(--text-light)", textAlign: "center" }}>+ Add Folder</div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div style={{ marginBottom: 16 }}>
            <input className="inp" style={{ maxWidth: 280 }} placeholder={`🔍 Search ${filter === "All" ? "all products" : filter}…`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* IMAGES + SIDEBAR */}
          <div className="flex gap4" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              {loading && images.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div className="dots" style={{ justifyContent: "center", marginBottom: 12 }}><span /><span /><span /></div>
                  <div className="text-sm text-lt">Loading from Google Drive…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                  <div className="text-sm text-lt">No images in {filter === "All" ? "any folder" : `"${filter}"`} yet.</div>
                  <button className="btn btn-gold btn-sm" style={{ marginTop: 12 }} onClick={() => fileRef.current?.click()}>📸 Upload First Photo</button>
                </div>
              ) : (
                <>
                  {/* MULTI-SELECT TOOLBAR */}
                  {multiMode && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, background: "var(--navy)", borderRadius: 10, padding: "10px 16px" }}>
                      <span style={{ color: "white", fontSize: 13, fontWeight: 600, flex: 1 }}>
                        {multiSel.length} photo{multiSel.length !== 1 ? "s" : ""} selected
                      </span>
                      {multiSel.length > 0 && (
                        <>
                          <button className="btn btn-gold btn-sm" onClick={() => shareMultipleViaWA(multiSel)}>
                            💬 WhatsApp ({multiSel.length})
                          </button>
                          <button className="btn btn-out btn-sm" style={{ color: "white", borderColor: "rgba(255,255,255,.3)" }}
                            onClick={() => {
                              const text = multiSel.map(i => i.shareUrl).join("\n");
                              navigator.clipboard.writeText(text);
                              setShareToast(`${multiSel.length} links copied!`);
                              setTimeout(() => setShareToast(null), 2500);
                            }}>
                            📋 Copy All Links
                          </button>
                        </>
                      )}
                      <button className="btn btn-out btn-sm" style={{ color: "rgba(255,255,255,.6)", borderColor: "rgba(255,255,255,.2)" }}
                        onClick={() => { setMultiMode(false); setMultiSel([]); }}>
                        ✕ Cancel
                      </button>
                    </div>
                  )}
                  <div className="prod-grid">
                    {filtered.map(img => {
                      const isMultiSelected = multiSel.find(i => i.id === img.id);
                      const isSingleSelected = !multiMode && selected?.id === img.id;
                      return (
                        <div key={img.id} className="prod-card"
                          onClick={() => {
                            if (multiMode) { toggleMultiSel(img); }
                            else { setSelected(img); }
                          }}
                          onContextMenu={e => { e.preventDefault(); setMultiMode(true); toggleMultiSel(img); setSelected(null); }}
                          style={{
                            border: isMultiSelected ? "2.5px solid var(--gold)" : isSingleSelected ? "2px solid var(--gold)" : undefined,
                            position: "relative",
                            outline: isMultiSelected ? "3px solid rgba(196,145,58,.25)" : "none",
                            transition: "all .15s"
                          }}>
                          {/* Multi-select checkbox */}
                          {multiMode && (
                            <div style={{
                              position: "absolute", top: 7, right: 7, zIndex: 2,
                              width: 20, height: 20, borderRadius: "50%",
                              background: isMultiSelected ? "var(--gold)" : "rgba(255,255,255,.9)",
                              border: isMultiSelected ? "2px solid var(--gold)" : "2px solid #ccc",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 900, color: "var(--navy)",
                              boxShadow: "0 1px 4px rgba(0,0,0,.2)"
                            }}>
                              {isMultiSelected ? "✓" : ""}
                            </div>
                          )}
                          <div className="prod-img" style={{ background: "#f0ebe2", position: "relative", overflow: "hidden" }}>
                            {imageErrors[img.id] ? <div style={{ fontSize: 32 }}>🖼️</div> : (
                              <img src={img.thumb || img.url} alt={img.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                                onError={() => setImageErrors(prev => ({ ...prev, [img.id]: true }))} />
                            )}
                          </div>
                          <div className="prod-info">
                            <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</div>
                            <div className="text-xs text-lt">{img.cat}</div>
                            <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 2 }}>{img.date}</div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Upload tile */}
                    <div className="upload-z prod-card"
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 175, cursor: uploading ? "not-allowed" : "pointer" }}
                      onClick={() => !uploading && fileRef.current?.click()}>
                      <div style={{ fontSize: 30 }}>{uploading ? "⏳" : "📸"}</div>
                      <div className="text-xs text-lt mt2">{uploading ? "Uploading…" : "Upload Photo"}</div>
                      {!uploading && <div style={{ fontSize: 9, color: "var(--text-light)", marginTop: 4 }}>→ {filter !== "All" ? filter : "Uncategorised"}</div>}
                    </div>
                  </div>
                  {/* Multi-select hint */}
                  {!multiMode && filtered.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 10, fontSize: 10.5, color: "var(--text-light)" }}>
                      💡 Long-press or <button onClick={() => setMultiMode(true)} style={{ background: "none", border: "none", color: "var(--gold)", fontWeight: 700, cursor: "pointer", fontSize: 10.5, padding: 0 }}>click here</button> to select multiple photos for bulk sharing
                    </div>
                  )}
                </>
              )}
            </div>

            {/* DETAIL SIDEBAR */}
            {selected && (
              <div className="card" style={{ width: 280, flexShrink: 0, position: "sticky", top: 0 }}>
                <div style={{ width: "100%", height: 180, borderRadius: 8, overflow: "hidden", marginBottom: 14, background: "#f0ebe2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {imageErrors[selected.id] ? <div style={{ fontSize: 48 }}>🖼️</div> : (
                    <img src={selected.url} alt={selected.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={() => setImageErrors(prev => ({ ...prev, [selected.id]: true }))} />
                  )}
                </div>
                <div className="card-title" style={{ marginBottom: 4 }}>{selected.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>{folderEmoji(selected.cat)}</span>
                  <span className="tag tag-gold">{selected.cat}</span>
                </div>
                <div className="divider" />
                {[["Date Added", selected.date || "—"], ["Folder", selected.cat], ["File", selected.filename || "—"]].map(([l, v]) => (
                  <div key={l} className="flex justify-b mb2">
                    <span className="text-xs text-lt" style={{ textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</span>
                    <span className="text-sm fw6" style={{ textAlign: "right", maxWidth: "60%" }}>{v}</span>
                  </div>
                ))}
                <div className="divider" />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Share This Image</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {shareOptions(selected).map(opt => (
                    <button key={opt.label} className="btn btn-out btn-full btn-sm" style={{ justifyContent: "flex-start", fontSize: 12 }} onClick={opt.action}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="divider" />
                <button className="btn btn-out btn-full btn-sm" onClick={() => setSelected(null)} style={{ color: "var(--text-light)" }}>✕ Close</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.40)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ width: 380, boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>📁 New Category Folder</div>
              <button className="btn btn-out btn-sm" onClick={() => { setShowAddCat(false); setNewCatName(""); }}><X size={14} /></button>
            </div>
            <div className="text-sm text-lt" style={{ marginBottom: 14 }}>
              This will create a new folder in your <strong>KHT Products Database</strong> on Google Drive.
            </div>
            <label className="lbl">Category Name</label>
            <input
              className="inp" style={{ marginBottom: 16 }}
              placeholder="e.g. Premium Towels, Export Range…"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createCategory()}
              autoFocus
            />
            <div className="flex gap3">
              <button className="btn btn-gold btn-full" onClick={createCategory} disabled={!newCatName.trim() || creatingCat}>
                {creatingCat ? "Creating…" : "✓ Create Folder"}
              </button>
              <button className="btn btn-out" onClick={() => { setShowAddCat(false); setNewCatName(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DRIVE SETTINGS MODAL */}
      {showSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.40)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ width: 520, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>🔗 Drive Settings</div>
              <button className="btn btn-out btn-sm" onClick={() => setShowSetup(false)}><X size={14} /></button>
            </div>
            <label className="lbl">Google Apps Script Deployment URL</label>
            <input className="inp" style={{ marginBottom: 14 }}
              placeholder="https://script.google.com/macros/s/…/exec"
              value={tempUrl} onChange={e => setTempUrl(e.target.value)} />
            <div className="flex gap3">
              <button className="btn btn-gold btn-full" onClick={saveUrl} disabled={!tempUrl}>Save & Connect</button>
              <button className="btn btn-out" onClick={() => setShowSetup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function CRMModule() {
  const [sel, setSel] = useState(CUSTOMERS[0]);
  const [pitchType, setPitchType] = useState("email");
  const [product, setProduct] = useState("Bath Towels 450 GSM");
  const [aiMsg, setAiMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("pitch");

  const generate = async () => {
    if (!getAnthropicKey()) { setAiMsg("⚠️ No API key set. Go to Settings → Claude API Key."); return; }
    setLoading(true); setAiMsg("");
    const prompt = pitchType === "email"
      ? `Write a professional B2B sales email from Kshirsagar Hometextiles (premium textile manufacturer, Solapur, Maharashtra) to ${sel.name} at ${sel.biz}. Product: ${product}. Be warm, professional, mention quality, MOQ and invite them to request a sample. 4 paragraphs. Include subject line at the top.`
      : `Write a short friendly WhatsApp message from Kshirsagar Hometextiles to ${sel.name} (${sel.biz}) pitching ${product}. Conversational, key benefits, special offer, CTA. 150 words max. Use emojis naturally.`;
    try {
      const res = await anthropicFetch(prompt);
      const data = await res.json();
      const _txt = data.content?.[0]?.text || "Could not generate.";
      setAiMsg(_txt);
      logActivity("🤖", `AI Pitch: ${sel?.name||'Customer'}`, pitchType === 'email' ? 'Email pitch' : 'WhatsApp pitch', "crm");
    } catch { setAiMsg("Connection error. Please retry."); }
    setLoading(false);
  };

  return (
    <div>
      <div className="sh"><div className="st">👥 CRM & Sales</div><button className="btn btn-gold btn-sm">+ Add Customer</button></div>
      <div className="flex gap4" style={{ alignItems: "flex-start" }}>
        <div className="card" style={{ width: 252, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Customers ({CUSTOMERS.length})</div>
          <input className="inp mb3" placeholder="🔍 Search…" />
          {CUSTOMERS.map(c => (
            <div key={c.id} className={`cust-row${sel?.id === c.id ? " sel" : ""}`} onClick={() => setSel(c)}>
              <div className="avatar">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</div>
                <div className="text-xs text-lt" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.biz}</div>
              </div>
              <StatusTag s={c.status} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {sel && <>
            <div className="card mb4">
              <div className="flex gap3 items-c mb3">
                <div className="avatar" style={{ width: 46, height: 46, fontSize: 16 }}>{sel.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{sel.name}</div>
                  <div className="text-xs text-lt">{sel.biz} · {sel.city}</div>
                </div>
                <StatusTag s={sel.status} />
                <a className="wa-btn" href={`https://wa.me/91${sel.phone}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
              </div>
              <div className="g3">
                {[["📞", sel.phone], ["📧", sel.email], ["🕐", sel.lastContact]].map(([icon, val]) => (
                  <div key={val} style={{ background: "#F9FAFB", borderRadius: 7, padding: "9px 11px" }}>
                    <div className="text-xs text-lt">{icon}</div>
                    <div className="text-sm fw6" style={{ marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="flex gap2 mb4">
                {[["pitch", "🤖 AI Pitch"], ["history", "📋 History"], ["quotation", "📄 Quotation"]].map(([t, l]) => (
                  <button key={t} className={`btn btn-sm ${tab === t ? "btn-gold" : "btn-out"}`} onClick={() => setTab(t)}>{l}</button>
                ))}
              </div>
              {tab === "pitch" && (
                <div>
                  <div className="form-row mb3">
                    <div><label className="lbl">Type</label><select className="sel" value={pitchType} onChange={e => setPitchType(e.target.value)}><option value="email">📧 Email</option><option value="whatsapp">💬 WhatsApp</option></select></div>
                    <div><label className="lbl">Product</label><select className="sel" value={product} onChange={e => setProduct(e.target.value)}>{PRODUCTS_DATA.map(p => <option key={p.id}>{p.name} ({p.gsm} GSM)</option>)}</select></div>
                  </div>
                  <button className="btn btn-gold btn-full mb4" onClick={generate} disabled={loading}>✨ {loading ? "Generating…" : "Generate AI Pitch"}</button>
                  {loading && <div className="flex items-c gap2 mb3 text-lt text-sm"><div className="dots"><span /><span /><span /></div>Crafting pitch for {sel.name}…</div>}
                  {aiMsg && (
                    <div>
                      <div className="ai-box">{aiMsg}</div>
                      <div className="flex gap2 mt3">
                        {pitchType === "whatsapp"
                          ? <button className="wa-btn" onClick={() => window.open(`https://wa.me/91${sel.phone}?text=${encodeURIComponent(aiMsg)}`, "_blank")}>💬 Send WhatsApp</button>
                          : <button className="btn btn-gold" onClick={() => window.open(`mailto:${sel.email}?body=${encodeURIComponent(aiMsg)}`)}>📧 Open Email</button>}
                        <button className="btn btn-out" onClick={() => navigator.clipboard.writeText(aiMsg)}>📋 Copy</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {tab !== "pitch" && <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-light)" }}><div style={{ fontSize: 36 }}>📋</div><div className="text-sm mt3">No {tab} records yet.</div></div>}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function MarketingModule() {
  const [platform, setPlatform] = useState("email");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState("");
  const [audience, setAudience] = useState("All Customers");
  const [offer, setOffer] = useState("");
  const platforms = [{ id: "email", icon: "📧", name: "Email Newsletter" }, { id: "whatsapp", icon: "💚", name: "WhatsApp Status" }, { id: "instagram", icon: "📸", name: "Instagram Post" }];

  const generate = async () => {
    if (!getAnthropicKey()) { setContent("⚠️ No API key set. Go to Settings → Claude API Key."); return; }
    setLoading(true); setContent("");
    const campaignStr = campaign || "Premium Towel Collection";
    const offerStr = offer ? `Special offer: ${offer}.` : "";
    const audienceStr = audience;
    const prompts = {
      email: `Write a professional B2B email newsletter for Kshirsagar Hometextiles (terrytowel.in), a premium terry towel manufacturer from Solapur, Maharashtra.
Campaign: "${campaignStr}". Target audience: ${audienceStr}. ${offerStr}
Format: Subject line, warm greeting, 3-4 bullet points on product benefits, clear CTA to request samples. Professional yet friendly tone.`,
      whatsapp: `Write 3 WhatsApp broadcast messages for Kshirsagar Hometextiles promoting: "${campaignStr}". Target: ${audienceStr}. ${offerStr}
Each message max 200 characters, strong hook, emojis, numbered 1, 2, 3. Include terrytowel.in in one of them.`,
      instagram: `Write an Instagram caption for Kshirsagar Hometextiles for: "${campaignStr}". ${offerStr}
Engaging hook, key benefits, CTA to DM or visit terrytowel.in, 20 relevant hashtags for textile/hotel supply industry.`,
    };
    try {
      const res = await anthropicFetch(prompts[platform]);
      const data = await res.json();
      const _mc = data.content?.[0]?.text || "Could not generate. Please retry.";
      setContent(_mc);
      logActivity("✍️", "Marketing content generated", platform, "marketing");
    } catch { setContent("Connection error. Please retry."); }
    setLoading(false);
  };

  return (
    <div>
      <div className="sh"><div className="st">📣 Marketing Studio</div><span className="tag tag-gold">AI-Powered</span></div>
      <div className="g3 mb4">
        {platforms.map(p => (
          <div key={p.id} onClick={() => setPlatform(p.id)} style={{ border: `1.5px solid ${platform === p.id ? "var(--gold)" : "var(--border)"}`, background: platform === p.id ? "var(--gold-pp)" : "var(--white)", borderRadius: 10, padding: "16px 12px", textAlign: "center", cursor: "pointer", transition: "all .18s" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
          </div>
        ))}
      </div>
      <div className="g2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-title">Campaign Setup</div>
          <div className="mb3 mt3"><label className="lbl">Subject / Campaign Name</label><input className="inp" placeholder="e.g. New Collection Launch — Premium Bath Towels" value={campaign} onChange={e => setCampaign(e.target.value)} /></div>
          <div className="mb3"><label className="lbl">Target Audience</label><select className="sel" value={audience} onChange={e => setAudience(e.target.value)}><option>All Customers</option><option>Hot Leads</option><option>Wholesale Buyers</option><option>Hotel Buyers</option><option>Export Clients</option></select></div>
          <div className="mb4"><label className="lbl">Special Offer (optional)</label><input className="inp" placeholder="e.g. 10% off on 100+ pcs" value={offer} onChange={e => setOffer(e.target.value)} /></div>
          <button className="btn btn-gold btn-full" onClick={generate} disabled={loading}>✨ {loading ? "Generating…" : `Generate ${platforms.find(p => p.id === platform)?.name}`}</button>
        </div>
        <div className="card">
          <div className="card-title">Generated Content</div>
          <div className="card-sub">Ready to copy or send</div>
          {loading && <div className="flex items-c gap2 mt3 text-lt text-sm"><div className="dots"><span /><span /><span /></div>Writing your campaign…</div>}
          {!loading && !content && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-light)" }}><div style={{ fontSize: 40 }}>✍️</div><div className="text-sm mt3">Configure campaign and click Generate</div></div>}
          {!loading && content && <>
            <div className="ai-box mt3" style={{ maxHeight: 320, overflowY: "auto" }}>{content}</div>
            <div className="flex gap2 mt3">
              <button className="btn btn-gold btn-sm" onClick={() => navigator.clipboard.writeText(content)}>📋 Copy</button>
              {platform === "whatsapp" && <button className="wa-btn" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(content)}`)}>💬 Share</button>}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function DocumentsModule() {
  const [sel, setSel] = useState(DOCS[0]);
  const [search, setSearch] = useState("");
  const cats = [...new Set(DOCS.map(d => d.cat))];
  const filtered = DOCS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.cat.toLowerCase().includes(search.toLowerCase()));
  const previewStyle = { pdf: { bg: "#FEF2F2", color: "#C0392B" }, excel: { bg: "#F0FDF4", color: "#166534" }, image: { bg: "#EFF6FF", color: "#1D4ED8" } };
  return (
    <div>
      <div className="sh">
        <div className="st">📂 Document Store</div>
        <div className="flex gap2"><button className="btn btn-out btn-sm">📁 Google Drive</button><button className="btn btn-gold btn-sm">+ Upload File</button></div>
      </div>
      <div className="doc-split">
        <div className="doc-left">
          <div style={{ padding: "8px 4px 10px" }}><input className="inp" placeholder="🔍 Search files…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          {cats.map(cat => {
            const catDocs = filtered.filter(d => d.cat === cat);
            if (!catDocs.length) return null;
            return (
              <div key={cat}>
                <div className="doc-cat-h">{cat}</div>
                {catDocs.map(d => (
                  <div key={d.id} className={`doc-item${sel?.id === d.id ? " sel" : ""}`} onClick={() => setSel(d)}>
                    <span style={{ fontSize: 19, width: 24, textAlign: "center" }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-dark)" }}>{d.name}</div>
                      <div className="text-xs text-lt">{d.size} · {d.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="doc-right">
          {sel ? <>
            <div className="flex justify-b items-c mb4">
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{sel.name}</div>
                <div className="flex gap2 mt2 items-c">
                  <span className={`tag ${sel.preview === "pdf" ? "tag-red" : sel.preview === "excel" ? "tag-green" : "tag-blue"}`}>{sel.preview.toUpperCase()}</span>
                  <span className="text-xs text-lt">{sel.size} · {sel.date} · {sel.cat}</span>
                </div>
              </div>
              <div className="flex gap2">
                <button className="btn btn-out btn-sm">⬇️ Download</button>
                <button className="btn btn-out btn-sm">🔗 Share</button>
                <button className="btn btn-success btn-sm">📤 Drive</button>
              </div>
            </div>
            <div style={{ height: 320, borderRadius: 11, border: "1.5px solid var(--border)", background: previewStyle[sel.preview]?.bg || "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ fontSize: 64 }}>{sel.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: previewStyle[sel.preview]?.color }}>{sel.name}</div>
              <div className="text-sm text-lt">{sel.size}</div>
              <button className="btn btn-gold mt2">👁️ Open Preview</button>
            </div>
            <div className="card mt4">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Quick Share</div>
              <div className="flex gap2">
                {["📧 Email", "💬 WhatsApp", "📋 Copy Link", "🖨️ Print"].map(a => <button key={a} className="btn btn-out btn-sm">{a}</button>)}
              </div>
            </div>
          </> : <div style={{ textAlign: "center", padding: 80, color: "var(--text-light)" }}><div style={{ fontSize: 48 }}>📂</div><div className="text-sm mt3">Select a file to preview</div></div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════ */
const LOGIN_PASSWORD = "kht2025";

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (password === LOGIN_PASSWORD) {
      sessionStorage.setItem("kht_auth", "true");
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased;}
        .lw{
          min-height:100vh;
          background:linear-gradient(155deg,#dde3f0 0%,#e8edf5 50%,#e0e8f0 100%);
          display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;
        }
        .lw::before{
          content:'';position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%,rgba(0,122,255,.08) 0%,transparent 70%),
            radial-gradient(ellipse 500px 350px at 80% 70%,rgba(88,86,214,.06) 0%,transparent 65%),
            radial-gradient(ellipse 350px 250px at 60% 8%, rgba(52,199,89,.04) 0%,transparent 60%);
        }
        .lb{
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(48px) saturate(180%);
          -webkit-backdrop-filter:blur(48px) saturate(180%);
          border:0.5px solid rgba(0,0,0,.08);
          border-radius:24px;padding:44px 40px;
          width:100%;max-width:380px;
          box-shadow:0 8px 40px rgba(0,0,0,.12),0 1px 0 rgba(255,255,255,.9) inset;
          position:relative;z-index:1;
        }
        .ll{text-align:center;margin-bottom:32px;}

        .ll h1{font-size:22px;font-weight:700;color:rgba(0,0,0,.88);letter-spacing:-.04em;line-height:1.2;}
        .ll span{display:block;font-size:12px;color:rgba(0,0,0,.40);margin-top:4px;}
        .llbl{display:block;font-size:12px;font-weight:600;color:rgba(0,0,0,.55);margin-bottom:7px;}
        .linp{
          width:100%;padding:13px 14px;border:1px solid rgba(255,255,255,.18);
          border-radius:12px;font-size:15px;
          font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
          color:rgba(255,255,255,.95);outline:none;transition:all .15s;
          background:rgba(0,0,0,.05);letter-spacing:.1em;color:rgba(0,0,0,.88);
        }
        .linp::placeholder{color:rgba(0,0,0,.25);}
        .linp:focus{background:rgba(0,0,0,.08);border-color:#007AFF;box-shadow:0 0 0 3px rgba(0,122,255,.18);}
        .linp.err{background:rgba(255,59,48,.08);border-color:rgba(255,59,48,.4);}
        .lbtn{
          width:100%;padding:14px;background:#0A84FF;color:#fff;border:none;
          border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-top:16px;
          font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
          letter-spacing:-.01em;transition:all .15s;
          box-shadow:0 4px 16px rgba(10,132,255,.5);
        }
        .lbtn:hover{background:#1A8FFF;box-shadow:0 6px 22px rgba(10,132,255,.6);}
        .lerr{color:#FF3B30;font-size:12px;text-align:center;margin-top:10px;font-weight:500;}
        .lft{text-align:center;margin-top:24px;font-size:12px;color:rgba(0,0,0,.30);}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        .shake{animation:shake .4s ease;}
      `}</style>
      <div className="lw">
        <div className={`lb ${shake ? "shake" : ""}`}>
          <div className="ll">
            <img src={KHT_LOGO} alt="KHT Logo" style={{ width:90, height:90, borderRadius:"50%", objectFit:"cover", margin:"0 auto 16px", display:"block", boxShadow:"0 4px 20px rgba(0,0,0,.15)" }} />
            <h1>Kshirsagar<br/>Hometextiles</h1>
            <span>terrytowel.in · Enterprise</span>
          </div>
          <div style={{ marginBottom:16 }}>
            <label className="llbl">Password</label>
            <input
              className={`linp ${error ? "err" : ""}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            {error && <div className="lerr">Incorrect password. Try again.</div>}
          </div>
          <button className="lbtn" onClick={handleSubmit}>Sign In</button>
          <div className="lft">Secured Access · v2.0</div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PICTURE QUOTATION MODULE
   Select images → build itemised quotation with product photos
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   PICTURE QUOTATION MODULE
   - Each product = one row: image (left) + name/size/weight/price (right)
   - Client: type freely OR pick from dispatch contacts
   - Print: pure static HTML table with embedded base64 images
             Tables + @page margins = 100% reliable A4, never cuts
═══════════════════════════════════════════════════════════════ */

/* ── Data shape for one product row ── */
const EMPTY_ROW = () => ({
  id: Math.random().toString(36).slice(2, 9),
  dataUrl: null,      // base64 image — always dataUrl so print never needs fetch
  imgName: "",
  name:    "",        // product name / quality
  size:    "",        // e.g. 60×90 inch
  weight:  "",        // e.g. 600 GSM / 1200 gms
  price:   "",        // unit price per piece
});

/* ── Drive Picker — single select, fetches base64 at confirm time ── */
function QuoteDrivePickerModal({ driveUrl, onPick, onClose }) {
  const [imgs, setImgs]     = useState([]);
  const [cats, setCats]     = useState([]);
  const [selCat, setSelCat] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [sel, setSel]       = useState(null);
  const [err, setErr]       = useState(null);

  useEffect(() => {
    fetch(`${driveUrl}?action=list&t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.images) {
          setImgs(d.images);
          const c = ["ALL", ...new Set(d.images.map(x => x.cat).filter(Boolean))];
          setCats(c);
        } else { setErr("Could not load Drive images."); }
      })
      .catch(() => setErr("Network error loading Drive images."))
      .finally(() => setLoading(false));
  }, []);

  const visible = selCat === "ALL" ? imgs : imgs.filter(x => x.cat === selCat);

  /* On confirm: fetch base64 via Apps Script proxy so the dataUrl is self-contained */
  const confirm = async () => {
    if (!sel) return;
    setFetching(true);
    try {
      const r = await fetch(`${driveUrl}?action=getBase64&id=${sel.id}&t=${Date.now()}`);
      const d = await r.json();
      if (d.ok && d.base64) {
        const dataUrl = `data:${d.mimeType || "image/jpeg"};base64,${d.base64}`;
        onPick({ dataUrl, imgName: sel.name });
      } else {
        /* Fallback: use Google thumbnail URL as preview (may not print) */
        onPick({ dataUrl: sel.thumb || sel.url, imgName: sel.name });
      }
    } catch {
      onPick({ dataUrl: sel.thumb || sel.url, imgName: sel.name });
    } finally { setFetching(false); }
  };

  const ov = {
    position:"fixed", inset:0, background:"rgba(13,27,42,.72)",
    zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center"
  };
  const box = {
    background:"#fff", borderRadius:16, width:660, maxWidth:"95vw",
    maxHeight:"82vh", display:"flex", flexDirection:"column",
    boxShadow:"0 24px 80px rgba(0,0,0,.4)"
  };

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #E3DDD4", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"#0D1B2A" }}>📁 Pick from Drive</div>
            <div style={{ fontSize:11, color:"#999", marginTop:2 }}>Select one image for this product row</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#999" }}>✕</button>
        </div>

        {/* Category pills */}
        {cats.length > 1 && (
          <div style={{ padding:"10px 20px", display:"flex", gap:6, flexWrap:"wrap", borderBottom:"1px solid #f0ece6" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setSelCat(c)}
                style={{ padding:"4px 12px", borderRadius:20, border:"1.5px solid", fontSize:11, fontWeight:600, cursor:"pointer",
                  borderColor: selCat===c ? "#C4913A" : "#ddd",
                  background:  selCat===c ? "#C4913A" : "#fff",
                  color:       selCat===c ? "#fff"    : "#666" }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Image grid */}
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:"#999" }}>Loading images…</div>
          ) : err ? (
            <div style={{ textAlign:"center", padding:40, color:"#e55" }}>{err}</div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign:"center", padding:40, color:"#bbb" }}>No images in this category.</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:8 }}>
              {visible.map(img => (
                <div key={img.id} onClick={() => setSel(img)}
                  style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:"3px solid",
                    borderColor: sel?.id === img.id ? "#C4913A" : "transparent",
                    boxShadow: sel?.id === img.id ? "0 0 0 2px rgba(196,145,58,.4)" : "0 1px 4px rgba(0,0,0,.1)" }}>
                  <img src={img.thumb || img.url} alt={img.name}
                    style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                  <div style={{ padding:"4px 6px", fontSize:9, color:"#666", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 20px", borderTop:"1px solid #E3DDD4", display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose}
            style={{ padding:"8px 20px", borderRadius:8, border:"1.5px solid #ddd", background:"#fff", cursor:"pointer", fontWeight:600, fontSize:13 }}>
            Cancel
          </button>
          <button onClick={confirm} disabled={!sel || fetching}
            style={{ padding:"8px 24px", borderRadius:8, border:"none", background: sel ? "#C4913A" : "#ddd",
              color: sel ? "#fff" : "#999", cursor: sel ? "pointer" : "default", fontWeight:700, fontSize:13 }}>
            {fetching ? "Loading…" : sel ? `Use: ${sel.name.slice(0,22)}` : "Select an image"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── One product row in the editor ── */
function QuoteRow({ row, idx, total, onChange, onRemove, onMoveUp, onMoveDown, driveUrl }) {
  const fileRef = useRef();
  const [showDrive, setShowDrive] = useState(false);

  const loadFile = file => {
    const reader = new FileReader();
    reader.onload = e => onChange({ dataUrl: e.target.result, imgName: file.name });
    reader.readAsDataURL(file);
  };

  const field = (key, placeholder, hint) => (
    <div style={{ marginBottom:6 }}>
      {hint && <div style={{ fontSize:9, color:"#aaa", textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>{hint}</div>}
      <input value={row[key]} onChange={e => onChange({ [key]: e.target.value })} placeholder={placeholder}
        style={{ width:"100%", border:"none", borderBottom:"1px solid #E8E4DF", padding:"4px 2px", fontSize:13,
          outline:"none", background:"transparent", fontFamily:"inherit",
          fontWeight: key==="name" ? 700 : 400, color: key==="name" ? "#0D1B2A" : "#555" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", gap:0, borderBottom:"1.5px solid #EDE8E2",
      background: idx%2===0 ? "#fff" : "#FDFCFA", position:"relative" }}>

      {/* Row number */}
      <div style={{ width:32, display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:800, color:"#C4913A", borderRight:"1px solid #EDE8E2", flexShrink:0 }}>
        {idx+1}
      </div>

      {/* Image slot — 120×120 */}
      <div style={{ width:140, flexShrink:0, padding:12, display:"flex", flexDirection:"column",
        alignItems:"center", gap:6, borderRight:"1px solid #EDE8E2" }}>
        {row.dataUrl ? (
          <div style={{ width:110, height:110, borderRadius:8, overflow:"hidden",
            border:"2px solid #E3DDD4", position:"relative", cursor:"pointer" }}
            onClick={() => fileRef.current?.click()}>
            <img src={row.dataUrl} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)",
              display:"flex", alignItems:"center", justifyContent:"center",
              opacity:0, transition:".15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>Change</span>
            </div>
          </div>
        ) : (
          <div style={{ width:110, height:110, borderRadius:8, border:"2px dashed #C4913A",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            cursor:"pointer", gap:4, background:"#FFFBF5" }}
            onClick={() => fileRef.current?.click()}>
            <span style={{ fontSize:26 }}>📷</span>
            <span style={{ fontSize:9.5, color:"#C4913A", fontWeight:700 }}>Upload photo</span>
          </div>
        )}
        <button onClick={() => setShowDrive(true)}
          style={{ fontSize:10, padding:"3px 10px", border:"1.5px solid #C4913A", borderRadius:6,
            background:"#fff", color:"#C4913A", cursor:"pointer", fontWeight:700, width:"100%" }}>
          📁 Drive
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e => e.target.files[0] && loadFile(e.target.files[0])} />
        {showDrive && (
          <QuoteDrivePickerModal driveUrl={driveUrl}
            onPick={img => { onChange({ dataUrl: img.dataUrl, imgName: img.imgName }); setShowDrive(false); }}
            onClose={() => setShowDrive(false)} />
        )}
      </div>

      {/* Product fields */}
      <div style={{ flex:1, padding:"12px 16px", borderRight:"1px solid #EDE8E2" }}>
        {field("name",   "Product name / quality…", "Product")}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div>{field("size",   "e.g. 60×90 inch", "Size")}</div>
          <div>{field("weight", "e.g. 600 GSM / 1200 gms", "Weight / GSM")}</div>
        </div>
      </div>

      {/* Price */}
      <div style={{ width:130, flexShrink:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:12, borderRight:"1px solid #EDE8E2", gap:4 }}>
        <div style={{ fontSize:9, color:"#aaa", textTransform:"uppercase", letterSpacing:".08em" }}>Price / pc</div>
        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:13, color:"#888", fontWeight:600 }}>₹</span>
          <input type="number" min="0" value={row.price} onChange={e => onChange({ price: e.target.value })}
            placeholder="0"
            style={{ width:80, border:"1px solid #E3DDD4", borderRadius:6, padding:"6px 8px",
              fontSize:16, fontWeight:800, color:"#C4913A", textAlign:"right", outline:"none", fontFamily:"inherit" }} />
        </div>
      </div>

      {/* Remove / reorder */}
      <div style={{ width:36, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:4 }}>
        {idx > 0       && <button onClick={onMoveUp}   style={{ background:"none", border:"none", cursor:"pointer", color:"#bbb", fontSize:12 }}>▲</button>}
        {idx < total-1 && <button onClick={onMoveDown} style={{ background:"none", border:"none", cursor:"pointer", color:"#bbb", fontSize:12 }}>▼</button>}
        <button onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", color:"#ddd", fontSize:15, lineHeight:1 }}>✕</button>
      </div>
    </div>
  );
}

/* ══════════════════ MAIN MODULE ══════════════════ */
function PictureQuotationModule() {
  const driveUrl = localStorage.getItem("kht_products_drive") || DEFAULT_PRODUCTS_DRIVE_URL;

  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW()]);
  const [client, setClient] = useState({ name:"", company:"", address:"", phone:"" });
  const [meta, setMeta] = useState({
    ref:      `KHT/${new Date().getFullYear()}/${String(Math.floor(Math.random()*900)+100)}`,
    date:     new Date().toISOString().slice(0,10),
    validity: "15 days",
    notes:    "Prices are ex-factory Solapur. GST @12% applicable. Minimum order quantities apply.",
    showGst:  true,
    gstRate:  12,
  });
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  /* Load contacts from dispatch webhook */
  useEffect(() => {
    const webhookUrl = localStorage.getItem("kht_webhook") || DEFAULT_WEBHOOK_URL;
    fetch(`${webhookUrl}?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        const data = Array.isArray(d) ? d : (d.data || []);
        const seen = new Map();
        data.forEach(row => {
          const name = row[1]?.trim();
          if (!name) return;
          const key = name.toLowerCase();
          if (!seen.has(key)) seen.set(key, { name, company: row[2]||"", phone: row[5]||"", address: row[3]||"" });
        });
        setContacts([...seen.values()]);
      })
      .catch(() => {});
  }, []);

  /* Row operations */
  const updateRow = (idx, patch) => setRows(prev => prev.map((r, i) => i===idx ? {...r, ...patch} : r));
  const removeRow = idx => {
    if (rows.length === 1) { showToast("Need at least one row."); return; }
    setRows(prev => prev.filter((_, i) => i !== idx));
  };
  const moveRow = (idx, dir) => {
    setRows(prev => {
      const a = [...prev];
      const tmp = a[idx]; a[idx] = a[idx+dir]; a[idx+dir] = tmp;
      return a;
    });
  };
  const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);

  /* GST calc */
  const priceTotal = rows.reduce((s, r) => s + (parseFloat(r.price)||0), 0);
  const gstAmt     = meta.showGst ? Math.round(priceTotal * meta.gstRate / 100) : 0;
  const grandTotal = priceTotal + gstAmt;

  /* ─────────────────────────────────────────────────────────────
     PRINT / PDF
     Strategy: pure static HTML table, images as embedded base64.
     Tables are the ONLY 100% reliable format for A4 print —
     no flex, no grid, no transform, no canvas. Just HTML 4 table
     layout that every browser print engine handles identically.
  ───────────────────────────────────────────────────────────── */
  const printQuotation = () => {
    if (!rows.some(r => r.name || r.dataUrl)) {
      showToast("Add at least one product before printing.");
      return;
    }
    logActivity({ icon:"🧾", title:`Quotation printed${client.name ? " for "+client.name : ""}`, sub:`${rows.filter(r=>r.name).map(r=>r.name).slice(0,3).join(", ")||"—"} · Ref: ${meta.ref}`, module:"designer" });

    const fmtDate = d => {
      try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
      catch { return d; }
    };

    /* Each row as a <tr> — page-break-inside:avoid keeps image + details together */
    const rowsHtml = rows.map((r, i) => {
      const imgHtml = r.dataUrl
        ? `<img src="${r.dataUrl}"
             width="110" height="110"
             style="display:block;width:110px;height:110px;object-fit:cover;border-radius:7px;border:1px solid #E3DDD4;">`
        : `<div style="width:110px;height:110px;border-radius:7px;background:#F4F1EC;border:1px solid #E3DDD4;display:flex;align-items:center;justify-content:center;font-size:28px;">📷</div>`;

      const priceHtml = r.price
        ? `<div style="font-size:20px;font-weight:900;color:#C4913A;font-family:'Fraunces',Georgia,serif;">₹${parseFloat(r.price).toLocaleString("en-IN")}</div>
           <div style="font-size:10px;color:#aaa;margin-top:2px;font-weight:500;">per piece</div>`
        : `<div style="font-size:14px;color:#bbb;">—</div>`;

      return `
      <tr style="page-break-inside:avoid;break-inside:avoid;">
        <td style="width:36px;padding:14px 8px;text-align:center;border:1px solid #E8E4DF;
                   font-size:12px;font-weight:900;color:#C4913A;vertical-align:middle;
                   background:${i%2===0?"#fff":"#FDFCFA"};">
          ${i+1}
        </td>
        <td style="width:136px;padding:12px;text-align:center;border:1px solid #E8E4DF;vertical-align:middle;
                   background:${i%2===0?"#fff":"#FDFCFA"};">
          ${imgHtml}
        </td>
        <td style="padding:14px 20px;border:1px solid #E8E4DF;vertical-align:top;
                   background:${i%2===0?"#fff":"#FDFCFA"};">
          <div style="font-size:15px;font-weight:800;color:#0D1B2A;margin-bottom:6px;font-family:'Fraunces',Georgia,serif;">
            ${r.name || "<span style='color:#ccc;font-style:italic;font-weight:400;'>Unnamed product</span>"}
          </div>
          ${r.size   ? `<div style="font-size:12px;color:#666;margin-bottom:3px;">📐 <strong>Size:</strong> ${r.size}</div>` : ""}
          ${r.weight ? `<div style="font-size:12px;color:#666;">⚖️ <strong>Weight / GSM:</strong> ${r.weight}</div>` : ""}
        </td>
        <td style="width:160px;padding:14px 16px;text-align:center;border:1px solid #E8E4DF;vertical-align:middle;
                   background:${i%2===0?"#fff":"#FDFCFA"};">
          ${priceHtml}
        </td>
      </tr>`;
    }).join("\n");

    const clientHtml = (client.name || client.company) ? `
      <table width="100%" style="margin-bottom:18px;border-collapse:collapse;">
        <tr>
          <td style="background:#F4F1EC;padding:12px 18px;border:1px solid #E3DDD4;border-radius:0 0 8px 8px;vertical-align:top;">
            <span style="font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#C4913A;">Prepared For</span><br>
            ${client.name    ? `<span style="font-size:14px;font-weight:800;color:#0D1B2A;">${client.name}</span><br>`   : ""}
            ${client.company ? `<span style="font-size:12px;color:#555;">${client.company}</span><br>`                   : ""}
            ${client.address ? `<span style="font-size:11px;color:#888;">${client.address}</span><br>`                   : ""}
            ${client.phone   ? `<span style="font-size:11px;color:#888;">📞 ${client.phone}</span>`                       : ""}
          </td>
        </tr>
      </table>` : "";

    const gstRowHtml = meta.showGst ? `
      <tr>
        <td colspan="3" style="padding:9px 18px;text-align:right;border:1px solid #E3DDD4;font-size:12px;color:#666;background:#F4F1EC;">
          GST @ ${meta.gstRate}%
        </td>
        <td style="padding:9px 16px;text-align:center;border:1px solid #E3DDD4;font-size:13px;font-weight:700;background:#F4F1EC;">
          ₹${gstAmt.toLocaleString("en-IN")}
        </td>
      </tr>` : "";

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>Quotation · ${meta.ref}</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    /* A4 with sensible margins — content never overflows a page boundary */
    @page { size:A4 portrait; margin:10mm 12mm 12mm 12mm; }
    body {
      font-family:'Plus Jakarta Sans',Arial,sans-serif;
      font-size:13px;
      color:#0D1B2A;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
      color-adjust:exact;
    }
    table { border-collapse:collapse; }
    img   { display:block; border:0; }
  </style>
</head>
<body>

  <!-- ═══ COMPANY HEADER ═══ -->
  <table width="100%" style="margin-bottom:0;background:#0D1B2A;border-radius:8px 8px 0 0;">
    <tr>
      <td style="padding:16px 20px;vertical-align:top;">
        <div style="color:#C4913A;font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:700;">Kshirsagar Hometextiles</div>
        <div style="color:rgba(255,255,255,.5);font-size:10px;margin-top:3px;">Est. 1947 · Solapur, India · terrytowel.in</div>
        <div style="color:rgba(255,255,255,.38);font-size:9.5px;margin-top:2px;">+91 98225 49824 · info@kshirsagar.com · GST: 27ANLPK9383J1Z8</div>
      </td>
      <td style="padding:16px 20px;text-align:right;vertical-align:top;">
        <div style="color:rgba(255,255,255,.38);font-size:9px;text-transform:uppercase;letter-spacing:.14em;">Price Quotation</div>
        <div style="color:#fff;font-size:16px;font-weight:800;margin-top:3px;">${meta.ref}</div>
        <div style="color:rgba(255,255,255,.55);font-size:10.5px;margin-top:3px;">${fmtDate(meta.date)}</div>
        <div style="color:rgba(255,255,255,.38);font-size:9.5px;margin-top:2px;">Valid: ${meta.validity}</div>
      </td>
    </tr>
  </table>

  ${clientHtml}
  ${!clientHtml ? '<div style="height:14px"></div>' : ''}

  <!-- ═══ PRODUCTS TABLE ═══ -->
  <table width="100%" style="margin-bottom:0;border:1px solid #E8E4DF;">
    <thead>
      <tr style="background:#0D1B2A;">
        <th style="width:36px;padding:10px 8px;text-align:center;border:1px solid #1a2f44;color:rgba(255,255,255,.6);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">#</th>
        <th style="width:136px;padding:10px;text-align:center;border:1px solid #1a2f44;color:rgba(255,255,255,.6);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Photo</th>
        <th style="padding:10px 20px;text-align:left;border:1px solid #1a2f44;color:rgba(255,255,255,.6);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Product Details</th>
        <th style="width:160px;padding:10px 16px;text-align:center;border:1px solid #1a2f44;color:rgba(255,255,255,.6);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Price / Piece</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      ${gstRowHtml}
      <tr style="background:#0D1B2A;">
        <td colspan="3" style="padding:12px 18px;text-align:right;border:1px solid #1a2f44;color:#C4913A;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">
          Grand Total
        </td>
        <td style="padding:12px 16px;text-align:center;border:1px solid #1a2f44;">
          <div style="font-size:22px;font-weight:900;color:#fff;font-family:'Fraunces',Georgia,serif;">
            ₹${grandTotal.toLocaleString("en-IN")}
          </div>
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- ═══ TERMS ═══ -->
  ${meta.notes ? `
  <table width="100%" style="margin-top:0;">
    <tr>
      <td style="padding:10px 18px;background:#F4F1EC;border:1px solid #E3DDD4;border-top:none;border-radius:0 0 8px 8px;">
        <span style="font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#C4913A;">Terms &amp; Notes</span><br>
        <span style="font-size:11px;color:#666;">${meta.notes}</span>
      </td>
    </tr>
  </table>` : ""}

  <!-- ═══ SIGN-OFF ═══ -->
  <table width="100%" style="margin-top:22px;">
    <tr>
      <td style="font-size:9.5px;color:#bbb;vertical-align:bottom;">This is a computer-generated quotation. · terrytowel.in</td>
      <td style="text-align:right;vertical-align:bottom;width:200px;">
        <div style="border-top:1.5px solid #0D1B2A;padding-top:6px;">
          <div style="font-size:10px;color:#555;font-weight:600;">Authorised Signatory</div>
          <div style="font-size:9px;color:#999;margin-top:2px;">Kshirsagar Hometextiles</div>
        </div>
      </td>
    </tr>
  </table>

</body></html>`);
    win.document.close();
    logActivity("🧾", `Quotation: ${client.name||'Client'}`, `${rows.filter(r=>r.name).length} products · ${meta.ref}`, "designer");
    setTimeout(() => { win.focus(); win.print(); }, 800);
  };

  /* ═══ EDITOR UI ═══ */
  const filteredContacts = contacts.filter(c =>
    !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.company||"").toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="sh" style={{ flexWrap:"wrap", gap:10 }}>
        <div>
          <div className="st">🧾 Picture Quotation</div>
          <div className="text-sm text-lt" style={{ marginTop:2 }}>Product photos with pricing · Print to PDF</div>
        </div>
        <button className="btn btn-gold" onClick={printQuotation} style={{ fontSize:14, padding:"10px 22px", gap:6 }}>
          🖨️ Print / Save PDF
        </button>
      </div>

      {toast && (
        <div style={{ position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)",
          background:"#0D1B2A", color:"#fff", padding:"12px 24px", borderRadius:12,
          fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 8px 32px rgba(0,0,0,.3)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:18, padding:"16px 0" }}>

        {/* ── LEFT: client + rows ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Client card */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".1em", color:"#C4913A" }}>
                Prepared For
              </div>
              {contacts.length > 0 && (
                <button onClick={() => setShowContacts(s => !s)}
                  style={{ fontSize:11, padding:"4px 12px", border:"1.5px solid #C4913A", borderRadius:20,
                    background: showContacts ? "#C4913A" : "#fff", color: showContacts ? "#fff" : "#C4913A",
                    cursor:"pointer", fontWeight:700 }}>
                  👤 Pick Contact ({contacts.length})
                </button>
              )}
            </div>

            {/* Contact picker dropdown */}
            {showContacts && (
              <div style={{ marginBottom:12, border:"1px solid #E3DDD4", borderRadius:8, overflow:"hidden" }}>
                <div style={{ padding:"8px 10px", borderBottom:"1px solid #E3DDD4", background:"#F4F1EC" }}>
                  <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search contacts…" autoFocus
                    style={{ width:"100%", border:"1px solid #ddd", borderRadius:6, padding:"6px 10px",
                      fontSize:12, outline:"none", fontFamily:"inherit" }} />
                </div>
                <div style={{ maxHeight:200, overflowY:"auto" }}>
                  {filteredContacts.length === 0 ? (
                    <div style={{ padding:16, textAlign:"center", color:"#bbb", fontSize:12 }}>No contacts found</div>
                  ) : filteredContacts.map((c, i) => (
                    <div key={i} onClick={() => { setClient({ name:c.name, company:c.company||"", address:c.address||"", phone:c.phone||"" }); setShowContacts(false); setContactSearch(""); }}
                      style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f0ece6",
                        display:"flex", flexDirection:"column", gap:2 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FDF8F2"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{c.name}</div>
                      {c.company && <div style={{ fontSize:11, color:"#888" }}>{c.company}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["name","Contact Name"],["company","Company / Hotel"],["address","Address"],["phone","Phone"]].map(([k,ph]) => (
                <div key={k} style={{ gridColumn: k==="address" ? "1/-1" : "auto" }}>
                  <label style={{ fontSize:10, color:"#999", display:"block", marginBottom:3 }}>{ph}</label>
                  <input value={client[k]} onChange={e => setClient(c => ({...c,[k]:e.target.value}))} placeholder={ph}
                    style={{ width:"100%", border:"1px solid #E3DDD4", borderRadius:6, padding:"7px 10px",
                      fontSize:13, outline:"none", fontFamily:"inherit" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Products table */}
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1.5px solid #EDE8E2",
              display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FDFCFA" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#0D1B2A" }}>
                Products · <span style={{ color:"#C4913A" }}>{rows.length}</span> item{rows.length!==1?"s":""}
              </div>
              <button className="btn btn-out btn-sm" onClick={addRow}><Plus size={12}/> Add Row</button>
            </div>

            {/* Column headers */}
            <div style={{ display:"flex", background:"#F4F1EC", borderBottom:"1px solid #EDE8E2",
              fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:"#999" }}>
              <div style={{ width:32, padding:"6px 0", textAlign:"center", borderRight:"1px solid #EDE8E2" }}>#</div>
              <div style={{ width:140, padding:"6px 12px", borderRight:"1px solid #EDE8E2" }}>Photo</div>
              <div style={{ flex:1, padding:"6px 16px", borderRight:"1px solid #EDE8E2" }}>Product Details</div>
              <div style={{ width:130, padding:"6px 0", textAlign:"center", borderRight:"1px solid #EDE8E2" }}>Price / pc</div>
              <div style={{ width:36 }}></div>
            </div>

            {rows.map((r, i) => (
              <QuoteRow key={r.id} row={r} idx={i} total={rows.length}
                onChange={patch => updateRow(i, patch)}
                onRemove={() => removeRow(i)}
                onMoveUp={() => moveRow(i, -1)}
                onMoveDown={() => moveRow(i, 1)}
                driveUrl={driveUrl} />
            ))}

            <div style={{ padding:"10px 12px", background:"#FDFCFA" }}>
              <button className="btn btn-out" onClick={addRow}
                style={{ width:"100%", borderStyle:"dashed", color:"var(--text-light)", fontSize:12 }}>
                <Plus size={13}/> Add Another Product
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: meta + totals ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".1em", color:"#C4913A", marginBottom:12 }}>
              Quotation Details
            </div>
            {[["ref","Reference No."],["date","Date"],["validity","Valid For"]].map(([k,lbl]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ fontSize:10, color:"#999", display:"block", marginBottom:3 }}>{lbl}</label>
                <input value={meta[k]} onChange={e => setMeta(m => ({...m,[k]:e.target.value}))}
                  type={k==="date" ? "date" : "text"}
                  style={{ width:"100%", border:"1px solid #E3DDD4", borderRadius:6, padding:"7px 10px",
                    fontSize:12, outline:"none", fontFamily:"inherit" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:10, color:"#999", display:"block", marginBottom:3 }}>Terms / Notes</label>
              <textarea value={meta.notes} onChange={e => setMeta(m => ({...m, notes:e.target.value}))} rows={3}
                style={{ width:"100%", border:"1px solid #E3DDD4", borderRadius:6, padding:"7px 10px",
                  fontSize:11, outline:"none", fontFamily:"inherit", resize:"vertical" }} />
            </div>
          </div>

          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".1em", color:"#C4913A", marginBottom:14 }}>
              Summary
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
              <span style={{ color:"#666" }}>Sum of prices</span>
              <span style={{ fontWeight:600 }}>₹{priceTotal.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              fontSize:12, marginBottom:10, paddingBottom:10, borderBottom:"1px solid #E3DDD4" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <input type="checkbox" id="gst" checked={meta.showGst}
                  onChange={e => setMeta(m => ({...m, showGst:e.target.checked}))} />
                <label htmlFor="gst" style={{ color:"#666", cursor:"pointer" }}>GST</label>
                <input type="number" value={meta.gstRate} disabled={!meta.showGst}
                  onChange={e => setMeta(m => ({...m, gstRate:parseFloat(e.target.value)||0}))}
                  style={{ width:36, border:"1px solid #E3DDD4", borderRadius:4, padding:"2px 5px", fontSize:11, outline:"none" }} />
                <span style={{ color:"#888", fontSize:11 }}>%</span>
              </div>
              <span style={{ fontWeight:600 }}>₹{gstAmt.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:17, fontWeight:800 }}>
              <span style={{ color:"#0D1B2A" }}>Grand Total</span>
              <span style={{ color:"#C4913A", fontFamily:"'Fraunces',serif" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <button className="btn btn-gold" onClick={printQuotation}
              style={{ width:"100%", marginTop:16, fontSize:14, padding:12, gap:6 }}>
              🖨️ Print / Save as PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("home");
  const [notif, setNotif] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem("kht_auth") === "true");

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  const nav = [
    { id: "home", icon: "🏠", label: "Dashboard" },
    { id: "dispatch", icon: "📦", label: "Dispatch", section: "OPERATIONS" },
    { id: "products", icon: "🏷️", label: "Products" },
    { id: "designer", icon: "🧾", label: "Quotation" },
    { id: "crm", icon: "👥", label: "CRM & Sales", section: "GROWTH" },
    { id: "marketing", icon: "📣", label: "Marketing" },
    { id: "documents", icon: "📂", label: "Documents", section: "STORAGE" },
  ];

  const titles = { home: "Dashboard Overview", dispatch: "Dispatch Manager", products: "Products Database", designer: "Picture Quotation", crm: "CRM & Sales", marketing: "Marketing Studio", documents: "Document Store" };

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      {notif && <div className="notif">{notif}</div>}
      <div className="erp-shell">
        {/* SIDEBAR */}
        <div className="sb">
          <div className="sb-logo">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src={KHT_LOGO} alt="KHT"
                style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover",
                         flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,.15)" }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--label)", letterSpacing:"-.02em", lineHeight:1.3 }}>
                  Kshirsagar<br/>Hometextiles
                </div>
                <div style={{ fontSize:10, color:"var(--label3)", marginTop:2 }}>terrytowel.in · Est. 1947</div>
              </div>
            </div>
          </div>
          <div className="sb-nav">
            {nav.map(item => (
              <div key={item.id}>
                {item.section && <div className="sb-section">{item.section}</div>}
                <div className={`sb-item${active === item.id ? " active" : ""}`} onClick={() => setActive(item.id)}>
                  <span className="sb-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="sb-foot">
            <p><strong>Admin</strong> · Kshirsagar HT</p>
            <p style={{ marginTop:2 }}>v2.0</p>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{titles[active]}</div>
            <div className="topbar-right">
              <span className="topbar-pill">Est. 1947 · Solapur</span>
              <div className="topbar-av">KH</div>
            </div>
          </div>
          <div className="content">
            {active === "home" && <HomeModule setActive={setActive} />}
            {active === "dispatch" && <DispatchModule showNotif={showNotif} />}
            {active === "products" && <ProductsModule />}
            {active === "designer" && <PictureQuotationModule />}
            {active === "crm" && <CRMModule />}
            {active === "marketing" && <MarketingModule />}
            {active === "documents" && <DocumentsModule />}
          </div>
        </div>
      </div>
    </>
  );
}

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

  return (
    <div style={{ fontFamily:"'Arial',sans-serif", height:"100%", display:"flex",
      flexDirection:"column", boxSizing:"border-box", background:"white", overflow:"hidden" }}>

      {/* ── HEADER — logo + name only, no dark background ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"8px 14px 8px", borderBottom:"2px solid #111" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={KHT_LOGO} alt="KHT"
            style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"1.5px solid #999" }} />
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:"#111", letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1 }}>
              {sender.name}
            </div>
            <div style={{ fontSize:7, color:"#666", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>
              Manufacturers & Exporters of Hometextiles · Since 1947 · {sender.website}
            </div>
          </div>
        </div>
        <div style={{ fontSize:8, fontWeight:900, color:"#111", padding:"4px 12px",
          border:"1.5px solid #111", borderRadius:3, letterSpacing:"0.16em",
          textTransform:"uppercase", whiteSpace:"nowrap" }}>
          {type}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* LEFT — SHIP TO */}
        <div style={{ flex:"0 0 58%", borderRight:"2px solid #111", padding:"12px 14px",
          display:"flex", flexDirection:"column", justifyContent:"space-between" }}>

          {/* FROM — compact */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:6.5, fontWeight:900, color:"#999", textTransform:"uppercase",
              letterSpacing:"0.2em", marginBottom:3 }}>From</div>
            <div style={{ fontSize:9.5, fontWeight:800, color:"#222" }}>{sender.name}</div>
            <div style={{ fontSize:8.5, color:"#666", lineHeight:1.5, marginTop:1 }}>
              {sender.address}, {sender.city} – {sender.zip} · {sender.phone}
            </div>
          </div>

          {/* Thin rule */}
          <div style={{ borderTop:"1px solid #ccc", marginBottom:10 }} />

          {/* SHIP TO */}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:7, fontWeight:900, color:"#999", textTransform:"uppercase",
              letterSpacing:"0.22em", marginBottom:8 }}>Ship To</div>
            <div style={{ fontSize:26, fontWeight:900, color:"#111", lineHeight:1.1,
              marginBottom:4, wordBreak:"break-word" }}>{recipient.name}</div>
            {recipient.company && (
              <div style={{ fontSize:13, fontWeight:800, color:"#333", textTransform:"uppercase",
                letterSpacing:"0.04em", marginBottom:7, paddingBottom:7, borderBottom:"1px solid #eee" }}>
                {recipient.company}
              </div>
            )}
            <div style={{ fontSize:13, color:"#444", lineHeight:1.8, marginBottom:2 }}>
              {(() => {
                const parts = (recipient.address || "").split(",");
                const line1 = parts.slice(0,2).join(",");
                const line2 = parts.slice(2).join(",").trim();
                return (<>{line1}{line2 && <><br/>{line2}</>}</>);
              })()}
            </div>
            <div style={{ fontSize:15, fontWeight:900, color:"#111", marginBottom:8 }}>
              {recipient.city}{recipient.state ? `, ${recipient.state}` : ""} &nbsp;–&nbsp;
              <span style={{ letterSpacing:"0.08em" }}>{recipient.zip}</span>
            </div>
            {recipient.phone && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                border:"1.5px solid #ccc", borderRadius:5, padding:"4px 10px" }}>
                <span style={{ fontSize:12 }}>📞</span>
                <span style={{ fontSize:12, fontWeight:900, color:"#111", letterSpacing:"0.04em" }}>
                  {recipient.phone}
                </span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end",
            marginTop:10, paddingTop:8, borderTop:"1px solid #ddd" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:80, borderBottom:"1px solid #888", marginBottom:3 }} />
              <div style={{ fontSize:6.5, textTransform:"uppercase", letterSpacing:"0.1em", color:"#888", fontWeight:700 }}>
                Receiver's Signature
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:7, fontWeight:700, color:"#666", marginBottom:12 }}>For {sender.name}</div>
              <div style={{ width:80, borderBottom:"1px solid #888", marginBottom:3 }} />
              <div style={{ fontSize:6.5, textTransform:"uppercase", letterSpacing:"0.1em", color:"#888", fontWeight:700 }}>
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — DISPATCH INFO */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"12px 12px 10px" }}>

          {/* QR */}
          <div style={{ textAlign:"center", marginBottom:10 }}>
            <img src={qrUrl} alt="QR" style={{ width:68, height:68, border:"1px solid #ccc", borderRadius:4 }} />
            <div style={{ fontSize:6.5, color:"#aaa", marginTop:2, letterSpacing:"0.1em", fontWeight:700 }}>SCAN TO VERIFY</div>
          </div>

          {/* Dispatch details */}
          <div style={{ border:"1.5px solid #ccc", borderRadius:5, overflow:"hidden", marginBottom:10 }}>
            <div style={{ background:"#f5f5f5", padding:"4px 10px", borderBottom:"1px solid #ddd" }}>
              <div style={{ fontSize:7.5, fontWeight:900, color:"#333", letterSpacing:"0.12em", textTransform:"uppercase" }}>
                Dispatch Details
              </div>
            </div>
            {[
              ["Date", formatDateIndian(dispatchInfo.date)],
              ["Via",  dispatchInfo.courierName],
              ...(dispatchInfo.trackingNo ? [["Tracking #", dispatchInfo.trackingNo]] : []),
              ...(dispatchInfo.weight    ? [["Weight",     `${dispatchInfo.weight} ${dispatchInfo.weightUnit}`]] : []),
              ["Value", `₹ ${dispatchInfo.declaredValue || "0"}`],
            ].map(([k, v], idx, arr) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                padding:"4px 10px", borderBottom: idx < arr.length-1 ? "1px solid #eee" : "none",
                background: idx%2===0 ? "white" : "#fafafa" }}>
                <span style={{ fontSize:7.5, color:"#888", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{k}</span>
                <span style={{ fontSize:8.5, fontWeight:800, color:"#111", textAlign:"right", maxWidth:"58%", wordBreak:"break-word" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ border:"1.5px solid #ccc", borderRadius:5, overflow:"hidden", flex:1 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:8.5 }}>
              <thead>
                <tr style={{ background:"#f5f5f5", borderBottom:"1px solid #ddd" }}>
                  <th style={{ padding:"5px 8px", fontSize:7, fontWeight:900, textTransform:"uppercase",
                    letterSpacing:"0.1em", textAlign:"left", color:"#444" }}>Items Dispatched</th>
                  <th style={{ padding:"5px 8px", fontSize:7, fontWeight:900, textTransform:"uppercase",
                    letterSpacing:"0.1em", textAlign:"center", color:"#444", width:32 }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #f0f0f0" }}>
                    <td style={{ padding:"4px 8px", verticalAlign:"top" }}>
                      <div style={{ fontWeight:800, color:"#111", fontSize:8.5 }}>{item.type}</div>
                      {item.desc && <div style={{ color:"#888", fontSize:7.5, marginTop:1 }}>{item.desc}</div>}
                    </td>
                    <td style={{ padding:"4px 8px", textAlign:"center", fontWeight:900, color:"#111" }}>{item.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:"2px solid #ccc", background:"#f9f9f9" }}>
                  <td style={{ padding:"5px 8px", fontWeight:900, textAlign:"right", color:"#333", fontSize:9 }}>Total Pieces</td>
                  <td style={{ padding:"5px 8px", textAlign:"center", fontWeight:900, color:"#111", fontSize:11 }}>{totalQty}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* GST note */}
          <div style={{ marginTop:7, fontSize:7, color:"#aaa", textAlign:"center" }}>
            GST: <strong style={{ color:"#555" }}>{sender.gst}</strong> &nbsp;·&nbsp; No Commercial Value
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
    <div id="doc-preview" style={{
      width:"9in", height:"4.5in", background:"white", position:"relative",
      fontFamily:"'Arial',sans-serif", boxSizing:"border-box", overflow:"hidden",
      display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"0.6in 0.5in 0.6in 0"
    }}>
      {/* ADDRESS BLOCK — right-aligned, big clear type for window envelope */}
      <div style={{ width:"3.8in", textAlign:"left" }}>
        <div style={{ fontSize:9, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10 }}>To</div>
        <div style={{ fontSize:20, fontWeight:900, color:"#111", lineHeight:1.15, marginBottom:4 }}>{recipient.name}</div>
        {recipient.company && (
          <div style={{ fontSize:13, fontWeight:700, color:"#333", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:6 }}>{recipient.company}</div>
        )}
        <div style={{ fontSize:12, color:"#444", lineHeight:1.7 }}>
          {recipient.address}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"#222", marginTop:4 }}>
          {recipient.city}{recipient.state ? `, ${recipient.state}` : ""} – {recipient.zip}
        </div>
        {recipient.phone && (
          <div style={{ fontSize:11, color:"#666", marginTop:6 }}>Ph: {recipient.phone}</div>
        )}
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

  const fetchImages = async (force = false) => {
    if (!driveUrl) return;
    // Serve from cache instantly, then refresh in background
    const cacheKey = "kht_img_cache";
    if (!force) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (cached && Date.now() - cached.ts < 120000) { setImages(cached.data); setLoading(false); }
      } catch {}
    }
    setLoading(true);
    try {
      const res = await fetch(`${driveUrl}?action=list&t=${Date.now()}`);
      const data = await res.json();
      if (data.ok) {
        setImages(data.images || []);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: data.images || [] })); } catch {}
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchImages(); }, [driveUrl]);
  useEffect(() => {
    if (!driveUrl) return;
    const t = setInterval(() => fetchImages(true), 60000);
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
            <button className="btn btn-out btn-sm" onClick={() => fetchImages(true)} disabled={loading}>
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

/* ── Drive Picker — supports single-row OR bulk multi-select ── */
function QuoteDrivePickerModal({ driveUrl, onPick, onPickMulti, onClose, multiMode = false }) {
  const [imgs, setImgs]     = useState([]);
  const [cats, setCats]     = useState([]);
  const [selCat, setSelCat] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  /* single-select */
  const [sel, setSel]       = useState(null);
  /* multi-select — set of img objects */
  const [multiSel, setMultiSel] = useState([]);
  const [err, setErr]       = useState(null);

  useEffect(() => {
    fetch(`${driveUrl}?action=list&t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.images) {
          setImgs(d.images);
          setCats(["ALL", ...new Set(d.images.map(x => x.cat).filter(Boolean))]);
        } else setErr("Could not load Drive images.");
      })
      .catch(() => setErr("Network error."))
      .finally(() => setLoading(false));
  }, []);

  const visible = selCat === "ALL" ? imgs : imgs.filter(x => x.cat === selCat);

  const toggleMulti = (img) => {
    setMultiSel(prev =>
      prev.find(x => x.id === img.id) ? prev.filter(x => x.id !== img.id) : [...prev, img]
    );
  };

  /* Fetch base64 for a single img */
  const fetchBase64 = async (img) => {
    try {
      const r = await fetch(`${driveUrl}?action=getBase64&id=${img.id}&t=${Date.now()}`);
      const d = await r.json();
      if (d.ok && d.base64) return { dataUrl: `data:${d.mimeType||"image/jpeg"};base64,${d.base64}`, imgName: img.name };
    } catch {}
    return { dataUrl: img.thumb || img.url, imgName: img.name };
  };

  /* Single confirm */
  const confirmSingle = async () => {
    if (!sel) return;
    setFetching(true);
    const result = await fetchBase64(sel);
    onPick(result);
    setFetching(false);
  };

  /* Bulk confirm — fetch all selected in parallel */
  const confirmMulti = async () => {
    if (!multiSel.length) return;
    setFetching(true);
    const results = await Promise.all(multiSel.map(fetchBase64));
    onPickMulti(results);
    setFetching(false);
  };

  const ov = { position:"fixed", inset:0, background:"rgba(0,0,0,.45)", backdropFilter:"blur(4px)",
    zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center" };
  const box = { background:"rgba(255,255,255,.96)", backdropFilter:"blur(20px)",
    borderRadius:18, width:680, maxWidth:"96vw", maxHeight:"86vh",
    display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,.22)",
    border:"0.5px solid rgba(0,0,0,.08)" };
  const isSelected = (img) => multiMode ? !!multiSel.find(x => x.id === img.id) : sel?.id === img.id;

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"0.5px solid rgba(0,0,0,.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"var(--label)" }}>
              {multiMode ? "📁 Select Multiple Images from Drive" : "📁 Pick from Drive"}
            </div>
            <div style={{ fontSize:11, color:"var(--label3)", marginTop:2 }}>
              {multiMode ? `${multiSel.length} selected — each image will become a product row` : "Select one image for this row"}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--label3)", lineHeight:1 }}>✕</button>
        </div>

        {/* Category pills */}
        {cats.length > 1 && (
          <div style={{ padding:"10px 20px", display:"flex", gap:6, flexWrap:"wrap", borderBottom:"0.5px solid rgba(0,0,0,.06)" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setSelCat(c)}
                style={{ padding:"4px 12px", borderRadius:20, border:"1.5px solid",
                  fontSize:11, fontWeight:600, cursor:"pointer",
                  borderColor: selCat===c ? "var(--blue)" : "rgba(0,0,0,.12)",
                  background: selCat===c ? "var(--blue)" : "transparent",
                  color: selCat===c ? "#fff" : "var(--label2)" }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          {loading && <div style={{ textAlign:"center", padding:40, color:"var(--label3)" }}>Loading from Drive…</div>}
          {err    && <div style={{ textAlign:"center", padding:40, color:"var(--red)" }}>{err}</div>}
          {!loading && !err && visible.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:"var(--label3)" }}>No images in this category.</div>
          )}
          {!loading && !err && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:10 }}>
              {visible.map(img => (
                <div key={img.id}
                  onClick={() => multiMode ? toggleMulti(img) : setSel(img)}
                  style={{ cursor:"pointer", borderRadius:10, overflow:"hidden",
                    border: isSelected(img) ? "2.5px solid var(--blue)" : "2px solid rgba(0,0,0,.07)",
                    boxShadow: isSelected(img) ? "0 0 0 3px rgba(0,122,255,.18)" : "0 1px 4px rgba(0,0,0,.08)",
                    position:"relative" }}>
                  {isSelected(img) && (
                    <div style={{ position:"absolute", top:5, right:5, width:20, height:20, borderRadius:"50%",
                      background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, color:"#fff", fontWeight:800, zIndex:1 }}>✓</div>
                  )}
                  <img src={img.thumb || img.url} alt={img.name}
                    style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                  <div style={{ padding:"5px 7px", fontSize:9, color:"var(--label2)",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                    background:"rgba(255,255,255,.9)" }}>
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 20px", borderTop:"0.5px solid rgba(0,0,0,.08)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:12, color:"var(--label3)" }}>
            {multiMode && multiSel.length > 0 && `${multiSel.length} image${multiSel.length>1?"s":""} selected`}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose}
              style={{ padding:"8px 20px", borderRadius:8, border:"1px solid rgba(0,0,0,.12)",
                background:"transparent", cursor:"pointer", fontWeight:600, fontSize:13, color:"var(--label2)" }}>
              Cancel
            </button>
            {multiMode ? (
              <button onClick={confirmMulti} disabled={!multiSel.length || fetching}
                style={{ padding:"8px 24px", borderRadius:8, border:"none",
                  background: multiSel.length ? "var(--blue)" : "rgba(0,0,0,.1)",
                  color: multiSel.length ? "#fff" : "var(--label3)",
                  cursor: multiSel.length ? "pointer" : "default", fontWeight:700, fontSize:13 }}>
                {fetching ? "Loading images…" : multiSel.length ? `Add ${multiSel.length} Item${multiSel.length>1?"s":""}` : "Select images"}
              </button>
            ) : (
              <button onClick={confirmSingle} disabled={!sel || fetching}
                style={{ padding:"8px 24px", borderRadius:8, border:"none",
                  background: sel ? "var(--blue)" : "rgba(0,0,0,.1)",
                  color: sel ? "#fff" : "var(--label3)",
                  cursor: sel ? "pointer" : "default", fontWeight:700, fontSize:13 }}>
                {fetching ? "Loading…" : sel ? `Use: ${sel.name.slice(0,22)}` : "Select an image"}
              </button>
            )}
          </div>
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
    notes:    "Prices are ex-factory Solapur. GST @5% applicable. Minimum order quantities apply.",
    showGst:  true,
    gstRate:  5,
  });
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [showBulkDrive, setShowBulkDrive] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  /* Bulk add: each picked image becomes a new row */
  const handleBulkPick = (pickedImgs) => {
    const newRows = pickedImgs.map(img => ({
      ...EMPTY_ROW(),
      dataUrl: img.dataUrl,
      imgName: img.imgName,
      name: img.imgName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), // auto-name from filename
    }));
    setRows(prev => {
      // Remove blank rows at the end first
      const trimmed = prev.filter(r => r.name || r.dataUrl || r.price);
      return [...(trimmed.length ? trimmed : []), ...newRows];
    });
    setShowBulkDrive(false);
    showToast(`✅ Added ${newRows.length} product${newRows.length > 1 ? "s" : ""} from Drive`);
  };

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
      <td style="padding:14px 18px;vertical-align:middle;">
        <table><tr>
          <td style="vertical-align:middle;padding-right:14px;">
            <img src="${KHT_LOGO}" width="54" height="54" style="border-radius:50%;border:2px solid #C4913A;display:block;"/>
          </td>
          <td style="vertical-align:middle;">
            <div style="color:#C4913A;font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:-.01em;">Kshirsagar Hometextiles</div>
            <div style="color:rgba(255,255,255,.70);font-size:9.5px;margin-top:3px;letter-spacing:.04em;">Manufacturers &amp; Exporters of Hometextiles · Crafting Quality Since 1947</div>
            <div style="color:rgba(255,255,255,.40);font-size:9px;margin-top:2px;">+91 98225 49824 · info@kshirsagar.com · terrytowel.in · GST: 27ANLPK9383J1Z8</div>
          </td>
        </tr></table>
      </td>
      <td style="padding:14px 18px;text-align:right;vertical-align:middle;">
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
  <table width="100%" style="margin-top:22px;border-top:1px solid #E3DDD4;padding-top:14px;">
    <tr>
      <td style="vertical-align:middle;">
        <table><tr>
          <td style="vertical-align:middle;padding-right:10px;">
            <img src="${KHT_LOGO}" width="32" height="32" style="border-radius:50%;border:1.5px solid #C4913A;display:block;"/>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:11px;font-weight:700;color:#0D1B2A;">Kshirsagar Hometextiles</div>
            <div style="font-size:8.5px;color:#888;margin-top:1px;">Manufacturers &amp; Exporters of Hometextiles · Crafting Quality Since 1947</div>
          </td>
        </tr></table>
      </td>
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
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="btn btn-out" onClick={() => setShowBulkDrive(true)} style={{ fontSize:13, padding:"9px 18px", gap:6 }}>
            📁 Add from Drive
          </button>
          <button className="btn btn-gold" onClick={printQuotation} style={{ fontSize:14, padding:"10px 22px", gap:6 }}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* Bulk Drive picker */}
      {showBulkDrive && (
        <QuoteDrivePickerModal
          driveUrl={driveUrl}
          multiMode={true}
          onPick={() => {}}
          onPickMulti={handleBulkPick}
          onClose={() => setShowBulkDrive(false)}
        />
      )}

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
            <p style={{ marginTop:2, fontSize:9.5, lineHeight:1.5 }}>Manufacturers &amp; Exporters<br/>of Hometextiles · Since 1947</p>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{titles[active]}</div>
            <div className="topbar-right">
              <span className="topbar-pill">Mfrs &amp; Exporters · Est. 1947</span>
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

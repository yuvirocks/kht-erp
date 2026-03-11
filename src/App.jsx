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
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body, #root { font-family: 'DM Sans', sans-serif; background: #FDFAF4; height: 100vh; overflow: hidden; }

:root {
  --navy: #0D1B2A; --navy-l: #1A2E45; --navy-ll: #243B55;
  --gold: #C9A84C; --gold-l: #E2C47A; --gold-p: #F7EDD0; --gold-pp: #FDFAF4;
  --white: #FFFFFF; --cream: #FDFAF4;
  --text-dark: #1A1A2E; --text-mid: #4A5568; --text-light: #8A9BB0;
  --border: #E8EDF3; --border-l: #F0F4F8;
  --green: #2D7A4F; --red: #C0392B; --blue: #1B6CA8;
}

/* ── LAYOUT ── */
.erp-shell { display: flex; height: 100vh; overflow: hidden; }

/* ── SIDEBAR ── */
.sb { width: 232px; min-width: 232px; background: var(--navy); display: flex; flex-direction: column; position: relative; overflow: hidden; flex-shrink: 0; }
.sb::after { content:''; position:absolute; right:0; top:0; bottom:0; width:1px; background: linear-gradient(to bottom, transparent 0%, #C9A84C44 40%, #C9A84C66 60%, transparent 100%); }
.sb-logo { padding: 22px 20px 18px; border-bottom: 1px solid var(--navy-l); }
.sb-logo h1 { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:700; color:var(--gold); line-height:1.25; letter-spacing:.02em; }
.sb-logo span { display:block; font-size:9px; font-weight:600; color:var(--text-light); letter-spacing:.15em; text-transform:uppercase; margin-top:4px; }
.sb-nav { flex:1; padding:14px 10px; overflow-y:auto; }
.sb-section { font-size:8px; font-weight:700; color:var(--text-light); letter-spacing:.18em; text-transform:uppercase; padding:12px 10px 5px; }
.sb-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; cursor:pointer; margin-bottom:1px; color:#7A8FA8; font-size:12.5px; font-weight:500; transition:all .15s ease; position:relative; user-select:none; }
.sb-item:hover { background:var(--navy-l); color:#BDD0E5; }
.sb-item.active { background:linear-gradient(135deg,#C9A84C22,#C9A84C10); color:var(--gold-l); border:1px solid #C9A84C2A; }
.sb-item.active::before { content:''; position:absolute; left:0; top:22%; bottom:22%; width:3px; border-radius:0 2px 2px 0; background:var(--gold); }
.sb-icon { font-size:15px; width:19px; text-align:center; flex-shrink:0; }
.sb-foot { padding:14px 18px; border-top:1px solid var(--navy-l); }
.sb-foot p { font-size:11px; color:var(--text-light); line-height:1.6; }
.sb-foot strong { color:var(--gold); }

/* ── MAIN ── */
.main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
.topbar { background:var(--white); border-bottom:1px solid var(--border); height:58px; padding:0 26px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
.topbar-title { font-family:'Cormorant Garamond',serif; font-size:21px; font-weight:600; color:var(--text-dark); }
.topbar-right { display:flex; align-items:center; gap:10px; }
.topbar-pill { background:var(--gold-p); color:#8B6914; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; border:1px solid #C9A84C44; letter-spacing:.05em; }
.topbar-av { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--gold-l)); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:var(--navy); }
.content { flex:1; overflow-y:auto; padding:24px 26px; }

/* ── CARDS ── */
.card { background:var(--white); border-radius:11px; border:1px solid var(--border); padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
.card-title { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:600; color:var(--text-dark); margin-bottom:3px; }
.card-sub { font-size:11px; color:var(--text-light); margin-bottom:14px; }

/* ── STAT CARDS ── */
.stat { background:var(--white); border-radius:11px; border:1px solid var(--border); padding:16px 18px; position:relative; overflow:hidden; }
.stat::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; }
.stat.gold::after { background:var(--gold); }
.stat.blue::after { background:var(--blue); }
.stat.green::after { background:var(--green); }
.stat.red::after { background:var(--red); }
.stat-n { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:700; color:var(--text-dark); line-height:1; }
.stat-l { font-size:11.5px; color:var(--text-mid); font-weight:500; margin-top:4px; }
.stat-s { font-size:10px; color:var(--text-light); margin-top:2px; }

/* ── GRIDS ── */
.g2 { display:grid; grid-template-columns:1fr 1fr; gap:15px; }
.g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
.g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; }

/* ── BUTTONS ── */
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:7px; font-size:12.5px; font-weight:600; cursor:pointer; border:none; transition:all .15s; font-family:'DM Sans',sans-serif; white-space:nowrap; }
.btn-gold { background:var(--gold); color:var(--navy); }
.btn-gold:hover { background:var(--gold-l); }
.btn-out { background:transparent; border:1.5px solid var(--border); color:var(--text-mid); }
.btn-out:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-pp); }
.btn-navy { background:var(--navy); color:var(--white); }
.btn-navy:hover { background:var(--navy-l); }
.btn-danger { background:#FEF2F2; color:var(--red); border:1px solid #FCA5A5; }
.btn-success { background:#F0FDF4; color:var(--green); border:1px solid #86EFAC; }
.btn-sm { padding:5px 11px; font-size:11.5px; }
.btn-full { width:100%; justify-content:center; }
.btn:disabled { opacity:.5; cursor:not-allowed; }

/* ── FORM ── */
.inp, .sel, .ta { width:100%; padding:8px 11px; border:1.5px solid var(--border); border-radius:7px; font-size:12.5px; font-family:'DM Sans',sans-serif; color:var(--text-dark); background:var(--white); outline:none; transition:border-color .15s; }
.inp:focus,.sel:focus,.ta:focus { border-color:var(--gold); }
.ta { resize:vertical; min-height:72px; }
.lbl { display:block; font-size:10px; font-weight:700; color:var(--text-mid); letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-bottom:11px; }
.form-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:11px; margin-bottom:11px; }

/* ── TABLE ── */
.tbl { width:100%; border-collapse:collapse; }
.tbl th { text-align:left; font-size:9.5px; font-weight:700; color:var(--text-light); letter-spacing:.12em; text-transform:uppercase; padding:7px 13px; border-bottom:1px solid var(--border); background:#FAFBFC; }
.tbl td { padding:11px 13px; font-size:12.5px; color:var(--text-dark); border-bottom:1px solid var(--border); vertical-align:middle; }
.tbl tr:last-child td { border-bottom:none; }
.tbl tr:hover td { background:#FAFBFC; }

/* ── TAGS ── */
.tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:9.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }
.tag-gold { background:var(--gold-p); color:#8B6914; }
.tag-blue { background:#EFF6FF; color:#1D4ED8; }
.tag-green { background:#F0FDF4; color:#166534; }
.tag-red { background:#FEF2F2; color:#991B1B; }
.tag-gray { background:#F3F4F6; color:#374151; }

/* ── SECTION HEADER ── */
.sh { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.st { font-family:'Cormorant Garamond',serif; font-size:19px; font-weight:600; color:var(--text-dark); }

/* ── DISPATCH SPECIFIC ── */
.paste-area { border:2px dashed #C9A84C66; border-radius:10px; padding:16px; background:#F7EDD022; font-size:12.5px; color:var(--text-mid); font-family:'DM Sans',monospace; outline:none; resize:vertical; min-height:100px; transition:border-color .2s; width:100%; }
.paste-area:focus { border-color:var(--gold); }
.num-badge { width:22px; height:22px; border-radius:50%; background:#C9A84C22; color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
.action-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all .18s; }

/* ── PRINT PREVIEW OVERLAY ── */
.print-overlay { position:fixed; inset:0; background:#111827; z-index:9999; display:flex; flex-direction:column; }
.print-topbar { background:var(--white); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); flex-shrink:0; }
.print-canvas { flex:1; overflow-y:auto; display:flex; flex-direction:column; align-items:center; padding:32px 24px; gap:24px; }

/* ── NOTIFICATION ── */
.notif { position:fixed; top:18px; right:18px; background:var(--navy); color:var(--white); padding:10px 18px; border-radius:8px; font-size:13px; font-weight:500; z-index:99999; border:1px solid var(--gold)44; box-shadow:0 4px 20px rgba(0,0,0,.25); animation:slideIn .2s ease; }
@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

/* ── CONTACTS / CRM ── */
.avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--gold-l)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:var(--navy); flex-shrink:0; }
.cust-row { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; cursor:pointer; transition:background .15s; }
.cust-row:hover { background:#F9FAFB; }
.cust-row.sel { background:var(--gold-pp); border:1px solid #C9A84C33; }

/* ── PRODUCTS ── */
.prod-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(152px,1fr)); gap:13px; }
.prod-card { border:1.5px solid var(--border); border-radius:9px; overflow:hidden; background:var(--white); cursor:pointer; transition:all .18s; }
.prod-card:hover { border-color:var(--gold); transform:translateY(-2px); box-shadow:0 4px 14px rgba(0,0,0,.07); }
.prod-img { width:100%; height:110px; background:linear-gradient(135deg,#f0e8d5,#e8d5b0); display:flex; align-items:center; justify-content:center; font-size:32px; }
.prod-info { padding:9px 11px; }

/* ── DOCUMENTS SPLIT ── */
.doc-split { display:flex; border:1px solid var(--border); border-radius:11px; overflow:hidden; height:calc(100vh - 150px); background:var(--white); }
.doc-left { width:268px; min-width:268px; border-right:1px solid var(--border); overflow-y:auto; padding:10px; background:#FAFBFC; }
.doc-right { flex:1; padding:20px; overflow-y:auto; }
.doc-item { display:flex; align-items:center; gap:9px; padding:9px 11px; border-radius:7px; cursor:pointer; margin-bottom:1px; transition:background .15s; }
.doc-item:hover { background:var(--gold-pp); }
.doc-item.sel { background:var(--gold-p); border:1px solid #C9A84C44; }
.doc-cat-h { font-size:8.5px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--text-light); padding:10px 11px 4px; }

/* ── AI ── */
.ai-box { background:linear-gradient(135deg,#FDFAF4,#F7EDD0); border:1.5px solid #C9A84C55; border-radius:9px; padding:14px; font-size:12.5px; line-height:1.75; color:var(--text-dark); white-space:pre-wrap; min-height:110px; }
.dots { display:inline-flex; gap:3px; }
.dots span { width:5px; height:5px; border-radius:50%; background:var(--gold); animation:pulse 1.2s infinite; }
.dots span:nth-child(2){animation-delay:.2s} .dots span:nth-child(3){animation-delay:.4s}
@keyframes pulse{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}

/* ── WA BUTTON ── */
.wa-btn { display:inline-flex; align-items:center; gap:7px; background:#25D366; color:white; border:none; padding:8px 16px; border-radius:7px; font-size:12.5px; font-weight:600; cursor:pointer; transition:background .2s; font-family:'DM Sans',sans-serif; }
.wa-btn:hover { background:#1EBE58; }

/* ── UTILITY ── */
.divider { border:none; border-top:1px solid var(--border); margin:14px 0; }
.upload-z { border:2px dashed var(--border); border-radius:10px; padding:28px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-z:hover { border-color:var(--gold); background:var(--gold-pp); }
.mt2{margin-top:8px} .mt3{margin-top:12px} .mt4{margin-top:16px}
.mb2{margin-bottom:8px} .mb3{margin-bottom:12px} .mb4{margin-bottom:16px}
.flex{display:flex} .items-c{align-items:center} .justify-b{justify-content:space-between}
.gap2{gap:8px} .gap3{gap:12px} .gap4{gap:16px} .w100{width:100%} .fw6{font-weight:600}
.text-sm{font-size:12px} .text-xs{font-size:10.5px} .text-gold{color:var(--gold)} .text-lt{color:var(--text-light)}
.sticky-top{position:sticky;top:0;z-index:10}

/* ── PRINT ── */
@media print {
  .erp-shell,.print-overlay .print-topbar { display:none !important; }
  .print-overlay { display:block !important; }
  #doc-preview { box-shadow:none !important; margin:0 !important; }
}
`;

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
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, fontWeight: 600, color: "#1A1A2E", display: "flex", alignItems: "center", gap: 10 }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ width: 420, padding: 24 }}>
            <div className="flex justify-b items-c mb4">
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 600 }}>⚙️ Settings</div>
              <button className="btn btn-out btn-sm" onClick={() => setShowSettings(false)}><X size={14} /></button>
            </div>
            <label className="lbl">Google Sheet Webhook URL</label>
            <input className="inp mb4" value={sheetWebhookUrl} onChange={e => setSheetWebhookUrl(e.target.value)} />
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
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 15, fontWeight: 600 }}>Party Details</div>
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
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 15, fontWeight: 600 }}>Sample Items</div>
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
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 15, fontWeight: 600 }}>Dispatch Info</div>
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
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={async () => { await handlePrintForm(); }}
                  className="action-btn"
                  style={{ background: "var(--gold)", color: "var(--navy)" }}
                >
                  <Printer size={18} /> Print Label & Save
                </button>
                <button
                  onClick={handlePrintEnvelope}
                  className="action-btn"
                  style={{ background: "transparent", border: "2px solid var(--gold)", color: "var(--gold)" }}
                >
                  <Mail size={18} /> Print Envelope
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="action-btn"
                  style={{ background: "var(--border-l)", border: "1px solid var(--border)", color: "var(--text-mid)" }}
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
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, fontWeight: 600 }}>Dispatch Log</div>
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
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, fontWeight: 600 }}>All Contacts</div>
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
  const stats = [
    { label: "Orders (Month)", value: "247", sub: "+12% vs last month", c: "gold", target: "dispatch" },
    { label: "Active Customers", value: "84", sub: "5 new this week", c: "blue", target: "crm" },
    { label: "Products Listed", value: "32", sub: "8 categories", c: "green", target: "products" },
    { label: "Pending Dispatch", value: "18", sub: "Due today: 7", c: "red", target: "dispatch" },
  ];
  const recent = [
    { id: "KHT-0291", cust: "Rajesh Mehta", prod: "Bath Towel 450GSM × 50", status: "Dispatched" },
    { id: "KHT-0290", cust: "Sunita Kapoor", prod: "Hand Towel Set × 100", status: "Packing" },
    { id: "KHT-0289", cust: "Amit Sharma", prod: "Bath Mat × 30", status: "Dispatched" },
    { id: "KHT-0288", cust: "Vikram Joshi", prod: "Sports Towel × 25", status: "Pending" },
  ];
  const quickActions = [
    { icon: "🏷️", label: "Print Label", target: "dispatch" },
    { icon: "✉️", label: "Print Envelope", target: "dispatch" },
    { icon: "👥", label: "Add Customer", target: "crm" },
    { icon: "📦", label: "Add Product", target: "products" },
    { icon: "📣", label: "Newsletter", target: "marketing" },
    { icon: "📂", label: "Upload Doc", target: "documents" },
  ];
  return (
    <div>
      <div className="sh">
        <div>
          <div className="st">Good morning 👋 Kshirsagar Hometextiles</div>
          <div className="text-sm text-lt mt2">Here's your business snapshot for today</div>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setActive("dispatch")}>+ New Dispatch</button>
      </div>
      <div className="g4 mb4">
        {stats.map(s => (
          <div key={s.label} className={`stat ${s.c}`} onClick={() => setActive(s.target)} style={{ cursor: "pointer" }}>
            <div className="stat-n">{s.value}</div>
            <div className="stat-l">{s.label}</div>
            <div className="stat-s">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title">Recent Orders</div>
          <div className="card-sub">Latest dispatch activity — click any row to open Dispatch</div>
          <table className="tbl">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(o => (
                <tr key={o.id} onClick={() => setActive("dispatch")} style={{ cursor: "pointer" }}>
                  <td><span className="fw6 text-gold">{o.id}</span></td>
                  <td><div className="fw6">{o.cust}</div><div className="text-xs text-lt">{o.prod}</div></td>
                  <td><span className={`tag ${o.status === "Dispatched" ? "tag-green" : o.status === "Packing" ? "tag-blue" : "tag-red"}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">Quick Actions</div>
          <div className="card-sub">Click any tile to jump to that module</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 4 }}>
            {quickActions.map(({ icon, label, target }) => (
              <div
                key={label}
                className="card"
                style={{ padding: "10px 12px", cursor: "pointer", transition: "border-color .15s, transform .15s" }}
                onClick={() => setActive(target)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsModule() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const cats = ["All", ...new Set(PRODUCTS_DATA.map(p => p.cat))];
  const filtered = PRODUCTS_DATA.filter(p => (filter === "All" || p.cat === filter) && p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="sh"><div className="st">📦 Products Database</div><button className="btn btn-gold btn-sm">+ Add Product</button></div>
      <div className="flex gap3 mb4 items-c" style={{ flexWrap: "wrap" }}>
        <input className="inp" style={{ maxWidth: 220 }} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
        {cats.map(c => <button key={c} className={`btn btn-sm ${filter === c ? "btn-gold" : "btn-out"}`} onClick={() => setFilter(c)}>{c}</button>)}
      </div>
      <div className="flex gap4" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="prod-grid">
            {filtered.map(p => (
              <div key={p.id} className="prod-card" onClick={() => setSelected(p)} style={{ border: selected?.id === p.id ? "2px solid var(--gold)" : undefined }}>
                <div className="prod-img">{p.emoji}</div>
                <div className="prod-info">
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                  <div className="text-xs text-lt">{p.cat}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginTop: 3 }}>{p.price}</div>
                </div>
              </div>
            ))}
            <div className="upload-z" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160, borderRadius: 9 }}>
              <div style={{ fontSize: 28 }}>📸</div>
              <div className="text-xs text-lt mt2">Upload Image</div>
            </div>
          </div>
        </div>
        {selected && (
          <div className="card" style={{ width: 272, flexShrink: 0 }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 10 }}>{selected.emoji}</div>
            <div className="card-title">{selected.name}</div>
            <div className="card-sub">{selected.cat}</div>
            <div className="divider" />
            {[["GSM", selected.gsm + " GSM"], ["Size", selected.sizes], ["Trade Price", selected.price], ["SKU", `KHT-${String(selected.id).padStart(3, "0")}`]].map(([l, v]) => (
              <div key={l} className="flex justify-b mb2"><span className="text-xs text-lt" style={{ textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</span><span className="text-sm fw6">{v}</span></div>
            ))}
            <div className="divider" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <button className="btn btn-gold btn-full">✏️ Edit</button>
              <button className="btn btn-out btn-full">📤 Share</button>
              <button className="btn btn-danger btn-full">🗑️ Delete</button>
            </div>
          </div>
        )}
      </div>
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
    setLoading(true); setAiMsg("");
    const prompt = pitchType === "email"
      ? `Write a professional B2B sales email from Kshirsagar Hometextiles (premium textile manufacturer, Ichalkaranji, Maharashtra) to ${sel.name} at ${sel.biz}. Product: ${product}. Be warm, professional, mention quality, MOQ and invite them to request a sample. 4 paragraphs. Include subject line at the top.`
      : `Write a short friendly WhatsApp message from Kshirsagar Hometextiles to ${sel.name} (${sel.biz}) pitching ${product}. Conversational, key benefits, special offer, CTA. 150 words max. Use emojis naturally.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setAiMsg(data.content?.[0]?.text || "Could not generate.");
    } catch { setAiMsg("Connection error. Please retry."); }
    setLoading(false);
  };

  return (
    <div>
      <div className="sh"><div className="st">👥 CRM & Sales</div><button className="btn btn-gold btn-sm">+ Add Customer</button></div>
      <div className="flex gap4" style={{ alignItems: "flex-start" }}>
        <div className="card" style={{ width: 252, flexShrink: 0 }}>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Customers ({CUSTOMERS.length})</div>
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
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, fontWeight: 700 }}>{sel.name}</div>
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
  const platforms = [{ id: "email", icon: "📧", name: "Email Newsletter" }, { id: "whatsapp", icon: "💚", name: "WhatsApp Status" }, { id: "instagram", icon: "📸", name: "Instagram Post" }];

  const generate = async () => {
    setLoading(true); setContent("");
    const prompts = {
      email: `Write a B2B email newsletter for Kshirsagar Hometextiles announcing their Premium Bath Towel collection. 450 GSM, soft cotton, 12 colors, trade price ₹280. Include subject line, greeting, bullet points, CTA.`,
      whatsapp: `Write 3 WhatsApp status updates for Kshirsagar Hometextiles promoting Premium Bath Towels. Each max 200 chars, include emojis, strong hook. Number them 1, 2, 3.`,
      instagram: `Write an Instagram caption for Kshirsagar Hometextiles new bath towel collection. Hook, benefits, CTA, 20 relevant hashtags.`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompts[platform] }] })
      });
      const data = await res.json();
      setContent(data.content?.[0]?.text || "");
    } catch { setContent("Failed. Please retry."); }
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
          <div className="mb3 mt3"><label className="lbl">Subject / Campaign Name</label><input className="inp" placeholder="e.g. New Collection Launch — Premium Bath Towels" /></div>
          <div className="mb3"><label className="lbl">Target Audience</label><select className="sel"><option>All Customers</option><option>Hot Leads</option><option>Wholesale Buyers</option></select></div>
          <div className="mb4"><label className="lbl">Special Offer (optional)</label><input className="inp" placeholder="e.g. 10% off on 100+ pcs" /></div>
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
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 700 }}>{sel.name}</div>
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
              <div style={{ fontSize: 14, fontFamily: "Cormorant Garamond, serif", fontWeight: 600, marginBottom: 10 }}>Quick Share</div>
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;}
        .lw{min-height:100vh;background:#0D1B2A;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .lw::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,#1A2E4522 0%,transparent 60%),radial-gradient(ellipse at 70% 20%,#C9A84C11 0%,transparent 50%);}
        .lb{background:#fff;border-radius:16px;padding:48px 44px;width:100%;max-width:400px;box-shadow:0 24px 80px rgba(0,0,0,.5);position:relative;z-index:1;border-top:3px solid #C9A84C;}
        .ll h1{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#0D1B2A;line-height:1.2;text-align:center;}
        .ll span{display:block;font-size:10px;font-weight:600;color:#8A9BB0;letter-spacing:.18em;text-transform:uppercase;margin-top:6px;text-align:center;}
        .ld{width:40px;height:2px;background:#C9A84C;margin:12px auto 28px;border-radius:2px;}
        .llbl{display:block;font-size:11px;font-weight:700;color:#4A5568;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;}
        .linp{width:100%;padding:12px 14px;border:1.5px solid #E8EDF3;border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;color:#1A1A2E;outline:none;transition:border-color .15s;letter-spacing:.08em;}
        .linp:focus{border-color:#C9A84C;}
        .linp.err{border-color:#C0392B;background:#FEF2F2;}
        .lbtn{width:100%;padding:13px;background:#C9A84C;color:#0D1B2A;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-top:20px;font-family:'DM Sans',sans-serif;letter-spacing:.04em;transition:background .15s;}
        .lbtn:hover{background:#E2C47A;}
        .lerr{color:#C0392B;font-size:12px;text-align:center;margin-top:10px;font-weight:500;}
        .lft{text-align:center;margin-top:28px;font-size:11px;color:#8A9BB0;}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
        .shake{animation:shake .4s ease;}
      `}</style>
      <div className="lw">
        <div className={`lb ${shake ? "shake" : ""}`}>
          <div className="ll">
            <h1>Kshirsagar<br />Hometextiles</h1>
            <span>Enterprise Dashboard</span>
          </div>
          <div className="ld" />
          <div style={{ marginBottom: 16 }}>
            <label className="llbl">Password</label>
            <input
              className={`linp ${error ? "err" : ""}`}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            {error && <div className="lerr">❌ Incorrect password. Please try again.</div>}
          </div>
          <button className="lbtn" onClick={handleSubmit}>🔐 Sign In</button>
          <div className="lft">terrytowel.in · Secured Access</div>
        </div>
      </div>
    </>
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
    { id: "crm", icon: "👥", label: "CRM & Sales", section: "GROWTH" },
    { id: "marketing", icon: "📣", label: "Marketing" },
    { id: "documents", icon: "📂", label: "Documents", section: "STORAGE" },
  ];

  const titles = { home: "Dashboard Overview", dispatch: "Dispatch Manager", products: "Products Database", crm: "CRM & Sales", marketing: "Marketing Studio", documents: "Document Store" };

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      {notif && <div className="notif">{notif}</div>}
      <div className="erp-shell">
        {/* SIDEBAR */}
        <div className="sb">
          <div className="sb-logo">
            <h1>Kshirsagar<br />Hometextiles</h1>
            <span>Enterprise Dashboard</span>
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
            <p>Logged in as <strong>Admin</strong></p>
            <p style={{ fontSize: 10, marginTop: 2, color: "var(--text-light)" }}>v2.0 · terrytowel.in</p>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{titles[active]}</div>
            <div className="topbar-right">
              <span className="topbar-pill">Kshirsagar Hometextiles</span>
              <div className="topbar-av">KH</div>
            </div>
          </div>
          <div className="content">
            {active === "home" && <HomeModule setActive={setActive} />}
            {active === "dispatch" && <DispatchModule showNotif={showNotif} />}
            {active === "products" && <ProductsModule />}
            {active === "crm" && <CRMModule />}
            {active === "marketing" && <MarketingModule />}
            {active === "documents" && <DocumentsModule />}
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Printer, Save, Plus, Trash2, FileSpreadsheet, Package, 
  ArrowLeft, Settings, X, FileDown, RefreshCw, Database, 
  Users, Send, Scissors, Mail, IndianRupee, LayoutDashboard, 
  Truck, FolderOpen, Search, Megaphone, FileText, Layout 
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CONFIGURATION
═══════════════════════════════════════════════════════════════ */
const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbymS4iJvn2urnKLIyaTw49Xmo0Ltjb0k5_Q1hbNJeLyrfjkcuFMgC04PmJEbx-NY-8B/exec";

/* ═══════════════════════════════════════════════════════════════
   MODULE: CRM & DRIVE AUTOMATION
═══════════════════════════════════════════════════════════════ */
const CRMModule = ({ contacts, fetchCRMData, loading, showNotif }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "", city: "", status: "Lead" });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch(DEFAULT_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "saveContact", data: form })
      });
      showNotif("Syncing", "Creating Google Drive folder...");
      setTimeout(fetchCRMData, 1500);
      setIsModalOpen(false);
    } catch (err) { 
      showNotif("Error", "Cloud sync failed.");
    }
  };

  const filtered = contacts.filter(c => c.company?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="module-card fade-in">
      <div className="section-header">
        <h2 className="section-title"><Users size={20} /> Client Relations</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="search-box glass">
            <Search size={16} />
            <input type="text" placeholder="Search clients..." onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Client</button>
        </div>
      </div>
      <div className="table-container">
        <table className="kht-table">
          <thead><tr><th>Company</th><th>Contact</th><th>City</th><th>Status</th><th>Drive</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-10"><RefreshCw className="spin"/></td></tr> : 
              filtered.map((c, i) => (
                <tr key={i}>
                  <td><strong>{c.company}</strong></td>
                  <td>{c.name}</td>
                  <td>{c.city}</td>
                  <td><span className={`badge badge-${c.status?.toLowerCase()}`}>{c.status}</span></td>
                  <td><a href={c.driveFolder} target="_blank" rel="noreferrer" className="btn-icon"><FolderOpen size={16} color="#0F9D58"/></a></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass fade-in">
            <div className="modal-header"><h3>Add New Client</h3><X className="close-btn" onClick={() => setIsModalOpen(false)} /></div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-grid">
                <input type="text" placeholder="Company Name" className="kht-input" required onChange={e => setForm({...form, company: e.target.value})} />
                <input type="text" placeholder="Contact Person" className="kht-input" onChange={e => setForm({...form, name: e.target.value})} />
                <input type="text" placeholder="City" className="kht-input" onChange={e => setForm({...form, city: e.target.value})} />
                <select className="kht-input" onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Lead">Lead</option><option value="Active">Active</option><option value="Sampling">Sampling</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-4">Save & Create Google Drive Folder</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: FINANCIAL REPORTING
═══════════════════════════════════════════════════════════════ */
const FinancialModule = ({ contacts }) => {
  const [bill, setBill] = useState({ client: "", items: [], taxRate: 12 });
  const subtotal = bill.items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0);
  const tax = (subtotal * bill.taxRate) / 100;

  return (
    <div className="module-card fade-in">
      <div className="section-header"><h2 className="section-title"><IndianRupee size={20} /> Financial Reporting</h2></div>
      <div className="finance-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        <div className="glass-panel p-6">
          <label className="block mb-2 opacity-60">Client Selection</label>
          <select className="kht-input mb-4" onChange={e => setBill({...bill, client: e.target.value})}>
            <option>Select Client from CRM...</option>
            {contacts.map((c, i) => <option key={i} value={c.company}>{c.company}</option>)}
          </select>
          <div className="empty-state text-center py-20 opacity-30">
            <FileText size={48} className="mx-auto mb-4"/>
            <p>Select products to generate Quote</p>
          </div>
        </div>
        <div className="glass-panel p-6" style={{ background: 'rgba(255,255,255,0.3)' }}>
          <h3 className="mb-4">Order Value</h3>
          <div className="summary-row"><span>Subtotal</span> <span>₹{subtotal.toLocaleString()}</span></div>
          <div className="summary-row"><span>GST ({bill.taxRate}%)</span> <span>₹{tax.toLocaleString()}</span></div>
          <hr className="my-4 opacity-10" />
          <div className="summary-row total"><strong>Total</strong> <strong>₹{(subtotal + tax).toLocaleString()}</strong></div>
          <button className="btn btn-primary w-full mt-6" disabled={!bill.client}>
            <FileDown size={18} /> Export PDF to Drive
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP SHELL
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [active, setActive] = useState("home");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);

  const showNotif = (title, message) => {
    setNotif({ title, message });
    setTimeout(() => setNotif(null), 3000);
  };

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${DEFAULT_WEBHOOK_URL}?action=getCRM`);
      const data = await resp.json();
      setContacts(data || []);
    } catch (e) { 
      console.error("Sync Error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchCRMData(); }, []);

  const menu = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={18}/> },
    { id: "crm", label: "CRM", icon: <Users size={18}/> },
    { id: "finance", label: "Financials", icon: <IndianRupee size={18}/> },
    { id: "dispatch", label: "Dispatch", icon: <Truck size={18}/> },
    { id: "products", label: "Inventory", icon: <Package size={18}/> },
    { id: "marketing", label: "Marketing", icon: <Megaphone size={18}/> }
  ];

  return (
    <div className="app-container">
      {notif && (
        <div className="notification glass fade-in">
          <strong>{notif.title}</strong>
          <p>{notif.message}</p>
        </div>
      )}

      <div className="sidebar">
        <div className="sb-head">Kshirsagar<span>Hometextiles</span></div>
        <div className="sb-body">
          {menu.map(item => (
            <div key={item.id} className={`sb-item ${active === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)}>
              <span className="sb-icon">{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="sb-foot">
          <p>Admin · Enterprise v2.2</p>
          <p>Solapur HQ · Est. 1947</p>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{active.toUpperCase()}</div>
          <div className="topbar-right">
            <span className="topbar-pill">CLOUD SYNC ACTIVE</span>
            <div className="topbar-av">KH</div>
          </div>
        </div>
        <div className="content">
          {active === "home" && (
            <div className="fade-in">
              <h2 className="section-title">Operations Hub</h2>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div className="glass-panel p-6">
                  <div className="flex justify-between items-start">
                    <div><h4 className="opacity-60 text-sm">Total Clients</h4><p className="text-3xl font-bold mt-1">{contacts.length}</p></div>
                    <Users size={24} className="opacity-20"/>
                  </div>
                </div>
                <div className="glass-panel p-6">
                  <div className="flex justify-between items-start">
                    <div><h4 className="opacity-60 text-sm">Active Inventory</h4><p className="text-3xl font-bold mt-1">Live</p></div>
                    <Package size={24} className="opacity-20"/>
                  </div>
                </div>
                <div className="glass-panel p-6">
                  <div className="flex justify-between items-start">
                    <div><h4 className="opacity-60 text-sm">Cloud Database</h4><p className="text-xl font-bold mt-1">Google Sheet</p></div>
                    <Database size={24} className="opacity-20"/>
                  </div>
                </div>
              </div>
            </div>
          )}
          {active === "crm" && <CRMModule contacts={contacts} fetchCRMData={fetchCRMData} loading={loading} showNotif={showNotif} />}
          {active === "finance" && <FinancialModule contacts={contacts} />}
        </div>
      </div>
    </div>
  );
}
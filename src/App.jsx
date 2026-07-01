import { useState, useMemo, useEffect } from "react";
import controls from "./data/controls";

const CHANGE_BADGE = {
  "New in v5":    { bg: "#dcfce7", text: "#166534", dot: "#16a34a" },
  "Enhanced":     { bg: "#dbeafe", text: "#1e40af", dot: "#2563eb" },
  "Renamed":      { bg: "#ede9fe", text: "#6b21a8", dot: "#7c3aed" },
  "Carried Forward": { bg: "#f0fdf4", text: "#166534", dot: "#4ade80" },
};
const RISK_BADGE = {
  CRITICAL: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  HIGH:     { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },
  MEDIUM:   { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" },
  LOW:      { bg: "#dcfce7", text: "#166534", border: "#86efac" },
};
const CAT_COLOR = {
  "General Management":   "#1e40af",
  "Service Management":   "#0f766e",
  "Technical Management": "#7c3aed",
  "AI Governance":        "#166534",
  "Digital Product":      "#b45309",
};
const DTABS = ["overview","advisory","assurance","regulatory"];
const DTAB_LABEL = { overview:"Overview", advisory:"Advisory", assurance:"Assurance", regulatory:"Regulatory" };
const DTAB_LABEL_FULL = { overview:"Overview", advisory:"Advisory Guidance", assurance:"Assurance Testing", regulatory:"Regulatory Mapping" };

export default function App() {
  const [search, setSearch]       = useState("");
  const [catFilter, setCat]       = useState("All");
  const [chgFilter, setChg]       = useState("All");
  const [riskFilter, setRisk]     = useState("All");
  const [selected, setSelected]   = useState(null);
  const [activeTab, setActiveTab] = useState("controls");
  const [findings, setFindings]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showTop, setShowTop]     = useState(false);
  const [toast, setToast]         = useState("");
  const [newFinding, setNewFinding] = useState({
    ref: "", title: "", domain: "", severity: "P2 - HIGH",
    description: "", recommendation: "", owner: "", targetDate: "", status: "Open"
  });
  const [detailTab, setDetailTab] = useState("overview");

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function flashToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  const categories = ["All", ...new Set(controls.map(c => c.category))];
  const changeTypes = ["All", "New in v5", "Enhanced", "Renamed", "Carried Forward"];
  const riskLevels  = ["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const filtered = useMemo(() => controls.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s ||
      c.practice.toLowerCase().includes(s) ||
      c.v5Purpose.toLowerCase().includes(s) ||
      c.keyChanges.toLowerCase().includes(s) ||
      c.ref.toLowerCase().includes(s);
    const matchCat  = catFilter  === "All" || c.category  === catFilter;
    const matchChg  = chgFilter  === "All" || c.changeType === chgFilter;
    const matchRisk = riskFilter === "All" || c.riskRating === riskFilter;
    return matchSearch && matchCat && matchChg && matchRisk;
  }), [search, catFilter, chgFilter, riskFilter]);

  const stats = {
    total:    controls.length,
    critical: controls.filter(c => c.riskRating === "CRITICAL").length,
    newV5:    controls.filter(c => c.changeType === "New in v5").length,
    enhanced: controls.filter(c => c.changeType === "Enhanced").length,
  };

  const reviewedCount = new Set(findings.map(f => f.domain)).size;
  const progressPct = Math.min(100, Math.round((reviewedCount / controls.length) * 100));

  function addFinding() {
    if (!newFinding.ref || !newFinding.title) { flashToast("Ref and Title are required"); return; }
    setFindings(f => [...f, { ...newFinding, id: Date.now() }]);
    setNewFinding({ ref:"", title:"", domain:"", severity:"P2 - HIGH", description:"", recommendation:"", owner:"", targetDate:"", status:"Open" });
    setShowForm(false);
    flashToast("Finding saved");
  }

  function deleteFinding(id) {
    setFindings(f => f.filter(x => x.id !== id));
    flashToast("Finding removed");
  }

  function exportFindingsCSV() {
    if (findings.length === 0) { flashToast("No findings to export"); return; }
    const headers = ["Ref","Title","Domain","Severity","Status","Description","Recommendation","Owner"];
    const rows = findings.map(f => [f.ref,f.title,f.domain,f.severity,f.status,f.description,f.recommendation,f.owner]
      .map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "itil-v5-findings.csv"; a.click();
    URL.revokeObjectURL(url);
    flashToast("CSV exported");
  }

  function copyControlLink(ref) {
    const url = `${window.location.origin}${window.location.pathname}#${ref}`;
    navigator.clipboard?.writeText(url);
    flashToast("Link copied: " + ref);
  }

  function selectControl(c) {
    const isSame = selected?.ref === c.ref;
    setSelected(isSame ? null : c);
    setDetailTab("overview");
    if (!isSame) window.history.replaceState(null, "", `#${c.ref}`);
  }

  return (
    <div className="app-shell">
      {toast && (
        <div style={{ position:"fixed", top:14, left:"50%", transform:"translateX(-50%)", zIndex:100,
          background:"#0f172a", color:"#fff", padding:"10px 18px", borderRadius:8, fontSize:13, fontWeight:600,
          boxShadow:"0 4px 16px rgba(0,0,0,.3)" }}>
          {toast}
        </div>
      )}

      {/* ── TOP NAV ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">v5</div>
          <div style={{ minWidth:0 }}>
            <div className="topbar-title">ITIL v5 Risk Control Matrix</div>
            <div className="topbar-sub">Advisory &amp; Assurance Assessment Tool</div>
          </div>
        </div>
        <nav className="topnav">
          {[["controls","Controls"],["compare","v4 vs v5"],["findings","Findings Tracker"]].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              style={{ background: activeTab===k ? "#e85d26" : "transparent", color: activeTab===k ? "#fff" : "#94a3b8" }}>
              {l}
            </button>
          ))}
        </nav>
        <button className="hamburger" onClick={()=>setFiltersOpen(o=>!o)} aria-label="Menu">☰</button>
      </header>

      {/* ── STATS BAR ── */}
      <div className="statsbar">
        {[
          ["Total Controls", stats.total, "#60a5fa"],
          ["Critical Risk", stats.critical, "#f87171"],
          ["New in v5", stats.newV5, "#4ade80"],
          ["Enhanced", stats.enhanced, "#818cf8"],
          ["Showing", filtered.length, "#fbbf24"],
          ["Findings", findings.length, "#f472b6"],
        ].map(([label, val, color]) => (
          <div key={label} className="stat-item">
            <div className="stat-val" style={{ color }}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <main className="main-wrap">

        {/* ════════════════════ CONTROLS TAB ════════════════════ */}
        {activeTab === "controls" && (
          <div className="layout">

            <aside className={`sidebar ${filtersOpen ? "filters-open" : ""}`}>
              <button className="mobile-filter-toggle" onClick={()=>setFiltersOpen(o=>!o)}>
                <span>🔍 Search &amp; Filters</span>
                <span>{filtersOpen ? "▲" : "▼"}</span>
              </button>

              <div className="panel search-panel">
                <div className="panel-title">🔍 Search</div>
                <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search controls, ref, keyword…"/>
              </div>
              {[
                ["Category", categories, catFilter, setCat],
                ["Change Type", changeTypes, chgFilter, setChg],
                ["Risk Level", riskLevels, riskFilter, setRisk],
              ].map(([label, opts, val, set]) => (
                <div key={label} className="panel">
                  <div className="panel-title">{label}</div>
                  {opts.map(o => (
                    <button key={o} onClick={() => set(o)} className={`filter-btn ${val===o ? "active":""}`}>
                      {o}
                    </button>
                  ))}
                </div>
              ))}

              {(search || catFilter!=="All" || chgFilter!=="All" || riskFilter!=="All") && (
                <button onClick={()=>{setSearch("");setCat("All");setChg("All");setRisk("All");}}
                  style={{ width:"100%", padding:"9px", borderRadius:8, border:"1px solid #fca5a5", background:"#fee2e2",
                    color:"#991b1b", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  ✕ Clear All Filters
                </button>
              )}
            </aside>

            <div className="content">
              {filtered.length === 0 && (
                <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>No controls match your filters.</div>
              )}
              {filtered.map(c => {
                const chg  = CHANGE_BADGE[c.changeType] || CHANGE_BADGE["Enhanced"];
                const risk = RISK_BADGE[c.riskRating]   || RISK_BADGE["MEDIUM"];
                const catCol = CAT_COLOR[c.category] || "#374151";
                const isSelected = selected?.ref === c.ref;
                return (
                  <div key={c.ref} id={c.ref} className={`control-card ${isSelected ? "selected":""}`}
                    onClick={() => selectControl(c)}>
                    <div className="card-top">
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="card-badges">
                          <span className="badge" style={{ fontFamily:"monospace", color:"#64748b", background:"#f1f5f9" }}>{c.ref}</span>
                          <span className="badge" style={{ color: catCol, background: catCol+"15" }}>{c.category}</span>
                          <span className="badge" style={{ color: chg.text, background: chg.bg, display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ width:6, height:6, borderRadius:"50%", background: chg.dot, display:"inline-block" }}/>
                            {c.changeType}
                          </span>
                          <span className="badge" style={{ color: risk.text, background: risk.bg, border:`1px solid ${risk.border}` }}>{c.riskRating} RISK</span>
                        </div>
                        <div className="card-title">{c.practice}</div>
                        {/* FULL TEXT — no truncation */}
                        <div className="card-desc">{c.v5Purpose}</div>
                        {isSelected && <div style={{ marginTop:8, fontSize:12, color:"#e85d26", fontWeight:600 }}>▲ Click to collapse</div>}
                      </div>
                      <div style={{ color:"#94a3b8", fontSize:20, flexShrink:0, marginTop:4 }}>{isSelected ? "▲" : "▼"}</div>
                    </div>

                    {isSelected && (
                      <div style={{ marginTop:20, borderTop:"1px solid #f1f5f9", paddingTop:20 }} onClick={e=>e.stopPropagation()}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                          <div className="detail-tabs">
                            {DTABS.map(t => (
                              <button key={t} onClick={()=>setDetailTab(t)} className="detail-tab-btn"
                                style={{ background: detailTab===t ? "#0f172a" : "#f1f5f9", color: detailTab===t ? "#fff" : "#374151" }}>
                                <span className="full-only">{DTAB_LABEL_FULL[t]}</span>
                                <span className="short-only">{DTAB_LABEL[t]}</span>
                              </button>
                            ))}
                          </div>
                          <button onClick={()=>copyControlLink(c.ref)}
                            style={{ fontSize:11, fontWeight:600, color:"#64748b", background:"#f1f5f9", border:"none",
                              borderRadius:6, padding:"6px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>
                            🔗 Copy Link
                          </button>
                        </div>

                        {detailTab === "overview" && (
                          <div className="info-grid">
                            <InfoBox label="v4 Position" text={c.v4Position} color="#dbeafe" border="#93c5fd"/>
                            <InfoBox label="v5 Position" text={c.v5Purpose}  color="#fef9c3" border="#fde68a"/>
                            <InfoBox label="Gap (v4 → v5)" text={c.gap} color="#ffedd5" border="#fed7aa" span2/>
                            <InfoBox label="Key v5 Changes" text={c.keyChanges} color="#f0fdf4" border="#86efac"/>
                            <InfoBox label="Risk if NOT Transitioned" text={c.riskStatement} color="#fee2e2" border="#fca5a5"/>
                          </div>
                        )}

                        {detailTab === "advisory" && (
                          <div>
                            <InfoBox label="Advisory Guidance — Transition Actions" text={c.advisoryGuidance} color="#f0fdf4" border="#86efac" full/>
                            <div style={{ marginTop:16, padding:14, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                              <div className="info-label">Evidence to Request</div>
                              <div className="info-text">{c.evidenceToRequest}</div>
                            </div>
                          </div>
                        )}

                        {detailTab === "assurance" && (
                          <div className="info-grid-3">
                            <InfoBox label="Test of Design (ToD)" text={c.tod} color="#ede9fe" border="#c4b5fd"/>
                            <InfoBox label="Test of Implementation (ToI)" text={c.toi} color="#dbeafe" border="#93c5fd"/>
                            <InfoBox label="Test of Operating Effectiveness (ToE)" text={c.toe} color="#ccfbf1" border="#5eead4"/>
                          </div>
                        )}

                        {detailTab === "regulatory" && (
                          <div className="info-grid">
                            <InfoBox label="🇮🇳 Indian Regulations" text={c.indianRegs} color="#fff7ed" border="#fed7aa"/>
                            <InfoBox label="🌐 Global Regulations" text={c.globalRegs} color="#eff6ff" border="#bfdbfe"/>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════ v4 vs v5 COMPARE TAB ════════════════════ */}
        {activeTab === "compare" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>ITIL v4 vs v5 — Side-by-Side Comparison</h2>
              <p style={{ color:"#64748b", fontSize:14 }}>All 34 practices showing what changed from v4 to v5 (scroll table sideways on small screens)</p>
            </div>

            {/* Desktop table — full text */}
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr style={{ background:"#0f172a" }}>
                    {["#","Practice","Category","v4 Name","v5 Name","Change","Key Delta"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {controls.map((c,i) => {
                    const chg = CHANGE_BADGE[c.changeType] || CHANGE_BADGE["Enhanced"];
                    const catCol = CAT_COLOR[c.category] || "#374151";
                    const isNew = c.changeType === "New in v5";
                    return (
                      <tr key={c.ref} style={{ background: isNew ? "#f0fdf4" : (i%2===0 ? "#fff" : "#f8fafc"), borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ color:"#94a3b8", fontSize:11, fontWeight:600 }}>{i+1}</td>
                        <td style={{ fontWeight:700, color: isNew ? "#166534" : "#1e293b" }}>{c.practice}</td>
                        <td><span className="badge" style={{ color:catCol, background:catCol+"15" }}>{c.category}</span></td>
                        <td style={{ color:"#1d4ed8", fontSize:12 }}>{c.v4Name || (isNew ? "No v4 equivalent" : c.practice)}</td>
                        <td style={{ color:"#7c3aed", fontSize:12, fontWeight:600 }}>{c.practice}{c.changeType==="Renamed" ? " ← RENAMED" : ""}</td>
                        <td><span className="badge" style={{ color:chg.text, background:chg.bg }}>{c.changeType}</span></td>
                        <td style={{ fontSize:12, color:"#64748b", maxWidth:340 }}>{c.keyChanges}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — full text, no table scrolling needed */}
            <div className="compare-cards">
              {controls.map((c,i) => {
                const chg = CHANGE_BADGE[c.changeType] || CHANGE_BADGE["Enhanced"];
                const catCol = CAT_COLOR[c.category] || "#374151";
                const isNew = c.changeType === "New in v5";
                return (
                  <div key={c.ref} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:16, marginBottom:12 }}>
                    <div className="card-badges">
                      <span className="badge" style={{ color:catCol, background:catCol+"15" }}>{c.category}</span>
                      <span className="badge" style={{ color:chg.text, background:chg.bg }}>{c.changeType}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>{c.practice}</div>
                    <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>
                      <strong>v4:</strong> {c.v4Name || (isNew ? "No v4 equivalent" : c.practice)}
                    </div>
                    <div style={{ fontSize:12, color:"#374151", lineHeight:1.6 }}>{c.keyChanges}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════ FINDINGS TRACKER TAB ════════════════════ */}
        {activeTab === "findings" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:12 }}>
              <div>
                <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Findings Tracker</h2>
                <p style={{ color:"#64748b", fontSize:14 }}>{findings.length} finding{findings.length!==1?"s":""} recorded</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={exportFindingsCSV}
                  style={{ background:"#fff", color:"#374151", border:"1px solid #e2e8f0", padding:"10px 16px", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                  ⬇ Export CSV
                </button>
                <button onClick={()=>setShowForm(true)}
                  style={{ background:"#e85d26", color:"#fff", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:14 }}>
                  + Add Finding
                </button>
              </div>
            </div>

            {/* Assessment progress */}
            <div className="panel" style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Assessment Coverage</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#e85d26" }}>{reviewedCount} / {controls.length} domains touched ({progressPct}%)</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width:`${progressPct}%`, background:"#e85d26" }}/></div>
            </div>

            {showForm && (
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:20, marginBottom:20, boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}>
                <h3 style={{ fontWeight:700, marginBottom:16, fontSize:16 }}>New Finding</h3>
                <div className="finding-form-grid3">
                  {[["ref","Finding Ref (e.g. F-001)"],["title","Finding Title"],["domain","Domain / Practice"]].map(([k,p]) => (
                    <div className="form-field" key={k}>
                      <label>{p}</label>
                      <input value={newFinding[k]} onChange={e=>setNewFinding(f=>({...f,[k]:e.target.value}))} placeholder={p}/>
                    </div>
                  ))}
                </div>
                <div className="finding-form-grid3">
                  {[["severity","Severity",["P1 - CRITICAL","P2 - HIGH","P3 - MEDIUM","P4 - LOW"]],
                    ["status","Status",["Open","In Progress","Closed"]]].map(([k,p,opts]) => (
                    <div className="form-field" key={k}>
                      <label>{p}</label>
                      <select value={newFinding[k]} onChange={e=>setNewFinding(f=>({...f,[k]:e.target.value}))}>
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="form-field">
                    <label>Owner</label>
                    <input value={newFinding.owner} onChange={e=>setNewFinding(f=>({...f,owner:e.target.value}))} placeholder="Owner name"/>
                  </div>
                </div>
                {[["description","Observation / Finding Description"],["recommendation","Recommendation"]].map(([k,p]) => (
                  <div className="form-field" key={k} style={{ marginBottom:14 }}>
                    <label>{p}</label>
                    <textarea value={newFinding[k]} onChange={e=>setNewFinding(f=>({...f,[k]:e.target.value}))} rows={3} placeholder={p} style={{ resize:"vertical" }}/>
                  </div>
                ))}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={addFinding} style={{ background:"#e85d26", color:"#fff", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:700 }}>Save Finding</button>
                  <button onClick={()=>setShowForm(false)} style={{ background:"#f1f5f9", color:"#374151", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
                </div>
              </div>
            )}

            {findings.length === 0 && !showForm && (
              <div style={{ textAlign:"center", padding:60, background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", color:"#94a3b8" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontWeight:600, fontSize:16, marginBottom:6 }}>No findings yet</div>
                <div style={{ fontSize:14 }}>Tap "+ Add Finding" to record an assessment finding</div>
              </div>
            )}

            {findings.map(f => {
              const sev = f.severity.startsWith("P1") ? { bg:"#fee2e2",text:"#991b1b" }
                : f.severity.startsWith("P2") ? { bg:"#ffedd5",text:"#9a3412" }
                : f.severity.startsWith("P3") ? { bg:"#fef9c3",text:"#854d0e" }
                : { bg:"#dcfce7", text:"#166534" };
              const stBg = f.status==="Open" ? "#fee2e2" : f.status==="In Progress" ? "#fef9c3" : "#dcfce7";
              const stTx = f.status==="Open" ? "#991b1b" : f.status==="In Progress" ? "#854d0e" : "#166534";
              return (
                <div key={f.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:18, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <span className="badge" style={{ fontFamily:"monospace", color:"#64748b", background:"#f1f5f9" }}>{f.ref}</span>
                      <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{f.title}</span>
                      <span style={{ fontSize:12, color:"#64748b" }}>{f.domain}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span className="badge" style={{ color:sev.text, background:sev.bg }}>{f.severity}</span>
                      <span className="badge" style={{ color:stTx, background:stBg }}>{f.status}</span>
                      <button onClick={()=>deleteFinding(f.id)} title="Delete finding"
                        style={{ background:"none", border:"none", color:"#cbd5e1", cursor:"pointer", fontSize:16 }}>✕</button>
                    </div>
                  </div>
                  {f.description && <div style={{ fontSize:13, color:"#374151", marginBottom:8 }}><strong>Observation:</strong> {f.description}</div>}
                  {f.recommendation && <div style={{ fontSize:13, color:"#374151", marginBottom:8 }}><strong>Recommendation:</strong> {f.recommendation}</div>}
                  {f.owner && <div style={{ fontSize:12, color:"#64748b" }}>Owner: {f.owner}</div>}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showTop && (
        <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
          style={{ position:"fixed", right:18, bottom: window.innerWidth<=860 ? 78 : 24, zIndex:55,
            width:44, height:44, borderRadius:"50%", border:"none", background:"#0f172a", color:"#fff",
            fontSize:18, cursor:"pointer", boxShadow:"0 4px 12px rgba(0,0,0,.3)" }}>
          ↑
        </button>
      )}

      {/* Mobile bottom nav */}
      <nav className="mobile-tabbar">
        {[["controls","📋","Controls"],["compare","🔄","v4 vs v5"],["findings","📝","Findings"]].map(([k,icon,l]) => (
          <button key={k} className={activeTab===k ? "active":""} onClick={()=>{ setActiveTab(k); setFiltersOpen(false); }}>
            <span className="icon">{icon}</span>
            <span>{l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function InfoBox({ label, text, color, border, span2, full }) {
  return (
    <div className={`info-box ${span2 ? "span2":""}`}
      style={{ gridColumn: full ? "1 / -1" : undefined, background: color, border: `1px solid ${border}` }}>
      <div className="info-label">{label}</div>
      <div className="info-text">{text}</div>
    </div>
  );
}

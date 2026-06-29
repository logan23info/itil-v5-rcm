import { useState, useMemo } from "react";
import controls from "./data/controls";

// ── colour helpers ────────────────────────────────────────────────────────────
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

export default function App() {
  const [search, setSearch]       = useState("");
  const [catFilter, setCat]       = useState("All");
  const [chgFilter, setChg]       = useState("All");
  const [riskFilter, setRisk]     = useState("All");
  const [selected, setSelected]   = useState(null);
  const [activeTab, setActiveTab] = useState("controls");
  const [findings, setFindings]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [newFinding, setNewFinding] = useState({
    ref: "", title: "", domain: "", severity: "P2 - HIGH",
    description: "", recommendation: "", owner: "", targetDate: "", status: "Open"
  });
  const [detailTab, setDetailTab] = useState("overview");

  const categories = ["All", ...new Set(controls.map(c => c.category))];
  const changeTypes = ["All", "New in v5", "Enhanced", "Renamed", "Carried Forward"];
  const riskLevels  = ["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const filtered = useMemo(() => controls.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s ||
      c.practice.toLowerCase().includes(s) ||
      c.v5Purpose.toLowerCase().includes(s) ||
      c.keyChanges.toLowerCase().includes(s);
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

  function addFinding() {
    setFindings(f => [...f, { ...newFinding, id: Date.now() }]);
    setNewFinding({ ref:"", title:"", domain:"", severity:"P2 - HIGH", description:"", recommendation:"", owner:"", targetDate:"", status:"Open" });
    setShowForm(false);
  }

  const DTABS = ["overview","advisory","assurance","regulatory"];
  const DTAB_LABEL = { overview:"Overview", advisory:"Advisory Guidance", assurance:"Assurance Testing", regulatory:"Regulatory Mapping" };

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", minHeight:"100vh", background:"#f8fafc", color:"#1e293b" }}>

      {/* ── TOP NAV ── */}
      <header style={{ background:"#0f172a", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 3px rgba(0,0,0,.4)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:38, height:38, background:"#e85d26", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#fff", fontSize:16 }}>v5</div>
          <div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:16, lineHeight:1.2 }}>ITIL v5 Risk Control Matrix</div>
            <div style={{ color:"#94a3b8", fontSize:11 }}>Advisory & Assurance Assessment Tool</div>
          </div>
        </div>
        <nav style={{ display:"flex", gap:4 }}>
          {[["controls","Controls"],["compare","v4 vs v5"],["findings","Findings Tracker"]].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              style={{ padding:"8px 16px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:500,
                background: activeTab===k ? "#e85d26" : "transparent",
                color: activeTab===k ? "#fff" : "#94a3b8" }}>
              {l}
            </button>
          ))}
        </nav>
      </header>

      {/* ── STATS BAR ── */}
      <div style={{ background:"#1e293b", padding:"16px 32px", display:"flex", gap:32 }}>
        {[
          ["Total Controls", stats.total, "#60a5fa"],
          ["Critical Risk", stats.critical, "#f87171"],
          ["New in v5", stats.newV5, "#4ade80"],
          ["Significantly Enhanced", stats.enhanced, "#818cf8"],
          ["Showing", filtered.length, "#fbbf24"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ textAlign:"center" }}>
            <div style={{ color, fontWeight:800, fontSize:26, lineHeight:1 }}>{val}</div>
            <div style={{ color:"#94a3b8", fontSize:11, marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>

      <main style={{ padding:"24px 32px", maxWidth:1400, margin:"0 auto" }}>

        {/* ════════════════════ CONTROLS TAB ════════════════════ */}
        {activeTab === "controls" && (
          <div style={{ display:"flex", gap:24 }}>

            {/* ── SIDEBAR ── */}
            <aside style={{ width:220, flexShrink:0 }}>
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:18, marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:12, color:"#374151" }}>🔍 Search</div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search controls…"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" }}/>
              </div>
              {[
                ["Category", categories, catFilter, setCat],
                ["Change Type", changeTypes, chgFilter, setChg],
                ["Risk Level", riskLevels, riskFilter, setRisk],
              ].map(([label, opts, val, set]) => (
                <div key={label} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:18, marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:"#374151" }}>{label}</div>
                  {opts.map(o => (
                    <button key={o} onClick={() => set(o)}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 10px", borderRadius:6, border:"none",
                        cursor:"pointer", fontSize:12, marginBottom:3,
                        background: val===o ? "#eff6ff" : "transparent",
                        color: val===o ? "#1d4ed8" : "#374151",
                        fontWeight: val===o ? 700 : 400 }}>
                      {o}
                    </button>
                  ))}
                </div>
              ))}
            </aside>

            {/* ── CONTROLS LIST ── */}
            <div style={{ flex:1, minWidth:0 }}>
              {filtered.length === 0 && (
                <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>No controls match your filters.</div>
              )}
              {filtered.map(c => {
                const chg  = CHANGE_BADGE[c.changeType] || CHANGE_BADGE["Enhanced"];
                const risk = RISK_BADGE[c.riskRating]   || RISK_BADGE["MEDIUM"];
                const catCol = CAT_COLOR[c.category] || "#374151";
                const isSelected = selected?.ref === c.ref;
                return (
                  <div key={c.ref} onClick={() => { setSelected(isSelected ? null : c); setDetailTab("overview"); }}
                    style={{ background:"#fff", borderRadius:12, border: isSelected ? "2px solid #e85d26" : "1px solid #e2e8f0",
                      padding:"18px 22px", marginBottom:12, cursor:"pointer",
                      boxShadow: isSelected ? "0 0 0 3px #fde8de" : "0 1px 3px rgba(0,0,0,.05)",
                      transition:"all .15s" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:"#64748b",
                            background:"#f1f5f9", padding:"2px 7px", borderRadius:4 }}>{c.ref}</span>
                          <span style={{ fontSize:11, fontWeight:600, color: catCol,
                            background: catCol+"15", padding:"2px 8px", borderRadius:12 }}>{c.category}</span>
                          <span style={{ fontSize:11, fontWeight:700, color: chg.text,
                            background: chg.bg, padding:"2px 8px", borderRadius:12,
                            display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ width:6, height:6, borderRadius:"50%", background: chg.dot, display:"inline-block" }}/>
                            {c.changeType}
                          </span>
                          <span style={{ fontSize:11, fontWeight:700, color: risk.text,
                            background: risk.bg, border:`1px solid ${risk.border}`,
                            padding:"2px 8px", borderRadius:12 }}>{c.riskRating} RISK</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:15, color:"#1e293b", marginBottom:5 }}>{c.practice}</div>
                        <div style={{ fontSize:13, color:"#64748b", lineHeight:1.5 }}>{c.v5Purpose.slice(0,180)}{c.v5Purpose.length>180?"…":""}</div>
                        {isSelected && (
                          <div style={{ marginTop:8, fontSize:12, color:"#e85d26", fontWeight:600 }}>▲ Click to collapse</div>
                        )}
                      </div>
                      <div style={{ color:"#94a3b8", fontSize:20, flexShrink:0, marginTop:4 }}>{isSelected ? "▲" : "▼"}</div>
                    </div>

                    {/* ── DETAIL PANEL ── */}
                    {isSelected && (
                      <div style={{ marginTop:20, borderTop:"1px solid #f1f5f9", paddingTop:20 }} onClick={e=>e.stopPropagation()}>
                        <div style={{ display:"flex", gap:4, marginBottom:20 }}>
                          {DTABS.map(t => (
                            <button key={t} onClick={()=>setDetailTab(t)}
                              style={{ padding:"7px 14px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                                background: detailTab===t ? "#0f172a" : "#f1f5f9",
                                color: detailTab===t ? "#fff" : "#374151" }}>
                              {DTAB_LABEL[t]}
                            </button>
                          ))}
                        </div>

                        {detailTab === "overview" && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                            <InfoBox label="v4 Position" text={c.v4Position} color="#dbeafe" border="#93c5fd"/>
                            <InfoBox label="v5 Position" text={c.v5Purpose}  color="#fef9c3" border="#fde68a"/>
                            <InfoBox label="Gap (v4 → v5)" text={c.gap} color="#ffedd5" border="#fed7aa" colSpan={2}/>
                            <InfoBox label="Key v5 Changes" text={c.keyChanges} color="#f0fdf4" border="#86efac"/>
                            <InfoBox label="Risk if NOT Transitioned" text={c.riskStatement} color="#fee2e2" border="#fca5a5"/>
                          </div>
                        )}

                        {detailTab === "advisory" && (
                          <div>
                            <InfoBox label="Advisory Guidance — Transition Actions" text={c.advisoryGuidance} color="#f0fdf4" border="#86efac" colSpan={2}/>
                            <div style={{ marginTop:16, padding:14, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Evidence to Request</div>
                              <div style={{ fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{c.evidenceToRequest}</div>
                            </div>
                          </div>
                        )}

                        {detailTab === "assurance" && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                            <InfoBox label="Test of Design (ToD) — What to Inspect" text={c.tod} color="#ede9fe" border="#c4b5fd"/>
                            <InfoBox label="Test of Implementation (ToI) — Verify it Exists" text={c.toi} color="#dbeafe" border="#93c5fd"/>
                            <InfoBox label="Test of Operating Effectiveness (ToE) — Prove it Works" text={c.toe} color="#ccfbf1" border="#5eead4"/>
                          </div>
                        )}

                        {detailTab === "regulatory" && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
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
              <p style={{ color:"#64748b", fontSize:14 }}>All 34 practices showing what changed from v4 to v5</p>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.08)" }}>
                <thead>
                  <tr style={{ background:"#0f172a" }}>
                    {["#","Practice","Category","v4 Practice Name","v5 Practice Name","Change Type","Key Delta"].map(h => (
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#94a3b8", fontWeight:600, fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {controls.filter(c=>c.changeType !== "New in v5").map((c,i) => {
                    const chg = CHANGE_BADGE[c.changeType] || CHANGE_BADGE["Enhanced"];
                    const catCol = CAT_COLOR[c.category] || "#374151";
                    return (
                      <tr key={c.ref} style={{ background: i%2===0 ? "#fff" : "#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:11, fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:"12px 16px", fontWeight:700, color:"#1e293b" }}>{c.practice}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:11, fontWeight:600, color:catCol, background:catCol+"15", padding:"2px 8px", borderRadius:12 }}>{c.category}</span>
                        </td>
                        <td style={{ padding:"12px 16px", color:"#1d4ed8", fontSize:12 }}>{c.v4Name || c.practice}</td>
                        <td style={{ padding:"12px 16px", color:"#7c3aed", fontSize:12, fontWeight:600 }}>{c.practice}{c.changeType==="Renamed" ? " ← RENAMED" : ""}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:chg.text, background:chg.bg, padding:"3px 10px", borderRadius:12 }}>{c.changeType}</span>
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b", maxWidth:280 }}>{c.keyChanges.slice(0,120)}{c.keyChanges.length>120?"…":""}</td>
                      </tr>
                    );
                  })}
                  {controls.filter(c=>c.changeType === "New in v5").map((c,i) => (
                    <tr key={c.ref} style={{ background:"#f0fdf4", borderBottom:"1px solid #bbf7d0" }}>
                      <td style={{ padding:"12px 16px", color:"#16a34a", fontSize:11, fontWeight:700 }}>🆕</td>
                      <td style={{ padding:"12px 16px", fontWeight:700, color:"#166534" }}>{c.practice}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ fontSize:11, fontWeight:600, color:"#166534", background:"#dcfce7", padding:"2px 8px", borderRadius:12 }}>{c.category}</span>
                      </td>
                      <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:12, fontStyle:"italic" }}>No v4 equivalent</td>
                      <td style={{ padding:"12px 16px", color:"#166534", fontSize:12, fontWeight:700 }}>{c.practice}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ fontSize:11, fontWeight:700, color:"#166534", background:"#dcfce7", padding:"3px 10px", borderRadius:12 }}>🆕 New in v5</span>
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:12, color:"#166534" }}>{c.keyChanges.slice(0,120)}{c.keyChanges.length>120?"…":""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════ FINDINGS TRACKER TAB ════════════════════ */}
        {activeTab === "findings" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Findings Tracker</h2>
                <p style={{ color:"#64748b", fontSize:14 }}>{findings.length} finding{findings.length!==1?"s":""} recorded</p>
              </div>
              <button onClick={()=>setShowForm(true)}
                style={{ background:"#e85d26", color:"#fff", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:14 }}>
                + Add Finding
              </button>
            </div>

            {showForm && (
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:24, marginBottom:20, boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}>
                <h3 style={{ fontWeight:700, marginBottom:16, fontSize:16 }}>New Finding</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
                  {[["ref","Finding Ref (e.g. F-001)"],["title","Finding Title"],["domain","Domain / Practice"]].map(([k,p]) => (
                    <div key={k}>
                      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{p}</label>
                      <input value={newFinding[k]} onChange={e=>setNewFinding(f=>({...f,[k]:e.target.value}))}
                        placeholder={p} style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }}/>
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
                  {[["severity","Severity",["P1 - CRITICAL","P2 - HIGH","P3 - MEDIUM","P4 - LOW"]],
                    ["status","Status",["Open","In Progress","Closed"]]].map(([k,p,opts]) => (
                    <div key={k}>
                      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{p}</label>
                      <select value={newFinding[k]} onChange={e=>setNewFinding(f=>({...f,[k]:e.target.value}))}
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }}>
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Owner</label>
                    <input value={newFinding.owner} onChange={e=>setNewFinding(f=>({...f,owner:e.target.value}))}
                      placeholder="Owner name" style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }}/>
                  </div>
                </div>
                {[["description","Observation / Finding Description"],["recommendation","Recommendation"]].map(([k,p]) => (
                  <div key={k} style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{p}</label>
                    <textarea value={newFinding[k]} onChange={e=>setNewFinding(f=>({...f,[k]:e.target.value}))}
                      rows={3} placeholder={p}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", resize:"vertical" }}/>
                  </div>
                ))}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={addFinding}
                    style={{ background:"#e85d26", color:"#fff", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:700 }}>Save Finding</button>
                  <button onClick={()=>setShowForm(false)}
                    style={{ background:"#f1f5f9", color:"#374151", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:600 }}>Cancel</button>
                </div>
              </div>
            )}

            {findings.length === 0 && !showForm && (
              <div style={{ textAlign:"center", padding:60, background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", color:"#94a3b8" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontWeight:600, fontSize:16, marginBottom:6 }}>No findings yet</div>
                <div style={{ fontSize:14 }}>Click "+ Add Finding" to record an assessment finding</div>
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
                <div key={f.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:20, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#64748b", background:"#f1f5f9", padding:"2px 8px", borderRadius:4 }}>{f.ref}</span>
                      <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{f.title}</span>
                      <span style={{ fontSize:12, color:"#64748b" }}>{f.domain}</span>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:sev.text, background:sev.bg, padding:"3px 10px", borderRadius:12 }}>{f.severity}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:stTx, background:stBg, padding:"3px 10px", borderRadius:12 }}>{f.status}</span>
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
    </div>
  );
}

function InfoBox({ label, text, color, border, colSpan }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : "span 1",
      background: color, border: `1px solid ${border}`, borderRadius:10, padding:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>
      <div style={{ fontSize:13, color:"#1e293b", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{text}</div>
    </div>
  );
}

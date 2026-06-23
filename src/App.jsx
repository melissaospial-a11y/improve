import { useState, useEffect, useRef } from "react";

const COLORS = ["#378ADD","#1D9E75","#D85A30","#7F77DD","#BA7517","#D4537E","#639922","#888780"];
const CIRC = 2 * Math.PI * 88;

const DEFAULT_ACTIVITIES = [
  { id: 1, name: "Práctica D1 SAS", color: COLORS[0] },
  { id: 2, name: "Columna destilación", color: COLORS[1] },
  { id: 3, name: "Estudio", color: COLORS[2] },
];

function fmt(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
}

function DonutChart({ data, total }) {
  const size = 180, cx = 90, cy = 90, r = 70, stroke = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.filter(d => d.mins > 0);
  if (!slices.length) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={stroke}/>
      <text x={cx} y={cy-8} textAnchor="middle" fontSize="22" fontWeight="500" fill="var(--color-text-primary)">0</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">pomodoros</text>
    </svg>
  );
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      {slices.map((d, i) => {
        const pct = d.mins / (total || 1);
        const dash = circ * pct;
        const gap = circ - dash;
        const el = (
          <circle key={d.id} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={stroke} strokeLinecap="butt"
            strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
            strokeDashoffset={(-offset).toFixed(2)}/>
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy-8} textAnchor="middle" fontSize="22" fontWeight="500"
        fill="var(--color-text-primary)" style={{transform:"rotate(90deg)",transformOrigin:`${cx}px ${cy}px`}}>
        {total}
      </text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="11"
        fill="var(--color-text-secondary)" style={{transform:"rotate(90deg)",transformOrigin:`${cx}px ${cy}px`}}>
        min totales
      </text>
    </svg>
  );
}

function HBarChart({ data }) {
  if (!data.filter(d=>d.count>0).length) return (
    <p style={{color:"var(--color-text-tertiary)",fontSize:13,textAlign:"center",padding:"1rem 0"}}>Sin registros aún.</p>
  );
  const max = Math.max(...data.map(d => d.mins), 1);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {data.filter(d=>d.count>0).map(d => (
        <div key={d.id}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{d.name}</span>
            <span style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)",marginLeft:8,whiteSpace:"nowrap"}}>{d.mins} min · {d.count} pomo</span>
          </div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:4,height:10,overflow:"hidden"}}>
            <div style={{width:`${(d.mins/max)*100}%`,height:"100%",background:d.color,borderRadius:4,transition:"width 0.5s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineChart({ history, activities }) {
  const last = history.slice(0, 20).reverse();
  if (!last.length) return (
    <p style={{color:"var(--color-text-tertiary)",fontSize:13,textAlign:"center",padding:"1rem 0"}}>Sin registros aún.</p>
  );
  const W = 460, H = 80, pad = 24;
  const n = last.length;
  const step = n > 1 ? (W - pad * 2) / (n - 1) : 0;
  const actMap = {};
  activities.forEach(a => actMap[a.id] = a);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{overflow:"visible"}}>
      {last.map((h, i) => {
        const x = pad + i * step;
        const color = actMap[h.actId]?.color || "#888";
        return (
          <g key={i}>
            <line x1={x} y1={H/2} x2={x} y2={H/2+18} stroke={color} strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx={x} cy={H/2} r={7} fill={color}/>
            <text x={x} y={H/2+32} textAnchor="middle" fontSize="9" fill="var(--color-text-tertiary)">{h.completedAt}</text>
          </g>
        );
      })}
      {n > 1 && (
        <line x1={pad} y1={H/2} x2={pad+(n-1)*step} y2={H/2}
          stroke="var(--color-border-tertiary)" strokeWidth="1" strokeDasharray="4 3"/>
      )}
    </svg>
  );
}

function StackedDayChart({ history, activities }) {
  const actMap = {};
  activities.forEach(a => actMap[a.id] = a);
  const byHour = {};
  history.forEach(h => {
    const hr = h.completedAt ? h.completedAt.split(":")[0] : "?";
    if (!byHour[hr]) byHour[hr] = {};
    byHour[hr][h.actId] = (byHour[hr][h.actId] || 0) + 25;
  });
  const hours = Object.keys(byHour).sort();
  if (!hours.length) return (
    <p style={{color:"var(--color-text-tertiary)",fontSize:13,textAlign:"center",padding:"1rem 0"}}>Sin registros aún.</p>
  );
  const maxVal = Math.max(...hours.map(h => Object.values(byHour[h]).reduce((s,v)=>s+v,0)), 1);
  const H = 100, barW = Math.min(36, Math.floor(320/hours.length)-6);
  return (
    <div style={{overflowX:"auto"}}>
      <svg width={Math.max(400, hours.length*(barW+10)+60)} height={H+30}>
        {hours.map((hr, i) => {
          const x = 30 + i*(barW+10);
          const acts = Object.entries(byHour[hr]);
          let yOff = H;
          return (
            <g key={hr}>
              {acts.map(([actId, mins]) => {
                const h = (mins/maxVal)*(H-10);
                yOff -= h;
                const color = actMap[Number(actId)]?.color || "#888";
                return <rect key={actId} x={x} y={yOff} width={barW} height={h} fill={color} rx="2"/>;
              })}
              <text x={x+barW/2} y={H+16} textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)">{hr}h</text>
            </g>
          );
        })}
        <line x1={28} y1={0} x2={28} y2={H} stroke="var(--color-border-tertiary)" strokeWidth="0.5"/>
        <line x1={28} y1={H} x2="100%" y2={H} stroke="var(--color-border-tertiary)" strokeWidth="0.5"/>
      </svg>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("timer");
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
  const [nextId, setNextId] = useState(10);
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState([]);

  const [selAct, setSelAct] = useState(DEFAULT_ACTIVITIES[0].id);
  const [mode, setMode] = useState("work");
  const DURATIONS = { work: 25*60, short: 5*60, long: 15*60 };
  const LABELS = { work: "Concentración", short: "Descanso corto", long: "Descanso largo" };
  const [remaining, setRemaining] = useState(DURATIONS.work);
  const [running, setRunning] = useState(false);
  const tidRef = useRef(null);
  const totalRef = useRef(DURATIONS.work);

  const [newActName, setNewActName] = useState("");
  const [newActColor, setNewActColor] = useState(COLORS[3]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (running) {
      tidRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(tidRef.current);
            setRunning(false);
            if (mode === "work") {
              const act = activities.find(a => a.id === selAct);
              setStats(prev => {
                const cur = prev[selAct] || { count: 0, mins: 0 };
                return { ...prev, [selAct]: { count: cur.count+1, mins: cur.mins+25 } };
              });
              setHistory(prev => [{
                actId: selAct, actName: act?.name || "—", mode: "work",
                completedAt: new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})
              }, ...prev.slice(0,99)]);
            }
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(tidRef.current);
    }
    return () => clearInterval(tidRef.current);
  }, [running, mode, selAct, activities]);

  function changeMode(m) {
    clearInterval(tidRef.current); setRunning(false);
    setMode(m); totalRef.current = DURATIONS[m]; setRemaining(DURATIONS[m]);
  }
  function toggle() { setRunning(r => !r); }
  function reset() { clearInterval(tidRef.current); setRunning(false); setRemaining(totalRef.current); }

  const frac = remaining / totalRef.current;
  const offset = (CIRC * (1 - frac)).toFixed(2);
  const act = activities.find(a => a.id === selAct) || activities[0];
  const ringColor = mode === "work" ? (act?.color || "#378ADD") : mode === "short" ? "#1D9E75" : "#BA7517";

  const statsData = activities.map(a => ({
    ...a, count: stats[a.id]?.count||0, mins: stats[a.id]?.mins||0
  })).sort((a,b) => b.mins - a.mins);

  const totalMins = Object.values(stats).reduce((s,v)=>s+v.mins,0);
  const totalPomos = Object.values(stats).reduce((s,v)=>s+v.count,0);

  function addActivity() {
    if (!newActName.trim()) return;
    const id = nextId;
    setActivities(prev => [...prev, {id, name: newActName.trim(), color: newActColor}]);
    setNextId(id+1); setNewActName("");
  }
  function deleteActivity(id) {
    setActivities(prev => prev.filter(a => a.id !== id));
    if (selAct === id) setSelAct(activities.find(a=>a.id!==id)?.id);
  }
  function saveEdit(id) {
    setActivities(prev => prev.map(a => a.id===id ? {...a,name:editName} : a));
    setEditId(null);
  }

  const tabStyle = t => ({
    fontSize:13,fontWeight:500,padding:"6px 14px",borderRadius:20,
    border: view===t?"0.5px solid var(--color-border-secondary)":"0.5px solid transparent",
    background: view===t?"var(--color-background-primary)":"transparent",
    color: view===t?"var(--color-text-primary)":"var(--color-text-secondary)",
    cursor:"pointer"
  });
  const modeBtn = m => ({
    fontSize:12,padding:"5px 12px",borderRadius:20,cursor:"pointer",
    border: mode===m?"0.5px solid var(--color-border-secondary)":"0.5px solid var(--color-border-tertiary)",
    background: mode===m?"var(--color-background-secondary)":"transparent",
    color: mode===m?"var(--color-text-primary)":"var(--color-text-secondary)",
    fontWeight: mode===m?500:400
  });

  return (
    <div style={{maxWidth:540,margin:"1.5rem auto",padding:"0 1rem",fontFamily:"var(--font-sans)"}}>
      <h2 className="sr-only">Temporizador Pomodoro por actividades con gráficas de tiempo</h2>

      <div style={{display:"flex",gap:4,marginBottom:"1.5rem",background:"var(--color-background-secondary)",borderRadius:24,padding:4}}>
        <button style={tabStyle("timer")} onClick={()=>setView("timer")}><i className="ti ti-clock" aria-hidden="true" style={{marginRight:5}}/>Temporizador</button>
        <button style={tabStyle("stats")} onClick={()=>setView("stats")}><i className="ti ti-chart-bar" aria-hidden="true" style={{marginRight:5}}/>Estadísticas</button>
        <button style={tabStyle("activities")} onClick={()=>setView("activities")}><i className="ti ti-folder" aria-hidden="true" style={{marginRight:5}}/>Actividades</button>
      </div>

      {view==="timer" && (
        <>
          <div style={{marginBottom:"1rem"}}>
            <label style={{fontSize:12,color:"var(--color-text-secondary)",display:"block",marginBottom:6}}>Actividad activa</label>
            <select value={selAct} onChange={e=>setSelAct(Number(e.target.value))} style={{width:"100%",fontSize:14}}>
              {activities.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:"1.5rem"}}>
            <button style={modeBtn("work")} onClick={()=>changeMode("work")}>Trabajo</button>
            <button style={modeBtn("short")} onClick={()=>changeMode("short")}>Descanso corto</button>
            <button style={modeBtn("long")} onClick={()=>changeMode("long")}>Descanso largo</button>
          </div>

          <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
            <div style={{position:"relative",width:200,height:200,margin:"0 auto"}}>
              <svg width="200" height="200" style={{transform:"rotate(-90deg)"}}>
                <circle cx="100" cy="100" r="88" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="7"/>
                <circle cx="100" cy="100" r="88" fill="none" strokeWidth="7" strokeLinecap="round"
                  stroke={ringColor} strokeDasharray={CIRC.toFixed(2)} strokeDashoffset={offset}
                  style={{transition:"stroke-dashoffset 0.5s,stroke 0.3s"}}/>
              </svg>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                <div style={{fontSize:42,fontWeight:500,letterSpacing:-2,color:"var(--color-text-primary)",lineHeight:1}}>{fmt(remaining)}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:4}}>{LABELS[mode]}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"center",marginTop:4}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:act?.color||"#378ADD"}}/>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{act?.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:"1.5rem"}}>
            <button onClick={toggle} style={{fontSize:14,fontWeight:500,padding:"9px 28px",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
              <i className={`ti ti-player-${running?"pause":"play"}`} aria-hidden="true"/>
              {running?"Pausar":remaining<totalRef.current&&remaining>0?"Continuar":"Iniciar"}
            </button>
            <button onClick={reset} style={{fontSize:14,padding:"9px 14px",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-secondary)",cursor:"pointer"}} aria-label="Reiniciar">
              <i className="ti ti-refresh" aria-hidden="true"/>
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10,marginBottom:"1.5rem"}}>
            {[{label:"Pomodoros",val:totalPomos},{label:"Minutos",val:totalMins},{label:"Actividades",val:activities.length}].map(c=>(
              <div key={c.label} style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{c.label}</div>
                <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)"}}>{c.val}</div>
              </div>
            ))}
          </div>

          {history.length>0 && (
            <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"12px 16px"}}>
              <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Últimos registros</div>
              {history.slice(0,5).map((h,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<4&&i<history.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:activities.find(a=>a.id===h.actId)?.color||"#888",flexShrink:0}}/>
                  <span style={{fontSize:13,color:"var(--color-text-primary)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.actName}</span>
                  <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{h.completedAt}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view==="stats" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:"1.5rem"}}>
            {[
              {label:"Total pomodoros",val:totalPomos},
              {label:"Minutos enfocado",val:totalMins},
              {label:"Horas enfocado",val:(totalMins/60).toFixed(1)},
              {label:"Actividades",val:activities.length}
            ].map(c=>(
              <div key={c.label} style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"12px 14px"}}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}}>{c.label}</div>
                <div style={{fontSize:24,fontWeight:500,color:"var(--color-text-primary)"}}>{c.val}</div>
              </div>
            ))}
          </div>

          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:12}}>Distribución de tiempo</div>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <DonutChart data={statsData} total={totalMins}/>
              <div style={{flex:1,minWidth:140}}>
                {statsData.filter(d=>d.mins>0).map(d=>(
                  <div key={d.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:d.color,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:"var(--color-text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                      <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{totalMins>0?Math.round(d.mins/totalMins*100):0}% · {d.mins} min</div>
                    </div>
                  </div>
                ))}
                {statsData.filter(d=>d.mins>0).length===0 && <p style={{fontSize:12,color:"var(--color-text-tertiary)",margin:0}}>Sin datos aún.</p>}
              </div>
            </div>
          </div>

          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:12}}>Minutos por actividad</div>
            <HBarChart data={statsData}/>
          </div>

          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>Pomodoros por hora del día</div>
            <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:12}}>Barras apiladas por actividad</div>
            <StackedDayChart history={history} activities={activities}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",marginTop:8}}>
              {activities.filter(a=>stats[a.id]?.count>0).map(a=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:a.color}}/>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:12}}>Línea de tiempo de la sesión</div>
            <TimelineChart history={history} activities={activities}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",marginTop:4}}>
              {activities.filter(a=>history.some(h=>h.actId===a.id)).map(a=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:a.color}}/>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:10}}>Historial completo</div>
            {history.length===0 && <p style={{fontSize:13,color:"var(--color-text-tertiary)",margin:0}}>Sin datos todavía.</p>}
            {history.map((h,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<history.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:activities.find(a=>a.id===h.actId)?.color||"#888",flexShrink:0}}/>
                <span style={{fontSize:12,color:"var(--color-text-primary)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.actName}</span>
                <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{h.completedAt}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {view==="activities" && (
        <>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:10}}>Nueva actividad</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input value={newActName} onChange={e=>setNewActName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addActivity()}
                placeholder="Nombre de la actividad" style={{flex:1,fontSize:13}}/>
              <select value={newActColor} onChange={e=>setNewActColor(e.target.value)} style={{width:48,padding:"6px 2px",fontSize:13}}>
                {COLORS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{width:24,height:24,borderRadius:"50%",background:newActColor,flexShrink:0,border:"0.5px solid var(--color-border-tertiary)"}}/>
              <button onClick={addActivity} style={{fontSize:13,padding:"7px 14px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <i className="ti ti-plus" aria-hidden="true"/> Agregar
              </button>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {activities.map(a=>(
              <div key={a.id} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                {editId===a.id ? (
                  <>
                    <input value={editName} onChange={e=>setEditName(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")saveEdit(a.id);if(e.key==="Escape")setEditId(null)}}
                      autoFocus style={{flex:1,fontSize:13}}/>
                    <button onClick={()=>saveEdit(a.id)} style={{fontSize:12,padding:"4px 10px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-success)",color:"var(--color-text-success)",background:"transparent",cursor:"pointer"}}>Guardar</button>
                    <button onClick={()=>setEditId(null)} style={{fontSize:12,padding:"4px 10px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)",background:"transparent",cursor:"pointer"}}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:13,color:"var(--color-text-primary)"}}>{a.name}</span>
                    <span style={{fontSize:11,color:"var(--color-text-secondary)",marginRight:4}}>{stats[a.id]?.count||0} pomos · {stats[a.id]?.mins||0} min</span>
                    <button onClick={()=>{setEditId(a.id);setEditName(a.name)}} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--color-text-secondary)",fontSize:15,padding:4}} aria-label="Editar">
                      <i className="ti ti-edit" aria-hidden="true"/>
                    </button>
                    <button onClick={()=>deleteActivity(a.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--color-text-danger)",fontSize:15,padding:4}} aria-label="Eliminar">
                      <i className="ti ti-trash" aria-hidden="true"/>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

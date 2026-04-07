import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// ============================================================
//  THEMES
// ============================================================
const DARK = {
  n:"dark",bg:"#08080a",card:"#111113",cb:"#1f1d19",
  rA:"#111113",rB:"#191920",
  gold:"#c9942e",gB:"#e2b650",gD:"#7a6530",
  iron:"#3a3632",steel:"#706a5e",
  bone:"#d4cfc4",bD:"#8a847a",
  vic:"#4a9e3e",vicBg:"#1a2e14",
  def:"#8b1a1a",defBg:"#1c0e0e",
  link:"#7aade0",lost:"#c44040",
  eBg:"#1c0e0e",eBd:"#8b1a1a",
  iBg:"#0d1118",iBd:"#1a2940",
  inBg:"#08080a",hBg:"#111113",
};
const LIGHT = {
  n:"light",bg:"#eae5da",card:"#faf8f4",cb:"#c8c0b0",
  rA:"#faf8f4",rB:"#f0ece2",
  gold:"#7a5a10",gB:"#5a4008",gD:"#a88030",
  iron:"#b8b0a0",steel:"#6a6458",
  bone:"#1a1810",bD:"#3a3630",
  vic:"#1a6a10",vicBg:"#ddf0d8",
  def:"#901818",defBg:"#f8dada",
  link:"#1a5a9a",lost:"#a02020",
  eBg:"#f8dada",eBd:"#c09090",
  iBg:"#dae8f4",iBd:"#90a8c0",
  inBg:"#eae5da",hBg:"#f4f0e8",
};

function Cross({size=16,color}){return<svg width={size} height={size} viewBox="0 0 16 16"><rect x="6" y="1" width="4" height="14" rx=".5" fill={color}/><rect x="1" y="5" width="14" height="4" rx=".5" fill={color}/></svg>;}
function fmtNum(n){return typeof n==="number"&&!isNaN(n)?n.toLocaleString("en-US"):"0";}
function fmtMoney(n){if(!n||n===0)return "$0";if(n>=1e9)return"$"+((n/1e9).toFixed(1))+"B";if(n>=1e6)return"$"+((n/1e6).toFixed(0))+"M";if(n>=1e3)return"$"+((n/1e3).toFixed(0))+"K";return"$"+n;}

const RECON_STATS = [
  { key:"xantaken", label:"Xanax", tip:"Xanax taken (lifetime)" },
  { key:"refills", label:"Refills", tip:"Energy refills" },
  { key:"statenhancersused", label:"SE Used", tip:"Stat enhancers used" },
  { key:"attackswon", label:"Atk Won", tip:"Attacks won" },
  { key:"attackslost", label:"Atk Lost", tip:"Attacks lost" },
  { key:"defendswon", label:"Def Won", tip:"Defends won" },
  { key:"defendslost", label:"Def Lost", tip:"Defends lost" },
  { key:"networth", label:"Networth", tip:"Total networth", fmt:"money" },
  { key:"overdosed", label:"ODs", tip:"Times overdosed" },
  { key:"traveltime", label:"Travel", tip:"Time spent traveling" },
  { key:"bestchain", label:"Best Chain", tip:"Best chain achieved" },
  { key:"respectforfaction", label:"Respect", tip:"Respect earned for faction" },
  { key:"revives", label:"Revives", tip:"Revives given" },
  { key:"drugsused", label:"Drugs Used", tip:"Total drugs used" },
];

const DELTA_STATS = [
  { key:"xantaken", label:"Xanax", tip:"Xanax taken delta" },
  { key:"victaken", label:"Vicodin", tip:"Vicodin taken delta" },
  { key:"refills", label:"Refills", tip:"Energy refills delta" },
  { key:"statenhancersused", label:"SE Used", tip:"Stat enhancers used delta" },
  { key:"attackswon", label:"Atk Won", tip:"Attacks won delta" },
  { key:"attackslost", label:"Atk Lost", tip:"Attacks lost delta" },
  { key:"defendswon", label:"Def Won", tip:"Defends won delta" },
  { key:"defendslost", label:"Def Lost", tip:"Defends lost delta" },
  { key:"networth", label:"Networth", tip:"Networth change", fmt:"money" },
  { key:"overdosed", label:"ODs", tip:"Overdoses delta" },
  { key:"respectforfaction", label:"Respect", tip:"Respect delta" },
  { key:"revives", label:"Revives", tip:"Revives delta" },
  { key:"drugsused", label:"Drugs Used", tip:"Drugs used delta" },
  { key:"energydrinkused", label:"E-Drinks", tip:"Energy drinks used delta" },
  { key:"boostersused", label:"Boosters", tip:"Boosters used delta" },
  { key:"medicalitemsused", label:"Medical", tip:"Medical items used delta" },
  { key:"lsdtaken", label:"LSD", tip:"LSD taken delta" },
  { key:"cantaken", label:"Cans", tip:"Cans used delta" },
];

const SNAPSHOT_STAT_KEYS = [
  "xantaken","victaken","attackswon","attackslost","defendswon","defendslost",
  "statenhancersused","refills","overdosed","networth","drugsused",
  "respectforfaction","revives","energydrinkused","boostersused",
  "medicalitemsused","lsdtaken","cantaken"
];

// ============================================================
//  FAKE DATA GENERATOR (48 hours)
// ============================================================
function generateFakeReconData() {
  const yourName = "Iron Wolves";
  const theirName = "Shadow Syndicate";
  const yourFactionId = "99999";
  const theirFactionId = "88888";
  
  const yourMembersRaw = [
    { id: "100001", name: "SteelFang", level: 85 },
    { id: "100002", name: "Phantom_X", level: 92 },
    { id: "100003", name: "NovaBlade", level: 78 },
    { id: "100004", name: "CrimsonAce", level: 81 },
    { id: "100005", name: "Wraith99", level: 69 },
    { id: "100006", name: "ToxicRain", level: 74 },
    { id: "100007", name: "GhostPilot", level: 88 },
    { id: "100008", name: "Viper_Kai", level: 63 },
    { id: "100009", name: "Ember_Sky", level: 55 }
  ];
  const theirMembersRaw = [
    { id: "200001", name: "DarkMatter", level: 90 },
    { id: "200002", name: "SilentStorm", level: 84 },
    { id: "200003", name: "NightCrawler", level: 77 },
    { id: "200004", name: "BlazeRunner", level: 72 },
    { id: "200005", name: "FrostByte", level: 68 },
    { id: "200006", name: "Hex_Zero", level: 65 },
    { id: "200007", name: "RogueAgent", level: 59 },
    { id: "200008", name: "PixelDust", level: 52 }
  ];
  
  const initStats = () => ({
    xantaken: Math.floor(Math.random() * 500),
    victaken: Math.floor(Math.random() * 200),
    attackswon: Math.floor(Math.random() * 1000),
    attackslost: Math.floor(Math.random() * 100),
    defendswon: Math.floor(Math.random() * 300),
    defendslost: Math.floor(Math.random() * 50),
    statenhancersused: Math.floor(Math.random() * 50),
    refills: Math.floor(Math.random() * 200),
    overdosed: Math.floor(Math.random() * 10),
    networth: Math.floor(Math.random() * 50000000),
    drugsused: Math.floor(Math.random() * 800),
    respectforfaction: Math.floor(Math.random() * 5000),
    revives: Math.floor(Math.random() * 5),
    energydrinkused: Math.floor(Math.random() * 100),
    boostersused: Math.floor(Math.random() * 20),
    medicalitemsused: Math.floor(Math.random() * 150),
    lsdtaken: Math.floor(Math.random() * 30),
    cantaken: Math.floor(Math.random() * 80)
  });
  
  const yourBase = {};
  yourMembersRaw.forEach(m => { yourBase[m.id] = initStats(); });
  const theirBase = {};
  theirMembersRaw.forEach(m => { theirBase[m.id] = initStats(); });
  
  const generateStats = (base, hours) => {
    const mult = hours / 48;
    return {
      xantaken: base.xantaken + Math.floor(Math.random() * 3 * 48 * mult),
      victaken: base.victaken + Math.floor(Math.random() * 5 * 48 * mult),
      attackswon: base.attackswon + Math.floor(Math.random() * 10 * 48 * mult),
      attackslost: base.attackslost + Math.floor(Math.random() * 2 * 48 * mult),
      defendswon: base.defendswon + Math.floor(Math.random() * 3 * 48 * mult),
      defendslost: base.defendslost + Math.floor(Math.random() * 1 * 48 * mult),
      statenhancersused: base.statenhancersused + Math.floor(Math.random() * 2 * 48 * mult),
      refills: base.refills + Math.floor(Math.random() * 2 * 48 * mult),
      overdosed: base.overdosed + (Math.random() < 0.02 ? 1 : 0),
      networth: base.networth + Math.floor(Math.random() * 500000 * 48 * mult),
      drugsused: base.drugsused + Math.floor(Math.random() * 8 * 48 * mult),
      respectforfaction: base.respectforfaction + Math.floor(Math.random() * 300 * 48 * mult),
      revives: base.revives + (Math.random() < 0.05 ? 1 : 0),
      energydrinkused: base.energydrinkused + Math.floor(Math.random() * 3 * 48 * mult),
      boostersused: base.boostersused + Math.floor(Math.random() * 1 * 48 * mult),
      medicalitemsused: base.medicalitemsused + Math.floor(Math.random() * 2 * 48 * mult),
      lsdtaken: base.lsdtaken + (Math.random() < 0.02 ? 1 : 0),
      cantaken: base.cantaken + Math.floor(Math.random() * 2 * 48 * mult)
    };
  };
  
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 48 * 3600;
  const snapshots = [];
  for (let hour = 0; hour <= 48; hour++) {
    const ts = startTime + hour * 3600;
    const yourMembers = {};
    const theirMembers = {};
    yourMembersRaw.forEach(m => {
      const stats = generateStats(yourBase[m.id], hour);
      yourMembers[m.id] = { last_action: ts - Math.random() * 3600, stats };
    });
    theirMembersRaw.forEach(m => {
      const stats = generateStats(theirBase[m.id], hour);
      theirMembers[m.id] = { last_action: ts - Math.random() * 3600, stats };
    });
    snapshots.push({ timestamp: ts, yourMembers, theirMembers });
  }
  
  const latest = snapshots[snapshots.length-1];
  const yourMembersList = yourMembersRaw.map(m => ({
    id: m.id,
    name: m.name,
    level: m.level,
    stats: latest.yourMembers[m.id]?.stats || null,
    lastAction: latest.yourMembers[m.id]?.last_action || 0
  }));
  const theirMembersList = theirMembersRaw.map(m => ({
    id: m.id,
    name: m.name,
    level: m.level,
    stats: latest.theirMembers[m.id]?.stats || null,
    lastAction: latest.theirMembers[m.id]?.last_action || 0
  }));
  
  return {
    yourName, theirName,
    yourFactionId, theirFactionId,
    yourMembers: yourMembersList,
    theirMembers: theirMembersList,
    snapshots: snapshots,
    yourMemberNames: Object.fromEntries(yourMembersRaw.map(m => [m.id, { name: m.name, level: m.level }])),
    theirMemberNames: Object.fromEntries(theirMembersRaw.map(m => [m.id, { name: m.name, level: m.level }]))
  };
}
// Catch up if the browser put the tab to sleep
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && warId && hasData && !loading) {
        const now = Math.floor(Date.now() / 1000);
        // If it's been more than 65 minutes since the last refresh, trigger one immediately
        // (65 mins prevents it from fighting with the 60 min setInterval)
        if (lastRefresh && (now - lastRefresh > 65 * 60)) {
           setLM("Tab woke up. Catching up on missed snapshot...");
           takeManualSnapshot(); 
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [warId, hasData, loading, lastRefresh, snapshots, yourMembers, theirMembers]);
// ============================================================
//  RECON TABLE
// ============================================================
function ReconTable({members,title,accent,theme:th,sortCol,sortAsc,onSort,statsList,isDelta,compact,mirror}){
  const allStats=statsList||RECON_STATS;
  const COMPACT_KEYS=["xantaken","refills","attackswon","networth","overdosed","respectforfaction","revives","drugsused"];
  const stats=(compact&&!isDelta)?allStats.filter(s=>COMPACT_KEYS.includes(s.key)):allStats;
  const sorted=[...members].sort((a,b)=>{
    const av=a.stats?.[sortCol]??0,bv=b.stats?.[sortCol]??0;
    if(sortCol==="name")return sortAsc?String(a.name).localeCompare(b.name):String(b.name).localeCompare(a.name);
    return sortAsc?av-bv:bv-av;
  });

  const c={padding:"5px 4px",fontSize:"11px",borderBottom:`1px solid ${th.cb}`,whiteSpace:"nowrap",fontFamily:"Arial,sans-serif"};
  const mn={fontFamily:"Consolas,monospace",fontSize:"11px"};
  const hd={...c,color:th.gold,fontWeight:700,cursor:"pointer",userSelect:"none",position:"sticky",top:0,background:th.card,zIndex:1,fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.3px",padding:"7px 4px"};

  const totals={};
  stats.forEach(s=>{totals[s.key]=members.reduce((sum,m)=>sum+(m.stats?.[s.key]||0),0);});

  const renderStatCell=(s,m)=>{
    const v=m.stats?.[s.key];
    if(isDelta){
      if(v===undefined||v===null)return<td key={s.key} style={{...c,...mn,textAlign:"right",color:th.iron}}>—</td>;
      const color=v>0?"#4a9e3e":v===0?th.iron:th.lost;
      return<td key={s.key} style={{...c,...mn,textAlign:"right",color}}>{v>0?"+":""}{s.fmt==="money"?fmtMoney(v):fmtNum(v)}</td>;
    }
    if(s.key==="revives"){
      const yes=v!==undefined&&v>0;
      return<td key={s.key} style={{...c,...mn,textAlign:"right",color:yes?"#4a9e3e":th.iron,fontWeight:yes?700:400}}>{v===undefined?"—":yes?"Yes":"No"}</td>;
    }
    const display=v===undefined?"—":s.fmt==="money"?fmtMoney(v):fmtNum(v);
    return<td key={s.key} style={{...c,...mn,textAlign:"right",color:v?th.bone:th.iron}}>{display}</td>;
  };

  const renderTotalCell=(s)=>{
    const v=totals[s.key];
    if(s.key==="revives"&&!isDelta)return<td key={s.key} style={{...c,...mn,textAlign:"right",fontWeight:700,fontSize:"11px",padding:"7px 4px",color:th.gB}}>{fmtNum(v)}</td>;
    const color=isDelta?(v>0?"#4a9e3e":v===0?th.iron:th.lost):th.gB;
    return<td key={s.key} style={{...c,...mn,textAlign:"right",fontWeight:700,fontSize:"11px",padding:"7px 4px",color}}>{isDelta&&v>0?"+":""}{s.fmt==="money"?fmtMoney(v):fmtNum(v)}</td>;
  };

  const memberHd=<th onClick={()=>onSort("name")} style={{...hd,textAlign:mirror?"right":"left",minWidth:"100px"}}>Member{sortCol==="name"?(sortAsc?" ▲":" ▼"):""}</th>;
  const lvlHd=<th style={{...hd,textAlign:"right",minWidth:"30px"}}>Lvl</th>;
  const statHds=stats.map(s=><th key={s.key} onClick={()=>onSort(s.key)} title={s.tip} style={{...hd,textAlign:"right",minWidth:"50px"}}>{s.label}{sortCol===s.key?(sortAsc?" ▲":" ▼"):""}</th>);

  return(
    <div style={{flex:1,minWidth:"380px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
        <div style={{height:"2px",width:"20px",background:accent}}/>
        <h3 style={{margin:0,fontSize:"13px",fontWeight:700,color:th.bone}}>{title}</h3>
        <span style={{fontSize:"10px",color:th.steel,marginLeft:"auto"}}>{members.length} members</span>
      </div>
      <div style={{overflowX:"auto",border:`1px solid ${th.cb}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:th.card}}>
          <thead><tr style={{borderBottom:`2px solid ${accent}40`}}>{mirror?<>{[...statHds].reverse()}{lvlHd}{memberHd}</>:<>{memberHd}{lvlHd}{statHds}</>}</tr></thead>
          <tbody>{sorted.map((m,i)=>{
            const memberTd=<td key="name" style={{...c,textAlign:mirror?"right":"left",fontWeight:500}}><a href={`https://www.torn.com/profiles.php?XID=${m.id}`} target="_blank" rel="noopener noreferrer" style={{color:th.link,textDecoration:"none",fontSize:"11px"}}>{m.name}</a>{!m.stats&&!isDelta&&<span style={{fontSize:"9px",color:th.steel,marginLeft:"4px"}}>loading...</span>}</td>;
            const lvlTd=<td key="lvl" style={{...c,...mn,textAlign:"right",color:th.bD}}>{m.level||"—"}</td>;
            return(<tr key={m.id} style={{background:i%2===0?th.rA:th.rB}}>{mirror?<>{[...stats].reverse().map(s=>renderStatCell(s,m))}{lvlTd}{memberTd}</>:<>{memberTd}{lvlTd}{stats.map(s=>renderStatCell(s,m))}</>}</tr>);
          })}</tbody>
          <tfoot>
            <tr style={{borderTop:`2px solid ${th.iron}`,background:th.n==="dark"?"#0c0c0e":"#e8e2d6"}}>
              {mirror ? (
                <>
                  {[...stats].reverse().map(s=>renderTotalCell(s))}
                  <td style={{...c,...mn,textAlign:"right",color:th.iron,padding:"7px 4px"}}>—</td>
                  <td style={{...c,textAlign:"right",color:th.gold,fontWeight:700,fontSize:"11px",textTransform:"uppercase",padding:"7px 4px"}}>Totals</td>
                </>
              ) : (
                <>
                  <td style={{...c,textAlign:"left",color:th.gold,fontWeight:700,fontSize:"11px",textTransform:"uppercase",padding:"7px 4px"}} colSpan={2}>Totals</td>
                  {stats.map(s=>renderTotalCell(s))}
                </>
              )}
            </tr>
            <tr style={{background:th.n==="dark"?"#0c0c0e":"#e8e2d6"}}>
              {mirror ? (
                <>
                  {[...stats].reverse().map(s=>{const avg=members.length?totals[s.key]/members.length:0;return<td key={s.key} style={{...c,...mn,textAlign:"right",fontSize:"10px",padding:"5px 4px",color:th.bD}}>{s.fmt==="money"?fmtMoney(Math.round(avg)):fmtNum(Math.round(avg))}</td>;})}
                  <td style={{...c,padding:"5px 4px"}} colSpan={2}/>
                </>
              ) : (
                <>
                  <td style={{...c,textAlign:"left",color:th.steel,fontSize:"10px",padding:"5px 4px"}} colSpan={2}>Average</td>
                  {stats.map(s=>{const avg=members.length?totals[s.key]/members.length:0;return<td key={s.key} style={{...c,...mn,textAlign:"right",fontSize:"10px",padding:"5px 4px",color:th.bD}}>{s.fmt==="money"?fmtMoney(Math.round(avg)):fmtNum(Math.round(avg))}</td>;})}
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================
//  COMPARE BAR, CHARTS (simplified for brevity, same as original)
// ============================================================
function CompareBar({label,yourVal,theirVal,theme:th}){
  const total=yourVal+theirVal||1;
  const pct=(yourVal/total)*100;
  return(<div style={{marginBottom:"8px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:th.steel,marginBottom:"2px"}}><span>{fmtNum(yourVal)}</span><span style={{color:th.bD,fontWeight:600}}>{label}</span><span>{fmtNum(theirVal)}</span></div><div style={{height:"5px",background:th.iron,overflow:"hidden",display:"flex",border:`1px solid ${th.cb}`}}><div style={{width:`${pct}%`,background:th.vic,transition:"width 0.4s"}}/><div style={{flex:1,background:th.lost}}/></div></div>);
}

function ChartContainer({title,theme:th,children,width=700,height=260}){
  return(<div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"14px"}}><div style={{fontSize:"11px",fontWeight:700,color:th.bone,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px",textAlign:"center"}}>{title}</div><div style={{overflowX:"auto"}}><svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",maxWidth:`${width}px`,height:"auto",display:"block",margin:"0 auto"}}>{children}</svg></div></div>);
}

function drawGridAndAxes(th, width, height, pad, xLabels, yMax, ySteps){
  const elems = [];
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  for(let i=0;i<=ySteps;i++){
    const y = pad.t + (plotH/ySteps)*i;
    const val = Math.round(yMax - (yMax/ySteps)*i);
    elems.push(<line key={`hg${i}`} x1={pad.l} y1={y} x2={width-pad.r} y2={y} stroke={th.iron} strokeWidth="0.5"/>);
    elems.push(<text key={`yl${i}`} x={pad.l-4} y={y+3} textAnchor="end" fill={th.steel} fontSize="8" fontFamily="Arial,sans-serif">{val}</text>);
  }
  const step = xLabels.length > 1 ? plotW/(xLabels.length-1) : plotW;
  xLabels.forEach((lbl,i)=>{
    const x = pad.l + step*i;
    elems.push(<text key={`xl${i}`} x={x} y={height-pad.b+12} textAnchor="middle" fill={th.steel} fontSize="7" fontFamily="Arial,sans-serif">{lbl}</text>);
  });
  elems.push(<line key="xa" x1={pad.l} y1={height-pad.b} x2={width-pad.r} y2={height-pad.b} stroke={th.steel} strokeWidth="1"/>);
  elems.push(<line key="ya" x1={pad.l} y1={pad.t} x2={pad.l} y2={height-pad.b} stroke={th.steel} strokeWidth="1"/>);
  return elems;
}

function ActivityChart({snapshots,yourFactionId,theirFactionId,hoursFilter,theme:th}){
  if(!snapshots||snapshots.length<2)return<ChartContainer title="Activity Comparison" theme={th}><text x="350" y="120" textAnchor="middle" fill={th.steel} fontSize="12">⏳ Waiting for 2nd snapshot (~1 hour)</text></ChartContainer>;
  const now = snapshots[snapshots.length-1].timestamp;
  const cutoff = now - hoursFilter*3600;
  const filtered = snapshots.filter(s=>s.timestamp>=cutoff);
  if(filtered.length<2)return<ChartContainer title="Activity Comparison" theme={th}><text x="350" y="130" textAnchor="middle" fill={th.steel} fontSize="12">No data in the last {hoursFilter}h</text></ChartContainer>;
  const W=700,H=260,pad={l:50,r:20,t:30,b:30};
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  const data = filtered.map(snap=>{
    let yourActive=0, theirActive=0;
    const yourM=snap.yourMembers||{};
    const theirM=snap.theirMembers||{};
    Object.values(yourM).forEach(m=>{if(m.last_action && snap.timestamp-m.last_action<3600)yourActive++;});
    Object.values(theirM).forEach(m=>{if(m.last_action && snap.timestamp-m.last_action<3600)theirActive++;});
    return {ts:snap.timestamp,yourActive,theirActive};
  });
  const maxVal = Math.max(1,...data.map(d=>Math.max(d.yourActive,d.theirActive)));
  const yMax = Math.ceil(maxVal*1.2)||5;
  const xLabels = data.map(d=>{const dt=new Date(d.ts*1000);return `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;});
  const barW = Math.max(3,Math.min(20,plotW/(data.length*2.5)));
  let yourCum=0,theirCum=0;
  const yourCumArr=[],theirCumArr=[];
  data.forEach(d=>{yourCum+=d.yourActive;theirCum+=d.theirActive;yourCumArr.push(yourCum);theirCumArr.push(theirCum);});
  const cumMax = Math.max(1,yourCum,theirCum);
  return(<ChartContainer title="Activity Comparison" theme={th} width={W} height={H}>
    {drawGridAndAxes(th,W,H,pad,xLabels,yMax,5)}
    {data.map((d,i)=>{const x = pad.l + (plotW/(data.length-1||1))*i;const yH = (d.yourActive/yMax)*plotH;const tH = (d.theirActive/yMax)*plotH;return<g key={i}><rect x={x-barW-1} y={pad.t+plotH-yH} width={barW} height={yH} fill={th.vic} opacity={0.7}/><rect x={x+1} y={pad.t+plotH-tH} width={barW} height={tH} fill={th.lost} opacity={0.7}/></g>;})}
    {yourCumArr.length>1&&<polyline fill="none" stroke={th.vic} strokeWidth="2" points={yourCumArr.map((v,i)=>`${pad.l+(plotW/(data.length-1||1))*i},${pad.t+plotH-(v/cumMax)*plotH}`).join(" ")}/>}
    {theirCumArr.length>1&&<polyline fill="none" stroke={th.lost} strokeWidth="2" points={theirCumArr.map((v,i)=>`${pad.l+(plotW/(data.length-1||1))*i},${pad.t+plotH-(v/cumMax)*plotH}`).join(" ")}/>}
    <rect x={W-180} y={4} width={10} height={10} fill={th.vic} opacity={0.7}/><text x={W-166} y={13} fill={th.bone} fontSize="9">Your Faction</text>
    <rect x={W-90} y={4} width={10} height={10} fill={th.lost} opacity={0.7}/><text x={W-76} y={13} fill={th.bone} fontSize="9">Opponent</text>
  </ChartContainer>);
}

function AttackChart({snapshots,yourFactionId,theirFactionId,hoursFilter,theme:th}){
  if(!snapshots||snapshots.length<2)return<ChartContainer title="Attack Comparison" theme={th}><text x="350" y="120" textAnchor="middle" fill={th.steel} fontSize="12">⏳ Waiting for 2nd snapshot</text></ChartContainer>;
  const now = snapshots[snapshots.length-1].timestamp;
  const cutoff = now - hoursFilter*3600;
  const filtered = snapshots.filter(s=>s.timestamp>=cutoff);
  if(filtered.length<2)return<ChartContainer title="Attack Comparison" theme={th}><text x="350" y="130" textAnchor="middle" fill={th.steel} fontSize="12">No data in last {hoursFilter}h</text></ChartContainer>;
  const W=700,H=260,pad={l:50,r:20,t:30,b:30};
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  const intervals = [];
  for(let i=1;i<filtered.length;i++){
    const prev=filtered[i-1], curr=filtered[i];
    let yourAttackers=0, theirAttackers=0, yourAtkDelta=0, theirAtkDelta=0;
    const yourCurr=curr.yourMembers||{}, yourPrev=prev.yourMembers||{};
    const theirCurr=curr.theirMembers||{}, theirPrev=prev.theirMembers||{};
    Object.keys(yourCurr).forEach(id=>{const cA=(yourCurr[id]?.stats?.attackswon)||0;const pA=(yourPrev[id]?.stats?.attackswon)||0;const d=cA-pA;if(d>0){yourAttackers++;yourAtkDelta+=d;}});
    Object.keys(theirCurr).forEach(id=>{const cA=(theirCurr[id]?.stats?.attackswon)||0;const pA=(theirPrev[id]?.stats?.attackswon)||0;const d=cA-pA;if(d>0){theirAttackers++;theirAtkDelta+=d;}});
    intervals.push({ts:curr.timestamp,yourAttackers,theirAttackers,yourAtkDelta,theirAtkDelta});
  }
  if(!intervals.length)return<ChartContainer title="Attack Comparison" theme={th}><text x="350" y="130" textAnchor="middle" fill={th.steel} fontSize="12">Insufficient data</text></ChartContainer>;
  const maxBar = Math.max(1,...intervals.map(d=>Math.max(d.yourAttackers,d.theirAttackers)));
  const yMax = Math.ceil(maxBar*1.2)||5;
  const xLabels = intervals.map(d=>{const dt=new Date(d.ts*1000);return `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;});
  const barW = Math.max(3,Math.min(20,plotW/(intervals.length*2.5)));
  let yourCum=0,theirCum=0;
  const yourLine=[],theirLine=[];
  intervals.forEach(d=>{yourCum+=d.yourAtkDelta;theirCum+=d.theirAtkDelta;yourLine.push(yourCum);theirLine.push(theirCum);});
  const lineMax=Math.max(1,yourCum,theirCum);
  return(<ChartContainer title="Attack Comparison" theme={th} width={W} height={H}>
    {drawGridAndAxes(th,W,H,pad,xLabels,yMax,5)}
    {intervals.map((d,i)=>{const x = pad.l + (intervals.length>1?(plotW/(intervals.length-1))*i:plotW/2);const yH = (d.yourAttackers/yMax)*plotH;const tH = (d.theirAttackers/yMax)*plotH;return<g key={i}><rect x={x-barW-1} y={pad.t+plotH-yH} width={barW} height={yH} fill={th.vic} opacity={0.7}/><rect x={x+1} y={pad.t+plotH-tH} width={barW} height={tH} fill={th.lost} opacity={0.7}/></g>;})}
    {yourLine.length>1&&<polyline fill="none" stroke={th.vic} strokeWidth="2" points={yourLine.map((v,i)=>`${pad.l+(plotW/(intervals.length-1||1))*i},${pad.t+plotH-(v/lineMax)*plotH}`).join(" ")}/>}
    {theirLine.length>1&&<polyline fill="none" stroke={th.lost} strokeWidth="2" points={theirLine.map((v,i)=>`${pad.l+(plotW/(intervals.length-1||1))*i},${pad.t+plotH-(v/lineMax)*plotH}`).join(" ")}/>}
    <rect x={W-180} y={4} width={10} height={10} fill={th.vic} opacity={0.7}/><text x={W-166} y={13} fill={th.bone} fontSize="9">Your Faction</text>
    <rect x={W-90} y={4} width={10} height={10} fill={th.lost} opacity={0.7}/><text x={W-76} y={13} fill={th.bone} fontSize="9">Opponent</text>
  </ChartContainer>);
}

function DrugChart({snapshots,yourFactionId,theirFactionId,hoursFilter,theme:th}){
  if(!snapshots||snapshots.length<2)return<ChartContainer title="Drug Comparison" theme={th}><text x="350" y="120" textAnchor="middle" fill={th.steel} fontSize="12">⏳ Waiting for 2nd snapshot</text></ChartContainer>;
  const now = snapshots[snapshots.length-1].timestamp;
  const cutoff = now - hoursFilter*3600;
  const filtered = snapshots.filter(s=>s.timestamp>=cutoff);
  if(filtered.length<2)return<ChartContainer title="Drug Comparison" theme={th}><text x="350" y="130" textAnchor="middle" fill={th.steel} fontSize="12">No data in last {hoursFilter}h</text></ChartContainer>;
  const W=700,H=260,pad={l:50,r:20,t:30,b:30};
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  const base=filtered[0];
  const sumStat=(members,key)=>Object.values(members||{}).reduce((s,m)=>s+(m.stats?.[key]||0),0);
  const baseYourXan=sumStat(base.yourMembers,"xantaken"), baseTheirXan=sumStat(base.theirMembers,"xantaken");
  const baseYourVic=sumStat(base.yourMembers,"victaken"), baseTheirVic=sumStat(base.theirMembers,"victaken");
  const data = filtered.map(snap=>({ts:snap.timestamp,yourXan:sumStat(snap.yourMembers,"xantaken")-baseYourXan,theirXan:sumStat(snap.theirMembers,"xantaken")-baseTheirXan,yourVic:sumStat(snap.yourMembers,"victaken")-baseYourVic,theirVic:sumStat(snap.theirMembers,"victaken")-baseTheirVic}));
  const allVals = data.flatMap(d=>[d.yourXan,d.theirXan,d.yourVic,d.theirVic]);
  const yMax = Math.max(1,...allVals)*1.2||5;
  const xLabels = data.map(d=>{const dt=new Date(d.ts*1000);return `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;});
  const makePts=(arr)=>arr.map((v,i)=>`${pad.l+(data.length>1?(plotW/(data.length-1))*i:plotW/2)},${pad.t+plotH-(v/yMax)*plotH}`).join(" ");
  return(<ChartContainer title="Drug Comparison" theme={th} width={W} height={H}>
    {drawGridAndAxes(th,W,H,pad,xLabels,Math.ceil(yMax),5)}
    {data.length>1&&<polyline fill="none" stroke={th.vic} strokeWidth="2" points={makePts(data.map(d=>d.yourXan))}/>}
    {data.length>1&&<polyline fill="none" stroke={th.lost} strokeWidth="2" points={makePts(data.map(d=>d.theirXan))}/>}
    {data.length>1&&<polyline fill="none" stroke={th.vic} strokeWidth="2" strokeDasharray="6,3" points={makePts(data.map(d=>d.yourVic))}/>}
    {data.length>1&&<polyline fill="none" stroke={th.lost} strokeWidth="2" strokeDasharray="6,3" points={makePts(data.map(d=>d.theirVic))}/>}
    <line x1={W-260} y1={9} x2={W-245} y2={9} stroke={th.vic} strokeWidth="2"/><text x={W-242} y={12} fill={th.bone} fontSize="8">Your Xanax</text>
    <line x1={W-190} y1={9} x2={W-175} y2={9} stroke={th.lost} strokeWidth="2"/><text x={W-172} y={12} fill={th.bone} fontSize="8">Their Xanax</text>
    <line x1={W-110} y1={9} x2={W-95} y2={9} stroke={th.vic} strokeWidth="2" strokeDasharray="4,2"/><text x={W-92} y={12} fill={th.bone} fontSize="8">Your Vic</text>
    <line x1={W-52} y1={9} x2={W-37} y2={9} stroke={th.lost} strokeWidth="2" strokeDasharray="4,2"/><text x={W-34} y={12} fill={th.bone} fontSize="8">Their Vic</text>
  </ChartContainer>);
}

// ============================================================
//  MAIN RECON PAGE
// ============================================================
export default function Recon(){
  const[dk,setDk]=useState(true);
  const[cb,setCB]=useState(false);
  const baseTheme=dk?DARK:LIGHT;
  const th=cb?{...baseTheme,lost:dk?"#4a7abf":"#2050a0",def:dk?"#1a3a8b":"#183090",defBg:dk?"#0e0e1c":"#dadaf8",eBg:dk?"#0e0e1c":"#dadaf8",eBd:dk?"#1a3a8b":"#9090c0"}:baseTheme;
  const[apiKey,setAK]=useState("");
  const[warId,setWI]=useState("");
  const[factionId,setFI]=useState("");
  const[loading,setL]=useState(false);
  const[loadMsg,setLM]=useState("");
  const[error,setE]=useState(null);
  const[progress,setProg]=useState({done:0,total:0});
  const[yourMembers,setYM]=useState([]);
  const[theirMembers,setTM]=useState([]);
  const[yourName,setYN]=useState("");
  const[theirName,setTN]=useState("");
  const[yourFactionId,setYFI]=useState("");
  const[theirFactionId,setTFI]=useState("");
  const[sortCol,setSC]=useState("xantaken");
  const[sortAsc,setSA]=useState(false);
  const[deltaSortCol,setDSC]=useState("xantaken");
  const[deltaSortAsc,setDSA]=useState(false);
  const[hoursFilter,setHF]=useState(72);
  const[snapshots,setSnapshots]=useState([]);
  const[lastRefresh,setLastRefresh]=useState(null);
  const refreshRef=useRef(null);
  const[storedData,setStoredData]=useState(null);
  const[savedWars,setSavedWars]=useState({});
  const[reconCompact,setRC]=useState(false);
  const[isSampleMode, setIsSampleMode]=useState(false);

  // Load sample mode on mount and listen
  useEffect(() => {
    const checkSampleMode = () => {
      const sampleFlag = localStorage.getItem("wf_sample_mode") === "true";
      setIsSampleMode(sampleFlag);
      if (sampleFlag) {
        const fake = generateFakeReconData();
        setYN(fake.yourName);
        setTN(fake.theirName);
        setYFI(fake.yourFactionId);
        setTFI(fake.theirFactionId);
        setYM(fake.yourMembers);
        setTM(fake.theirMembers);
        setSnapshots(fake.snapshots);
        setLastRefresh(fake.snapshots[fake.snapshots.length-1]?.timestamp || null);
        setStoredData({
          yourName: fake.yourName, theirName: fake.theirName,
          yourFactionId: fake.yourFactionId, theirFactionId: fake.theirFactionId,
          yourMemberNames: fake.yourMemberNames, theirMemberNames: fake.theirMemberNames,
          snapshots: fake.snapshots
        });
        setE(null);
      } else {
        setYM([]);
        setTM([]);
        setYN("");
        setTN("");
        setYFI("");
        setTFI("");
        setSnapshots([]);
        setLastRefresh(null);
        setStoredData(null);
        if (refreshRef.current) clearInterval(refreshRef.current);
      }
    };
    checkSampleMode();
    const handleStorage = (e) => {
      if (e.key === "wf_sample_mode") checkSampleMode();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(()=>{
    try{const s=localStorage.getItem("wf_fid");if(s)setFI(s);}catch(e){}
    try{const sk=localStorage.getItem("wf_savekey");if(sk==="true"){const k=localStorage.getItem("wf_apikey");if(k)setAK(k);}}catch(e){}
    try{setCB(localStorage.getItem("wf_colorblind")==="true");}catch(e){}
    try{const wid=localStorage.getItem("wf_recon_war_id");if(wid)setWI(wid);}catch(e){}
    try{const h=localStorage.getItem("wf_history");if(h)setSavedWars(JSON.parse(h));}catch(e){}
  },[]);

  useEffect(()=>{if(!warId.trim())return;try{localStorage.setItem("wf_recon_war_id",warId);}catch(e){}; try{const raw=localStorage.getItem(`wf_recon_${warId}`);if(raw){const data=JSON.parse(raw);restoreFromStored(data);}}catch(e){}},[warId]);

  function restoreFromStored(data){
    setStoredData(data);
    setYN(data.yourName||""); setTN(data.theirName||"");
    setYFI(data.yourFactionId||""); setTFI(data.theirFactionId||"");
    setSnapshots(data.snapshots||[]);
    const latest=data.snapshots?.[data.snapshots.length-1];
    if(latest){
      setLastRefresh(latest.timestamp);
      const yMems=Object.entries(latest.yourMembers||{}).map(([id,m])=>({id, name:data.yourMemberNames?.[id]?.name||id, level:data.yourMemberNames?.[id]?.level||null, stats:m.stats||null}));
      const tMems=Object.entries(latest.theirMembers||{}).map(([id,m])=>({id, name:data.theirMemberNames?.[id]?.name||id, level:data.theirMemberNames?.[id]?.level||null, stats:m.stats||null}));
      setYM(yMems); setTM(tMems);
    }
  }

  function buildSnapshot(yourMems, theirMems){
    const snap={timestamp:Math.floor(Date.now()/1000),yourMembers:{},theirMembers:{}};
    yourMems.forEach(m=>{if(!m.stats)return; const s={};SNAPSHOT_STAT_KEYS.forEach(k=>{s[k]=m.stats[k]||0;}); snap.yourMembers[m.id]={last_action:m.lastAction||0,stats:s};});
    theirMems.forEach(m=>{if(!m.stats)return; const s={};SNAPSHOT_STAT_KEYS.forEach(k=>{s[k]=m.stats[k]||0;}); snap.theirMembers[m.id]={last_action:m.lastAction||0,stats:s};});
    return snap;
  }

  function saveWarData(wId, yFid, tFid, yName, tName, yMems, tMems, snaps){
    const yourMemberNames={}, theirMemberNames={};
    yMems.forEach(m=>{yourMemberNames[m.id]={name:m.name,level:m.level};});
    tMems.forEach(m=>{theirMemberNames[m.id]={name:m.name,level:m.level};});
    const data={yourFactionId:yFid, theirFactionId:tFid, yourName:yName, theirName:tName, yourMemberNames, theirMemberNames, snapshots:snaps};
    try{localStorage.setItem(`wf_recon_${wId}`,JSON.stringify(data));}catch(e){}
    setStoredData(data);
  }

  const doSort=(col)=>{if(sortCol===col)setSA(!sortAsc);else{setSC(col);setSA(false);}};
  const doDeltaSort=(col)=>{if(deltaSortCol===col)setDSA(!deltaSortAsc);else{setDSC(col);setDSA(false);}};

  const fetchStats=async(userId,key)=>{try{const r=await fetch(`/api/torn?type=personalstats&id=${userId}&key=${encodeURIComponent(key)}`);const d=await r.json();if(d.error)return null;return d.personalstats||null;}catch(e){return null;}};
  const fetchProfile=async(userId,key)=>{try{const r=await fetch(`/api/torn?type=user_profile&id=${userId}&key=${encodeURIComponent(key)}`);const d=await r.json();if(d.error)return null;return{level:d.level};}catch(e){return null;}};
  const fetchFactionBasic=async(fid,key)=>{try{const r=await fetch(`/api/torn?type=faction_basic_id&id=${fid}&key=${encodeURIComponent(key)}`);const d=await r.json();if(d.error)return null;return d;}catch(e){return null;}};

const takeManualSnapshot = async () => {
    if (!apiKey || !warId || !yFid || !tFid) return;
    setL(true); setLM("Taking snapshot...");
    try {
      let currentSnaps = [...snapshots];
      let currentYMems = [...yourMembers];
      let currentTMems = [...theirMembers];

      // Fetch basic rosters to get the latest last_action timestamps
      const[yourBasic,theirBasic]=await Promise.all([fetchFactionBasic(yFid,apiKey), fetchFactionBasic(tFid,apiKey)]);
      if(yourBasic?.members){currentYMems.forEach(m=>{const fm=yourBasic.members[m.id]; if(fm?.last_action)m.lastAction=fm.last_action.timestamp||0;});}
      if(theirBasic?.members){currentTMems.forEach(m=>{const fm=theirBasic.members[m.id]; if(fm?.last_action)m.lastAction=fm.last_action.timestamp||0;});}

      const allMems=[...currentYMems.map(m=>({...m,side:"yours"})),...currentTMems.map(m=>({...m,side:"theirs"}))];
      const total = allMems.length; setProg({done:0,total});
      
      // Fetch fresh stats for everyone
      for(let i=0;i<allMems.length;i++){
        const m=allMems[i];
        const stats=await fetchStats(m.id,apiKey);
        if(m.side==="yours"){
          const idx=currentYMems.findIndex(p=>p.id===m.id); 
          if(idx>=0)currentYMems[idx]={...currentYMems[idx],stats};
        } else {
          const idx=currentTMems.findIndex(p=>p.id===m.id); 
          if(idx>=0)currentTMems[idx]={...currentTMems[idx],stats};
        }
        setProg({done:i+1,total}); setLM(`Updating stats: ${i+1} / ${total}...`);
        if(i<allMems.length-1)await new Promise(r=>setTimeout(r,500));
      }

      const snap=buildSnapshot(currentYMems,currentTMems);
      const newSnaps=[...currentSnaps,snap];
      
      // Update state and save
      setSnapshots(newSnaps); setLastRefresh(snap.timestamp); setYM(currentYMems); setTM(currentTMems);
      saveWarData(warId, yFid, tFid, yourName, theirName, currentYMems, currentTMems, newSnaps);
    } catch(e) {
      console.error(e); setE("Snapshot failed: " + e.message);
    } finally {
      setL(false); setLM("");
    }
  };
  
const loadRecon=async()=>{
    if(!apiKey.trim()){setE("Set your API key in ⚙ Settings on the main page");return;}
    if(!factionId.trim()){setE("Set Faction ID on the main page first");return;}
    setL(true);setE(null);setLM("Locating active or upcoming ranked war..."); setProg({done:0,total:0}); setYM([]); setTM([]);
    try{
      // 1. Fetch active ranked wars for the user's faction
      const rwRaw=await(await fetch(`/api/torn?type=ranked_wars&key=${encodeURIComponent(apiKey)}`)).json();
      if(rwRaw.error)throw new Error(`API Error ${rwRaw.error.code}: ${rwRaw.error.error}`);
      if(!rwRaw.rankedwars || Object.keys(rwRaw.rankedwars).length === 0)throw new Error("No active or upcoming ranked war found for your faction.");
      
      // Assume the most recent/current war is the first key
      const activeWarId = Object.keys(rwRaw.rankedwars)[0];
      const warInfo = rwRaw.rankedwars[activeWarId];
      
      setWI(activeWarId);
      try{localStorage.setItem("wf_recon_war_id", activeWarId);}catch(e){}

      let yFid=null, theirFid=null;
      let yName="", tName="";

      // 2. Extract faction IDs
      for(const fid in warInfo.factions){
        if(String(fid)===String(factionId)){
          yFid=fid;
          yName=warInfo.factions[fid].name;
        }else{
          theirFid=fid;
          tName=warInfo.factions[fid].name;
        }
      }
      if(!yFid)throw new Error("Your Faction ID not found in the active war data.");
      if(!theirFid)throw new Error("Opponent faction could not be identified.");
      
      setYN(yName); setTN(tName); setYFI(yFid); setTFI(theirFid);

      // 3. Fetch full current rosters for BOTH factions
      setLM("Fetching current faction rosters...");
      const[yourBasic,theirBasic]=await Promise.all([fetchFactionBasic(yFid,apiKey), fetchFactionBasic(theirFid,apiKey)]);
      if(!yourBasic?.members)throw new Error("Failed to load your faction's members.");
      if(!theirBasic?.members)throw new Error("Failed to load opponent faction's members.");

      const yourList=Object.entries(yourBasic.members).map(([id,m])=>({id,name:m.name,level:m.level||null,stats:null,lastAction:m.last_action?.timestamp||0,side:"yours"}));
      const theirList=Object.entries(theirBasic.members).map(([id,m])=>({id,name:m.name,level:m.level||null,stats:null,lastAction:m.last_action?.timestamp||0,side:"theirs"}));
      
      setYM(yourList); setTM(theirList);
      
      const allMembers=[...yourList,...theirList];
      const total=allMembers.length; setProg({done:0,total}); setLM(`Loading stats: 0 / ${total} members...`);
      
      // 4. Fetch personal stats (profile fetch removed to save API calls, level comes from basic now)
      for(let i=0;i<allMembers.length;i++){
        const m=allMembers[i];
        const stats=await fetchStats(m.id,apiKey);
        if(m.side==="yours"){
          const idx=yourList.findIndex(p=>p.id===m.id); 
          if(idx>=0)yourList[idx]={...yourList[idx],stats}; 
          setYM([...yourList]);
        }else{
          const idx=theirList.findIndex(p=>p.id===m.id); 
          if(idx>=0)theirList[idx]={...theirList[idx],stats}; 
          setTM([...theirList]);
        }
        setProg({done:i+1,total}); setLM(`Loading stats: ${i+1} / ${total} members...`);
        if(i<allMembers.length-1)await new Promise(r=>setTimeout(r,500));
      }
      
      const snap=buildSnapshot(yourList,theirList);
      let existingSnaps=[]; try{const raw2=localStorage.getItem(`wf_recon_${activeWarId}`); if(raw2){const d=JSON.parse(raw2); existingSnaps=d.snapshots||[];}}catch(e){}
      const newSnaps=[...existingSnaps,snap]; setSnapshots(newSnaps); setLastRefresh(snap.timestamp);
      saveWarData(activeWarId, yFid, theirFid, yName, tName, yourList, theirList, newSnaps);
      startAutoRefresh(activeWarId, yFid, theirFid, yName, tName, yourList, theirList, newSnaps);
      setLM("");
    }catch(e){setE(e.message);} finally{setL(false);}
  };

  function startAutoRefresh(wId, yFid, tFid, yName, tName, yMemsInit, tMemsInit, snapsInit){
    if(refreshRef.current)clearInterval(refreshRef.current);
    refreshRef.current=setInterval(async()=>{
      if(!apiKey.trim())return;
      try{
        let currentSnaps=snapsInit; let currentYMems=yMemsInit; let currentTMems=tMemsInit;
        try{const raw=localStorage.getItem(`wf_recon_${wId}`); if(raw){const d=JSON.parse(raw); currentSnaps=d.snapshots||[]; currentYMems=Object.entries(d.yourMemberNames||{}).map(([id,m])=>({id,name:m.name,level:m.level,stats:null,lastAction:0})); currentTMems=Object.entries(d.theirMemberNames||{}).map(([id,m])=>({id,name:m.name,level:m.level,stats:null,lastAction:0}));}}catch(e){}
        const[yourBasic,theirBasic]=await Promise.all([fetchFactionBasic(yFid,apiKey), fetchFactionBasic(tFid,apiKey)]);
        if(yourBasic?.members){currentYMems.forEach(m=>{const fm=yourBasic.members[m.id]; if(fm?.last_action)m.lastAction=fm.last_action.timestamp||0;});}
        if(theirBasic?.members){currentTMems.forEach(m=>{const fm=theirBasic.members[m.id]; if(fm?.last_action)m.lastAction=fm.last_action.timestamp||0;});}
        const allMems=[...currentYMems.map(m=>({...m,side:"yours"})),...currentTMems.map(m=>({...m,side:"theirs"}))];
        for(let i=0;i<allMems.length;i++){
          const m=allMems[i]; const stats=await fetchStats(m.id,apiKey);
          if(m.side==="yours"){const idx=currentYMems.findIndex(p=>p.id===m.id); if(idx>=0)currentYMems[idx]={...currentYMems[idx],stats};}
          else{const idx=currentTMems.findIndex(p=>p.id===m.id); if(idx>=0)currentTMems[idx]={...currentTMems[idx],stats};}
          if(i<allMems.length-1)await new Promise(r=>setTimeout(r,500));
        }
        const snap=buildSnapshot(currentYMems,currentTMems);
        const newSnaps=[...currentSnaps,snap]; setSnapshots(newSnaps); setLastRefresh(snap.timestamp); setYM(currentYMems); setTM(currentTMems);
        saveWarData(wId, yFid,tFid,yName,tName,currentYMems,currentTMems,newSnaps);
      }catch(e){console.error("Auto-refresh error:",e);}
    },60*60*1000);
  }

  function computeDeltaMembers(side){
    if(snapshots.length<2)return null;
    const now=snapshots[snapshots.length-1].timestamp;
    const cutoff=now-hoursFilter*3600;
    const filtered=snapshots.filter(s=>s.timestamp>=cutoff);
    if(filtered.length<2)return null;
    const earliest=filtered[0], latest=filtered[filtered.length-1];
    const eMembers=side==="yours"?earliest.yourMembers:earliest.theirMembers;
    const lMembers=side==="yours"?latest.yourMembers:latest.theirMembers;
    const nameSource=side==="yours"?storedData?.yourMemberNames:storedData?.theirMemberNames;
    if(!eMembers||!lMembers)return null;
    const result=[];
    const allIds=new Set([...Object.keys(eMembers),...Object.keys(lMembers)]);
    allIds.forEach(id=>{
      const eStats=eMembers[id]?.stats||{}; const lStats=lMembers[id]?.stats||{};
      const deltaStats={}; DELTA_STATS.forEach(s=>{const ev=eStats[s.key]||0; const lv=lStats[s.key]||0; deltaStats[s.key]=lv-ev;});
      result.push({id,name:nameSource?.[id]?.name||id, level:nameSource?.[id]?.level||null, stats:deltaStats});
    });
    return result;
  }

  const yourDeltas=computeDeltaMembers("yours");
  const theirDeltas=computeDeltaMembers("theirs");
  const timeSinceRefresh=lastRefresh?Math.floor((Date.now()/1000-lastRefresh)/60):null;
  const yourTotals={},theirTotals={}; RECON_STATS.forEach(s=>{yourTotals[s.key]=yourMembers.reduce((sum,m)=>sum+(m.stats?.[s.key]||0),0); theirTotals[s.key]=theirMembers.reduce((sum,m)=>sum+(m.stats?.[s.key]||0),0);});
  const hasData=yourMembers.some(m=>m.stats)||theirMembers.some(m=>m.stats);
  const toggleSampleMode = () => {
    const newSampleMode = !isSampleMode;
    localStorage.setItem("wf_sample_mode", newSampleMode ? "true" : "false");
    window.dispatchEvent(new StorageEvent("storage", { key: "wf_sample_mode", newValue: newSampleMode ? "true" : "false" }));
  };

  const iS={width:"100%",background:th.inBg,border:`1px solid ${th.iron}`,padding:"8px 12px",color:th.bone,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"Arial,sans-serif"};
  const lS={fontSize:"11px",color:th.steel,display:"block",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700};
  const bP={padding:"9px 24px",background:dk?`linear-gradient(180deg,${th.gold},#a07820)`:`linear-gradient(180deg,#b08020,#8a6010)`,border:"none",color:dk?"#0a0a0a":"#fff",fontWeight:700,fontSize:"14px",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.3px",fontFamily:"Arial,sans-serif"};
  const bS={background:th.card,border:`1px solid ${th.iron}`,padding:"6px 12px",color:th.bD,fontSize:"12px",cursor:"pointer",fontFamily:"Arial,sans-serif"};

  return(<>
    <Head><title>WarForge — Recon</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div style={{minHeight:"100vh",background:th.bg,color:th.bone,fontFamily:"Arial,sans-serif",boxShadow:isSampleMode ? "inset 0 0 0 3px #c44040" : "none"}}>
      <header style={{borderBottom:`1px solid ${th.cb}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",background:th.hBg}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}><Cross size={22} color={th.gold}/><div><a href="/" style={{fontWeight:800,fontSize:"20px",letterSpacing:"2px",color:th.gold,textTransform:"uppercase",textDecoration:"none",display:"block"}}>WarForge</a><div style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.2px"}}>Pre-War Recon</div></div></div>
        <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
          {timeSinceRefresh!==null&&<span style={{fontSize:"9px",color:th.steel,marginRight:"8px"}}>Last refreshed: {timeSinceRefresh<1?"just now":`${timeSinceRefresh}m ago`} · {snapshots.length} snapshot{snapshots.length!==1?"s":""}</span>}
          <a href="/" style={{...bS,textDecoration:"none",color:th.gold,border:`1px solid ${th.gD}`,fontWeight:600}}>⚔ Reports</a>
          <a href="/live" style={{...bS,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"4px",color:"#4169E1",border:"1px solid #4169E1"}}>📴 Live</a>
          <a href="/payout" style={{...bS,textDecoration:"none",color:th.gold,border:`1px solid ${th.gD}`}}>💰 Payout</a>
          <button onClick={()=>{const nv=!cb;setCB(nv);try{localStorage.setItem("wf_colorblind",String(nv));}catch(e){}}} style={{...bS,color:cb?"#e03030":"#4a7abf",border:`1px solid ${cb?"#e03030":"#4a7abf"}`,padding:"6px 12px"}}>👁{cb?" CB":""}</button>
          <button onClick={()=>setDk(!dk)} style={{...bS,color:dk?"#ffffff":"#1a1810",padding:"6px 12px"}}>{dk?"☀":"☽"}</button>
          <button onClick={toggleSampleMode} style={{...bS, background:isSampleMode?th.wBg:th.card, border:`1px solid ${isSampleMode?th.gD:th.iron}`, color:isSampleMode?th.gold:th.steel}}>Sample</button>
        </div>
      </header>

<div style={{display:"flex",gap:"10px",alignItems:"end",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={loadRecon} disabled={loading} style={{...bP,opacity:loading?0.5:1,cursor:loading?"wait":"pointer"}}>{loading?"Loading...":"🔍 Recon Enemy"}</button>
            {Object.keys(savedWars).length>0&&(<div style={{minWidth:"140px",maxWidth:"260px"}}><label style={lS}>Or Load from History</label><select value="" onChange={e=>{if(e.target.value){setWI(e.target.value);}}} style={{...iS,cursor:"pointer"}}><option value="">— Select War —</option>{Object.entries(savedWars).sort((a,b)=>(b[1].summary?.date||0)-(a[1].summary?.date||0)).map(([wid,entry])=>{const s=entry.summary||{}; return<option key={wid} value={wid}>#{wid} vs {s.opponent||"Unknown"} ({s.result==="VICTORY"?"W":"L"})</option>;})}</select></div>)}
            <div style={{minWidth:"80px",maxWidth:"140px"}}><label style={lS} title="How many hours of activity to show">Hours Window ⓘ</label><input type="number" value={hoursFilter} onChange={e=>{const v=parseInt(e.target.value);if(v>0)setHF(v);}} min={1} style={iS}/></div>
            {hasData&&<button onClick={()=>{setYM([]);setTM([]);setYN("");setTN("");setYFI("");setTFI("");setSnapshots([]);setLastRefresh(null);setStoredData(null);setE(null);if(refreshRef.current)clearInterval(refreshRef.current);try{localStorage.removeItem(`wf_recon_${warId}`);}catch(e){}}} style={{background:th.card,border:`1px solid ${th.iron}`,padding:"9px 16px",color:th.lost,fontSize:"13px",cursor:"pointer",fontFamily:"Arial,sans-serif",whiteSpace:"nowrap"}}>✕ Clear Report</button>}
          </div>
          {error&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.eBg,border:`1px solid ${th.eBd}`,color:th.lost,fontSize:"11px",textAlign:"center"}}>{error}</div>}
          {loading&&progress.total>0&&(<div style={{marginTop:"10px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:th.steel,marginBottom:"3px"}}><span>{loadMsg}</span><span>{Math.round((progress.done/progress.total)*100)}%</span></div><div style={{height:"4px",background:th.iron,overflow:"hidden",border:`1px solid ${th.cb}`}}><div style={{width:`${(progress.done/progress.total)*100}%`,height:"100%",background:th.gold,transition:"width 0.3s"}}/></div></div>)}
          {loading&&!progress.total&&loadMsg&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.iBg,border:`1px solid ${th.iBd}`,color:th.link,fontSize:"11px",textAlign:"center"}}>{loadMsg}</div>}
        </div>

        {hasData&&(<div style={{background:th.iBg,border:`1px solid ${th.iBd}`,padding:"12px 16px",marginBottom:"16px",lineHeight:1.7,fontSize:"12px",color:th.steel}}><div style={{fontWeight:700,color:th.link,marginBottom:"4px",fontSize:"13px",textTransform:"uppercase",letterSpacing:"0.5px"}}>📊 How Recon Tracking Works</div><div>WarForge takes a <strong style={{color:th.bone}}>snapshot</strong> of every member's stats when you first load, then <strong style={{color:th.bone}}>automatically refreshes every hour</strong>. By comparing snapshots, it calculates what each player did in between — xanax taken, attacks made, etc.</div><div style={{marginTop:"6px"}}><strong style={{color:th.bone}}>Current status:</strong> {snapshots.length<2?<span style={{color:th.gold}}>⏳ First snapshot taken. The "Recent Activity" tables and charts will appear after the next auto-refresh (~1 hour).</span>:<span style={{color:th.vic}}>✅ {snapshots.length} snapshots collected — delta tables and charts are active below.</span>}</div><div style={{marginTop:"6px",fontSize:"11px",color:th.bD}}>💡 <strong>Tip:</strong> The <strong>Hours Window</strong> filter controls how far back the activity tables and charts look. The more snapshots you have, the richer the data.</div></div>)}

        {hasData&&(<div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"16px",marginBottom:"16px"}}><div style={{textAlign:"center",marginBottom:"10px"}}><span style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:700}}>Faction Comparison — War #{warId}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",fontWeight:700,marginBottom:"8px"}}><span style={{color:th.vic}}>{yourName} ({yourMembers.length})</span><span style={{color:th.lost}}>{theirName} ({theirMembers.length})</span></div><CompareBar label="Total Xanax" yourVal={yourTotals.xantaken} theirVal={theirTotals.xantaken} theme={th}/><CompareBar label="Total Refills" yourVal={yourTotals.refills} theirVal={theirTotals.refills} theme={th}/><CompareBar label="Stat Enhancers" yourVal={yourTotals.statenhancersused} theirVal={theirTotals.statenhancersused} theme={th}/><CompareBar label="Attacks Won" yourVal={yourTotals.attackswon} theirVal={theirTotals.attackswon} theme={th}/><CompareBar label="Defends Won" yourVal={yourTotals.defendswon} theirVal={theirTotals.defendswon} theme={th}/><CompareBar label="Total Networth" yourVal={yourTotals.networth} theirVal={theirTotals.networth} theme={th}/><CompareBar label="Drugs Used" yourVal={yourTotals.drugsused} theirVal={theirTotals.drugsused} theme={th}/><CompareBar label="Overdoses" yourVal={yourTotals.overdosed} theirVal={theirTotals.overdosed} theme={th}/></div>)}

        {(yourMembers.length>0||theirMembers.length>0)&&(<><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}><div style={{height:"1px",flex:1,background:th.iron}}/><span style={{fontSize:"11px",color:th.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px"}}>Lifetime Totals</span><div style={{height:"1px",flex:1,background:th.iron}}/><button onClick={()=>setRC(!reconCompact)} style={{background:th.card,border:`1px solid ${reconCompact?th.gD:th.iron}`,padding:"3px 10px",color:reconCompact?th.gold:th.bD,fontSize:"10px",cursor:"pointer",fontFamily:"Arial,sans-serif",whiteSpace:"nowrap"}}>{reconCompact?"▶ Full Table":"◀ Short Table"}</button></div><div style={{display:"flex",gap:"14px",flexWrap:"wrap",marginBottom:"20px"}}>{yourMembers.length>0&&<ReconTable members={yourMembers} title={yourName} accent={th.vic} theme={th} sortCol={sortCol} sortAsc={sortAsc} onSort={doSort} compact={reconCompact} mirror={true}/>}{theirMembers.length>0&&<ReconTable members={theirMembers} title={theirName} accent={th.lost} theme={th} sortCol={sortCol} sortAsc={sortAsc} onSort={doSort} compact={reconCompact}/>}</div></>)}

        {(yourDeltas||theirDeltas)&&(<><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",marginTop:"10px"}}><div style={{height:"1px",flex:1,background:th.gold+"50"}}/><span style={{fontSize:"11px",color:th.gB,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px"}}>Recent Activity (last {hoursFilter}h) — Changes Since Tracking Started</span><div style={{height:"1px",flex:1,background:th.gold+"50"}}/></div><div style={{background:th.n==="dark"?"#0d0d0f":"#f2ede2",border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"20px"}}><div style={{fontSize:"11px",color:th.bD,marginBottom:"10px",lineHeight:1.5}}>These tables show <strong style={{color:th.bone}}>what changed</strong> in the last {hoursFilter} hours — green numbers mean increases since tracking started. Sort by any column to spot who's been most active.</div><div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>{yourDeltas&&<ReconTable members={yourDeltas} title={`${yourName} — Δ`} accent={th.vic} theme={th} sortCol={deltaSortCol} sortAsc={deltaSortAsc} onSort={doDeltaSort} statsList={DELTA_STATS} isDelta={true}/>}{theirDeltas&&<ReconTable members={theirDeltas} title={`${theirName} — Δ`} accent={th.lost} theme={th} sortCol={deltaSortCol} sortAsc={deltaSortAsc} onSort={doDeltaSort} statsList={DELTA_STATS} isDelta={true}/>}</div></div></>)}

        {/* Empty state – shown when no members loaded */}
        {!yourMembers.length && !loading && (
          <div style={{textAlign:"center", padding:"50px 20px", color:th.steel}}>
            <Cross size={36} color={th.iron}/>
            <div style={{fontSize:"14px", fontWeight:700, color:th.bD, marginTop:"10px", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px"}}>
              Pre-War Intelligence
            </div>
            <div style={{fontSize:"11px", maxWidth:"500px", margin:"0 auto", lineHeight:1.7}}>
              Click <strong style={{color:th.bone}}>🔍 Recon Enemy</strong> to automatically detect your current ranked war opponent and pull live stats for every member – xanax, attacks, refills, networth, and more.
            </div>
            <div style={{fontSize:"11px", maxWidth:"500px", margin:"0 auto", lineHeight:1.7, marginTop:"8px", color:th.bD}}>
              <strong style={{color:th.bone}}>How it works:</strong> First load takes ~30 seconds. After that, stats are <strong>automatically refreshed every hour</strong>. Over time, WarForge builds a picture of what each player is doing – who's popping xanax, who's attacking, who's active. The longer you track, the more you see.
            </div>
          </div>
        )}
      </div> 

      <footer style={{borderTop:`1px solid ${th.cb}`, padding:"12px 20px", marginTop:"30px", textAlign:"center", background:th.hBg}}>
        <div style={{fontSize:"10px", color:th.steel}}>
          <span style={{color:th.gD, fontWeight:700, letterSpacing:"1px"}}>WARFORGE</span>
          <span style={{margin:"0 6px", color:th.iron}}>│</span>
          Recon · All data is publicly visible on Torn profiles
        </div>
      </footer>
    </div> 
  </>);
}

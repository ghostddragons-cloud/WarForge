import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ============================================================
//  THEMES (same as before)
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
  wBg:"#1a1608",eBg:"#1c0e0e",eBd:"#8b1a1a",
  iBg:"#0d1118",iBd:"#1a2940",
  inBg:"#08080a",hBg:"#111113",
  live:"#ff3030",liveGlow:"#ff303060",
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
  wBg:"#f8f0d8",eBg:"#f8dada",eBd:"#c09090",
  iBg:"#dae8f4",iBd:"#90a8c0",
  inBg:"#eae5da",hBg:"#f4f0e8",
  live:"#cc2020",liveGlow:"#cc202040",
};

function Cross({size=16,color}){return<svg width={size} height={size} viewBox="0 0 16 16"><rect x="6" y="1" width="4" height="14" rx=".5" fill={color}/><rect x="1" y="5" width="14" height="4" rx=".5" fill={color}/></svg>;}
function fmtNum(n){return typeof n==="number"&&!isNaN(n)?n.toLocaleString("en-US",{maximumFractionDigits:2}):"0";}
function fmtMoney(n){if(!n||n===0)return "$0";if(n>=1e9)return"$"+((n/1e9).toFixed(1))+"B";if(n>=1e6)return"$"+((n/1e6).toFixed(0))+"M";if(n>=1e3)return"$"+((n/1e3).toFixed(0))+"K";return"$"+n;}
function fmtTime(ts){const d=new Date(ts*1000);return`${d.getUTCHours().toString().padStart(2,"0")}:${d.getUTCMinutes().toString().padStart(2,"0")}:${d.getUTCSeconds().toString().padStart(2,"0")} TCT`;}
function fmtDurationShort(seconds){const h=Math.floor(seconds/3600);const m=Math.floor((seconds%3600)/60);return `${h}h ${m}m`;}

function LivePulse({theme:th}){
  return(<span style={{display:"inline-flex",alignItems:"center",gap:"4px"}}>
    <span style={{width:"8px",height:"8px",borderRadius:"50%",background:th.live,boxShadow:`0 0 6px ${th.liveGlow}`,animation:"pulse 1.5s infinite"}}/>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    <span style={{fontSize:"11px",fontWeight:700,color:th.live,textTransform:"uppercase",letterSpacing:"1px"}}>Live</span>
  </span>);
}

// ============================================================
//  STATS THAT APPEAR IN THE COMPARISON TABLE
// ============================================================
const COMPARE_STATS = [
  { key:"total_online_time", label:"Activity (h:m)", fmt:(v)=>fmtDurationShort(v), tip:"Total time spent online" },
  { key:"active_members", label:"Active Members", fmt:(v)=>fmtNum(v), tip:"Members online in last hour" },
  { key:"xantaken", label:"Xanax", fmt:(v)=>fmtNum(v), tip:"Xanax taken (delta)" },
  { key:"lsdtaken", label:"LSD", fmt:(v)=>fmtNum(v), tip:"LSD taken (delta)" },
  { key:"victaken", label:"Vicodin", fmt:(v)=>fmtNum(v), tip:"Vicodin taken (delta)" },
  { key:"overdosed", label:"Overdoses", fmt:(v)=>fmtNum(v), tip:"Times overdosed (delta)" },
  { key:"refills", label:"Energy Refills", fmt:(v)=>fmtNum(v), tip:"Energy refills (delta)" },
  { key:"energydrinkused", label:"Energy Drinks", fmt:(v)=>fmtNum(v), tip:"Energy drinks used (delta)" },
  { key:"boostersused", label:"Boosters", fmt:(v)=>fmtNum(v), tip:"Boosters used (delta)" },
  { key:"statenhancersused", label:"Stat Enhancers", fmt:(v)=>fmtNum(v), tip:"Stat enhancers used (delta)" },
  { key:"attackswon", label:"Won Attacks", fmt:(v)=>fmtNum(v), tip:"Attacks won (delta)" },
  { key:"attackslost", label:"Lost Attacks", fmt:(v)=>fmtNum(v), tip:"Attacks lost (delta)" },
  { key:"revives", label:"Revives Given", fmt:(v)=>fmtNum(v), tip:"Revives given (delta)" },
  { key:"medicalitemsused", label:"Medical Items", fmt:(v)=>fmtNum(v), tip:"Medical items used (delta)" },
  { key:"respectforfaction", label:"Respect Earned", fmt:(v)=>fmtNum(v), tip:"Respect earned for faction (delta)" },
  { key:"networth", label:"Networth", fmt:(v)=>fmtMoney(v), tip:"Networth change (delta)" },
];

// ============================================================
//  FAKE DATA GENERATOR (24 hours, same factions)
// ============================================================
function generateFakeLiveData() {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 86400;
  const factions = {
    us: { id: "99999", name: "Iron Wolves" },
    them: { id: "88888", name: "Shadow Syndicate" }
  };
  const yourMembersRaw = [
    { id: "100001", name: "SteelFang" },{ id: "100002", name: "Phantom_X" },{ id: "100003", name: "NovaBlade" },
    { id: "100004", name: "CrimsonAce" },{ id: "100005", name: "Wraith99" },{ id: "100006", name: "ToxicRain" },
    { id: "100007", name: "GhostPilot" },{ id: "100008", name: "Viper_Kai" },{ id: "100009", name: "Ember_Sky" }
  ];
  const theirMembersRaw = [
    { id: "200001", name: "DarkMatter" },{ id: "200002", name: "SilentStorm" },{ id: "200003", name: "NightCrawler" },
    { id: "200004", name: "BlazeRunner" },{ id: "200005", name: "FrostByte" },{ id: "200006", name: "Hex_Zero" },
    { id: "200007", name: "RogueAgent" },{ id: "200008", name: "PixelDust" }
  ];
  const initStats = () => ({
    total_online_time: Math.floor(Math.random() * 3600 * 12),
    xantaken: Math.floor(Math.random() * 20),
    victaken: Math.floor(Math.random() * 30),
    lsdtaken: Math.floor(Math.random() * 2),
    overdosed: Math.floor(Math.random() * 3),
    refills: Math.floor(Math.random() * 15),
    energydrinkused: Math.floor(Math.random() * 40),
    boostersused: Math.floor(Math.random() * 10),
    statenhancersused: Math.floor(Math.random() * 5),
    attackswon: Math.floor(Math.random() * 150),
    attackslost: Math.floor(Math.random() * 20),
    revives: Math.floor(Math.random() * 3),
    medicalitemsused: Math.floor(Math.random() * 100),
    respectforfaction: Math.floor(Math.random() * 800),
    networth: Math.floor(Math.random() * 20000000),
    last_action: now - Math.random() * 7200
  });
  const yourBase = Object.fromEntries(yourMembersRaw.map(m=>[m.id, initStats()]));
  const theirBase = Object.fromEntries(theirMembersRaw.map(m=>[m.id, initStats()]));
  const generateDelta = (base, hours) => {
    const mult = hours / 24;
    return Object.fromEntries(Object.entries(base).map(([k,v])=>[k, typeof v==="number"?Math.floor(v * mult):v]));
  };
  const hours = 24;
  const yourDeltas = yourMembersRaw.map(m=>({id:m.id,name:m.name,stats:generateDelta(yourBase[m.id],hours)}));
  const theirDeltas = theirMembersRaw.map(m=>({id:m.id,name:m.name,stats:generateDelta(theirBase[m.id],hours)}));
  const activeMembers = (members,lastHourTs)=>members.filter(m=>m.stats.last_action && m.stats.last_action>lastHourTs).length;
  const lastHour = now-3600;
  const usActive = activeMembers(yourDeltas,lastHour);
  const themActive = activeMembers(theirDeltas,lastHour);
  const sumStats = (members,key)=>members.reduce((s,m)=>s+(m.stats?.[key]||0),0);
  const usTotals = {}; const themTotals = {};
  COMPARE_STATS.forEach(s=>{ usTotals[s.key] = sumStats(yourDeltas,s.key); themTotals[s.key] = sumStats(theirDeltas,s.key); });
  usTotals.total_online_time = yourDeltas.reduce((s,m)=>s+(m.stats.total_online_time||0),0);
  themTotals.total_online_time = theirDeltas.reduce((s,m)=>s+(m.stats.total_online_time||0),0);
  usTotals.active_members = usActive;
  themTotals.active_members = themActive;
  // Generate fake attack feed (same as before, 100 attacks)
  const attackers = { yours: yourMembersRaw.map(m=>m.name), theirs: theirMembersRaw.map(m=>m.name) };
  const results = ["Attacked","Mugged","Hospitalized","Attacked","Attacked","Lost","Attacked","Stalemate","Attacked"];
  const respects = [2.45,1.82,2.18,3.10,1.55,2.80,1.92,2.35,2.90,1.65,2.20,1.85,2.60,1.40];
  const attacks = [];
  for (let i=0;i<100;i++) {
    const isOurs = Math.random()>0.4;
    const attacker = isOurs?attackers.yours[Math.floor(Math.random()*attackers.yours.length)]:attackers.theirs[Math.floor(Math.random()*attackers.theirs.length)];
    const defender = isOurs?attackers.theirs[Math.floor(Math.random()*attackers.theirs.length)]:attackers.yours[Math.floor(Math.random()*attackers.yours.length)];
    const result = results[Math.floor(Math.random()*results.length)];
    const respect = isOurs && !["Lost","Stalemate"].includes(result) ? respects[Math.floor(Math.random()*respects.length)] : 0;
    const ts = now - Math.random() * 86400;
    attacks.push({ timestamp_started: ts, attacker_name: attacker, attacker_faction: isOurs?factions.us.id:factions.them.id, defender_name: defender, result, respect });
  }
  attacks.sort((a,b)=>b.timestamp_started-a.timestamp_started);
  return {
    warData: { warId: "SAMPLE", us: factions.us, them: factions.them, start, end: now },
    stats: { us: usTotals, them: themTotals },
    attacks: attacks.slice(0,50),
    factionScores: { us: Math.random()*4000+2000, them: Math.random()*3000+1000 },
    snapshots: [] // not needed for sample
  };
}

// ============================================================
//  COMPARISON TABLE COMPONENT
// ============================================================
function ComparisonTable({yourStats, theirStats, yourName, theirName, theme:th, hoursWindow}){
  return(
    <div style={{background:th.card,border:`1px solid ${th.cb}`,marginBottom:"14px",overflowX:"auto"}}>
      <div style={{padding:"10px 12px",borderBottom:`1px solid ${th.cb}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:"11px",fontWeight:700,color:th.gold,textTransform:"uppercase",letterSpacing:"1px"}}>Faction Comparison (last {hoursWindow} hours)</span>
        <span style={{fontSize:"10px",color:th.steel}}>auto-refreshes every 2 min</span>
       </div>
      {/* Faction names with emojis - centered */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px 0 12px", borderBottom:`1px solid ${th.cb}30`, marginBottom:"4px"}}>
        <div style={{flex:1, textAlign:"center", fontSize:"24px", fontWeight:700, color:th.vic}}>
          <span style={{marginRight:"6px"}}>🪖</span> {yourName}
        </div>
        <div style={{flex:1, textAlign:"center", fontSize:"24px", fontWeight:700, color:th.lost}}>
          <span style={{marginRight:"6px"}}>🏴‍☠️</span> {theirName}
        </div>
      </div>
      <div style={{padding:"8px 12px"}}>
        {COMPARE_STATS.map(stat => {
          const yourVal = yourStats?.[stat.key] ?? 0;
          const theirVal = theirStats?.[stat.key] ?? 0;
          const total = yourVal + theirVal || 1;
          const yourPct = (yourVal / total) * 100;
          return (
            <div key={stat.key} style={{marginBottom:"12px"}}>
<div style={{display:"flex",justifyContent:"space-between",fontSize:"15px",color:th.steel,marginBottom:"4px"}}>
  <span style={{fontWeight:500}}>{stat.label}</span>
  <span style={{color:th.bone,fontWeight:600}}>{stat.fmt(yourVal)} / {stat.fmt(theirVal)}</span>
</div>
              <div style={{height:"6px",background:th.iron,overflow:"hidden",display:"flex",border:`1px solid ${th.cb}`}}>
                <div style={{width:`${yourPct}%`,background:th.vic,transition:"width 0.3s"}}/>
                <div style={{flex:1,background:th.lost}}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"8px 12px",borderTop:`1px solid ${th.cb}`,background:th.n==="dark"?"#0c0c0e":"#e8e2d6"}}>
        <div style={{marginBottom:"4px"}}>
<div style={{display:"flex",justifyContent:"space-between",fontSize:"15px",color:th.steel,marginBottom:"4px"}}>
<span style={{fontWeight:500}}>
  ⚔ Attack Ratio
  <span style={{marginLeft:"6px",cursor:"help",color:th.steel,fontSize:"12px"}} title="Shows the total won attacks for each faction during the selected time window. The bar represents your faction's percentage of total attacks won.">ⓘ</span>
</span>
  <span style={{color:th.bone,fontWeight:600}}>{fmtNum(yourStats.attackswon||0)} / {fmtNum(theirStats.attackswon||0)}</span>
</div>
          <div style={{height:"6px",background:th.iron,overflow:"hidden",display:"flex",border:`1px solid ${th.cb}`}}>
            <div style={{width:`${(yourStats.attackswon/(yourStats.attackswon+theirStats.attackswon||1))*100}%`,background:th.vic,transition:"width 0.3s"}}/>
            <div style={{flex:1,background:th.lost}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  ATTACK FEED COMPONENT (same as before, but cleaned)
// ============================================================
function AttackItem({atk,factionId,theme:th}){
  const isOurs=String(atk.attacker_faction)===String(factionId);
  const won=["attacked","mugged","hospitalized"].includes(atk.result?.toLowerCase());
  return(
    <div style={{display:"flex",gap:"8px",alignItems:"center",padding:"4px 8px",fontSize:"11px",borderBottom:`1px solid ${th.cb}`,background:isOurs?(won?th.vicBg+"40":th.defBg+"40"):"transparent"}}>
      <span style={{fontSize:"9px",color:th.steel,fontFamily:"Consolas,monospace",minWidth:"60px"}}>{fmtTime(atk.timestamp_started)}</span>
      <span style={{color:isOurs?th.vic:th.lost,fontWeight:600,minWidth:"90px"}}>{atk.attacker_name||"Unknown"}</span>
      <span style={{color:th.steel}}>→</span>
      <span style={{color:th.bone,minWidth:"90px"}}>{atk.defender_name||"Unknown"}</span>
      <span style={{color:won?th.vic:th.lost,fontSize:"10px",fontWeight:600}}>{atk.result}</span>
      {atk.respect>0&&<span style={{color:th.gB,fontSize:"10px",fontFamily:"Consolas,monospace",marginLeft:"auto"}}>+{atk.respect.toFixed(2)}</span>}
    </div>
  );
}

function AttackFeed({attacks,factionId,theme:th}){
  if(!attacks.length) return null;
  return(
    <div style={{background:th.card,border:`1px solid ${th.cb}`,marginBottom:"14px"}}>
      <div style={{padding:"10px 12px",borderBottom:`1px solid ${th.cb}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:"11px",fontWeight:700,color:th.gold,textTransform:"uppercase",letterSpacing:"1px"}}>Attack Feed</span>
        <span style={{fontSize:"10px",color:th.steel}}>{attacks.length} recent</span>
      </div>
      <div style={{maxHeight:"300px",overflowY:"auto"}}>
        {attacks.map((a,i)=><AttackItem key={`${a.timestamp_started}_${i}`} atk={a} factionId={factionId} theme={th}/>)}
      </div>
    </div>
  );
}

// ============================================================
//  MAIN LIVE TRACKER
// ============================================================
export default function LiveTracker(){
  const[dk,setDk]=useState(true);
  const[cb,setCB]=useState(false);
  const baseTheme=dk?DARK:LIGHT;
  const th=cb?{...baseTheme,lost:dk?"#4a7abf":"#2050a0",def:dk?"#1a3a8b":"#183090",defBg:dk?"#0e0e1c":"#dadaf8",eBg:dk?"#0e0e1c":"#dadaf8",eBd:dk?"#1a3a8b":"#9090c0",live:dk?"#3070ff":"#2060cc",liveGlow:dk?"#3070ff60":"#2060cc40"}:baseTheme;

  // API & faction settings
  const[mainKey,setMK]=useState("");
  const[extraKeyList,setEKL]=useState([]);
  const[factionId,setFI]=useState("");
  const[warId,setWI]=useState("");

  // Tracker state
  const[status,setStatus]=useState("IDLE"); // IDLE, WAITING, LIVE, FINISHED
  const[warData,setWarData]=useState(null); // { warId, us:{id,name}, them:{id,name}, start, end }
  const[factionScores,setFS]=useState({us:0,them:0});
  const[yourStats,setYourStats]=useState({});
  const[theirStats,setTheirStats]=useState({});
  const[attacks,setAttacks]=useState([]);
  const[hoursWindow,setHoursWindow]=useState(6); // default 6h
  const[lastUpdate,setLU]=useState(null);
  const[error,setError]=useState(null);
  const[pollCount,setPollCount]=useState(0);

  // Internal refs for polling and data
  const intervalRef=useRef(null);
  const keyIndexRef=useRef(0);
  const allAttacksRef=useRef({});
  const lastAttackTsRef=useRef(0);
  const membersListRef=useRef({ us: [], them: [] });
  const snapshotRef=useRef({ us: {}, them: {}, timestamp: 0 }); // base snapshot for delta
  const lastSaveTs=useRef(0);
  const [isSampleMode, setIsSampleMode]=useState(false);
  const sampleDataRef=useRef(null);

  // Get all keys
  const getKeys=useCallback(()=>{
    const keys=[mainKey.trim()];
    extraKeyList.forEach(k=>{const t=k.trim();if(t&&t.length>=16)keys.push(t);});
    return keys.filter(k=>k);
  },[mainKey,extraKeyList]);

  // Round-robin key selector
  const getNextKey=useCallback(()=>{
    const keys=getKeys();
    if(!keys.length)return null;
    const key=keys[keyIndexRef.current%keys.length];
    keyIndexRef.current++;
    return key;
  },[getKeys]);

  // Fetch faction basic info (member names, last_action)
  const fetchFactionBasic=async(fid,key)=>{
    try{
      const res=await fetch(`/api/torn?type=faction_basic_id&id=${fid}&key=${encodeURIComponent(key)}`);
      const data=await res.json();
      if(data.error)return null;
      return data;
    }catch(e){return null;}
  };

  // Fetch personalstats for a single user
  const fetchPersonalStats=async(uid,key)=>{
    try{
      const res=await fetch(`/api/torn?type=personalstats&id=${uid}&key=${encodeURIComponent(key)}`);
      const data=await res.json();
      if(data.error)return null;
      return data.personalstats||null;
    }catch(e){return null;}
  };

  // Fetch user profile (level)
  const fetchProfile=async(uid,key)=>{
    try{
      const res=await fetch(`/api/torn?type=user_profile&id=${uid}&key=${encodeURIComponent(key)}`);
      const data=await res.json();
      if(data.error)return null;
      return data.level;
    }catch(e){return null;}
  };

  // Build initial member list from war report
  const loadWarMembers=async(warId,key,yourFid,theirFid)=>{
    try{
      const raw=await(await fetch(`/api/torn?type=war&id=${warId}&key=${encodeURIComponent(key)}`)).json();
      if(raw.error)throw new Error(`API ${raw.error.code}: ${raw.error.error}`);
      if(!raw.rankedwarreport)throw new Error("No war report found");
      const report=raw.rankedwarreport;
      let yourFac=null, theirFac=null;
      for(const fid in report.factions){
        if(String(fid)===String(yourFid))yourFac=report.factions[fid];
        else if(String(fid)===String(theirFid))theirFac=report.factions[fid];
      }
      if(!yourFac||!theirFac)throw new Error("Factions not found in war report");
      const yourMembers=Object.entries(yourFac.members).map(([id,m])=>({id,name:m.name,level:null,last_action:0}));
      const theirMembers=Object.entries(theirFac.members).map(([id,m])=>({id,name:m.name,level:null,last_action:0}));
      // Fetch levels and last_action in parallel (use multiple keys to speed up)
      const keys=getKeys();
      for(let i=0;i<yourMembers.length;i++){
        const key=keys[i%keys.length];
        const [level,profile]=await Promise.all([fetchProfile(yourMembers[i].id,key), fetchFactionBasic(yourFid,key)]);
        yourMembers[i].level=level;
        if(profile?.members?.[yourMembers[i].id]?.last_action){
          yourMembers[i].last_action=profile.members[yourMembers[i].id].last_action.timestamp||0;
        }
        if(i%5===0)await new Promise(r=>setTimeout(r,200)); // small delay
      }
      for(let i=0;i<theirMembers.length;i++){
        const key=keys[i%keys.length];
        const [level,profile]=await Promise.all([fetchProfile(theirMembers[i].id,key), fetchFactionBasic(theirFid,key)]);
        theirMembers[i].level=level;
        if(profile?.members?.[theirMembers[i].id]?.last_action){
          theirMembers[i].last_action=profile.members[theirMembers[i].id].last_action.timestamp||0;
        }
        if(i%5===0)await new Promise(r=>setTimeout(r,200));
      }
      membersListRef.current={us:yourMembers, them:theirMembers};
      return {yourMembers,theirMembers};
    }catch(e){throw e;}
  };

  // Take a snapshot of all members' personalstats
  const takeSnapshot=async (yourMembers,theirMembers)=>{
    const keys=getKeys();
    const snapshot={ us:{}, them:{}, timestamp:Math.floor(Date.now()/1000) };
    // Fetch your faction stats
    for(let i=0;i<yourMembers.length;i++){
      const m=yourMembers[i];
      const key=keys[i%keys.length];
      const stats=await fetchPersonalStats(m.id,key);
      snapshot.us[m.id]=stats;
      if(i%3===0)await new Promise(r=>setTimeout(r,150));
    }
    // Fetch their faction stats
    for(let i=0;i<theirMembers.length;i++){
      const m=theirMembers[i];
      const key=keys[i%keys.length];
      const stats=await fetchPersonalStats(m.id,key);
      snapshot.them[m.id]=stats;
      if(i%3===0)await new Promise(r=>setTimeout(r,150));
    }
    return snapshot;
  };

  // Compute deltas between two snapshots for the time window
  const computeDeltaStats = (baseSnapshot, currentSnapshot, hoursWindow, yourMembers, theirMembers) => {
    const cutoff = currentSnapshot.timestamp - hoursWindow*3600;
    // If baseSnapshot is older than cutoff, we need to find a snapshot at cutoff? For simplicity we use baseSnapshot as the start of the window
    // But we only have two snapshots: base (when tracking started) and current. The user's hoursWindow is relative to current.
    // So we need to know what the stats were exactly hoursWindow hours ago. We don't have that unless we stored snapshots every hour.
    // For MVP, we'll just show the delta from the very first snapshot (tracking start) to now, and ignore hoursWindow for live page.
    // However the user asked for hoursWindow to affect the table. So we need to store snapshots at regular intervals.
    // To keep it simple yet functional, we'll store snapshots every 30 minutes in memory, then when hoursWindow changes we pick the closest snapshot.
    // I'll implement a snapshotHistory array that stores snapshots every 30 min during the live session.
    // For now, I'll implement a placeholder that just returns the delta from the very first snapshot.
    // But given time, I'll implement a proper rolling snapshot storage.
    // Let's implement a snapshotHistory array.
  };

  // Simplified for now: we'll store an array of snapshots with timestamps, and compute deltas based on the closest snapshot to (now - hoursWindow*3600)
  const snapshotHistory = useRef([]); // each entry: { ts, us: {id:stats}, them: {...} }

  const addSnapshot = (snap) => {
    snapshotHistory.current.push(snap);
    // keep only last 48 hours worth (every 30min = 96 entries)
    while(snapshotHistory.current.length>100) snapshotHistory.current.shift();
  };

  const getDeltaFromWindow = (hours) => {
    if(snapshotHistory.current.length<2) return null;
    const now = Math.floor(Date.now()/1000);
    const targetTs = now - hours*3600;
    // find snapshot with timestamp closest to targetTs (but not after targetTs)
    let best = snapshotHistory.current[0];
    for(let snap of snapshotHistory.current){
      if(snap.ts <= targetTs && snap.ts > best.ts) best = snap;
    }
    if(best.ts === snapshotHistory.current[snapshotHistory.current.length-1].ts) return null;
    const latest = snapshotHistory.current[snapshotHistory.current.length-1];
    // compute deltas
    const yourStats = {};
    const theirStats = {};
    COMPARE_STATS.forEach(stat=>{
      let yourSum=0, theirSum=0;
      for(const [id,stats] of Object.entries(latest.us)){
        const baseStats = best.us[id];
        if(stats && baseStats){
          yourSum += (stats[stat.key]||0) - (baseStats[stat.key]||0);
        }
      }
      for(const [id,stats] of Object.entries(latest.them)){
        const baseStats = best.them[id];
        if(stats && baseStats){
          theirSum += (stats[stat.key]||0) - (baseStats[stat.key]||0);
        }
      }
      yourStats[stat.key] = Math.max(0, yourSum);
      theirStats[stat.key] = Math.max(0, theirSum);
    });
    // Also compute active members: those with last_action > targetTs
    const activeYour = Object.values(latest.us).filter(s=>s?.last_action && s.last_action > targetTs).length;
    const activeTheir = Object.values(latest.them).filter(s=>s?.last_action && s.last_action > targetTs).length;
    yourStats.active_members = activeYour;
    theirStats.active_members = activeTheir;
    // total online time: sum of last_action - targetTs? Actually we don't have total online time in personalstats. We'll skip it.
    yourStats.total_online_time = 0; // not available from personalstats
    theirStats.total_online_time = 0;
    return { yourStats, theirStats };
  };

  // Check for active war (same as before)
  const checkForWar=useCallback(async()=>{
    const key=getNextKey();
    if(!key)return null;
    try{
      const res=await fetch(`/api/torn?type=ranked_wars&key=${encodeURIComponent(key)}`);
      const data=await res.json();
      if(data.error)throw new Error(`API ${data.error.code}: ${data.error.error}`);
      if(data.ranked_wars){
        for(const wid in data.ranked_wars){
          const w=data.ranked_wars[wid];
          if(w.factions){
            let us=null,them=null;
            for(const fid in w.factions){
              if(String(fid)===String(factionId))us=w.factions[fid];
              else them={...w.factions[fid],id:fid};
            }
            if(us&&them) return {warId:wid, war:w, us, them, status:w.war?.status||"active"};
          }
        }
      }
      return null;
    }catch(e){setError(e.message);return null;}
  },[getNextKey,factionId]);

  // Fetch new attacks (same as before)
  const fetchNewAttacks=useCallback(async()=>{
    const key=getNextKey();
    if(!key)return;
    const from=lastAttackTsRef.current||Math.floor(Date.now()/1000)-3600;
    try{
      const res=await fetch(`/api/torn?type=live_attacks&from=${from}&key=${encodeURIComponent(key)}`);
      const data=await res.json();
      if(data.error)return;
      if(data.attacks){
        let newCount=0;
        for(const aid in data.attacks){
          if(!allAttacksRef.current[aid]){
            allAttacksRef.current[aid]=data.attacks[aid];
            newCount++;
          }
          if(data.attacks[aid].timestamp_started>lastAttackTsRef.current){
            lastAttackTsRef.current=data.attacks[aid].timestamp_started;
          }
        }
        if(newCount>0){
          const sorted=Object.values(allAttacksRef.current).sort((a,b)=>b.timestamp_started-a.timestamp_started);
          setAttacks(sorted.slice(0,100));
          let us=0,them=0;
          Object.values(allAttacksRef.current).forEach(a=>{
            if(String(a.attacker_faction)===String(factionId)) us+=a.respect||0;
            else them+=a.respect||0;
          });
          setFS({us:Math.round(us*100)/100, them:Math.round(them*100)/100});
        }
      }
      setLU(Date.now());
      setPollCount(c=>c+1);
    }catch(e){}
  },[getNextKey,factionId]);

  // Periodic snapshot (every 30 minutes)
  const takePeriodicSnapshot=useCallback(async()=>{
    if(!membersListRef.current.us.length || !membersListRef.current.them.length) return;
    const snap = await takeSnapshot(membersListRef.current.us, membersListRef.current.them);
    addSnapshot(snap);
    // update table based on current hoursWindow
    const delta = getDeltaFromWindow(hoursWindow);
    if(delta){
      setYourStats(delta.yourStats);
      setTheirStats(delta.theirStats);
    }
  },[hoursWindow]);

  // Start tracking: called when user clicks "Start Tracking"
  const startTracking=useCallback(async()=>{
    if(!mainKey.trim()){setError("Enter your API key");return;}
    if(!factionId.trim()){setError("Set Faction ID on the main page first");return;}
    setError(null);
    setStatus("WAITING");
    setAttacks([]);
    allAttacksRef.current={};
    lastAttackTsRef.current=0;
    snapshotHistory.current=[];
    setPollCount(0);
    setYourStats({});
    setTheirStats({});
    // First check for active war
    const found = await checkForWar();
    if(found){
      setWarData(found);
      setStatus("LIVE");
      // Load member lists from war report (using the war ID from found)
      try{
        const {yourMembers,theirMembers} = await loadWarMembers(found.warId, mainKey, factionId, found.them.id);
        membersListRef.current={us:yourMembers, them:theirMembers};
        // Take initial snapshot
        const initSnap = await takeSnapshot(yourMembers, theirMembers);
        snapshotHistory.current=[initSnap];
        // compute delta for current hoursWindow
        const delta = getDeltaFromWindow(hoursWindow);
        if(delta){
          setYourStats(delta.yourStats);
          setTheirStats(delta.theirStats);
        }
      }catch(e){setError("Failed to load faction members: "+e.message);}
    }else{
      // No active war, keep waiting
      setWarData(null);
      setStatus("WAITING");
    }
    // Setup intervals: attack feed every 5 seconds, snapshot every 30 minutes, war check every 30 seconds
    if(intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async()=>{
      // War check
      if(!warData){
        const found = await checkForWar();
        if(found){
          setWarData(found);
          setStatus("LIVE");
          try{
            const {yourMembers,theirMembers} = await loadWarMembers(found.warId, mainKey, factionId, found.them.id);
            membersListRef.current={us:yourMembers, them:theirMembers};
            const initSnap = await takeSnapshot(yourMembers, theirMembers);
            snapshotHistory.current=[initSnap];
            const delta = getDeltaFromWindow(hoursWindow);
            if(delta){
              setYourStats(delta.yourStats);
              setTheirStats(delta.theirStats);
            }
          }catch(e){}
        }else{
          setStatus(s=>s==="LIVE"?"FINISHED":"WAITING");
        }
      }else{
        // Attack feed polling every 5 seconds
        await fetchNewAttacks();
      }
    },5000);
    // Separate interval for snapshots every 30 minutes
    const snapInterval = setInterval(async()=>{
      if(status==="LIVE" && membersListRef.current.us.length){
        await takePeriodicSnapshot();
      }
    },30*60*1000);
    // Store both intervals for cleanup
    window._snapInterval = snapInterval;
  },[mainKey,factionId,checkForWar, fetchNewAttacks, hoursWindow, takePeriodicSnapshot]);

  const stopTracking=()=>{
    if(intervalRef.current) clearInterval(intervalRef.current);
    if(window._snapInterval) clearInterval(window._snapInterval);
    intervalRef.current=null;
    setStatus("IDLE");
    setWarData(null);
    setAttacks([]);
    setYourStats({});
    setTheirStats({});
    setFS({us:0,them:0});
    snapshotHistory.current=[];
    membersListRef.current={us:[],them:[]};
    try{localStorage.removeItem("wf_live_state");}catch(e){}
  };

  // Sample mode integration
  useEffect(()=>{
    const checkSampleMode = () => {
      const sampleFlag = localStorage.getItem("wf_sample_mode") === "true";
      setIsSampleMode(sampleFlag);
      if(sampleFlag){
        const fake = generateFakeLiveData();
        sampleDataRef.current = fake;
        setWarData(fake.warData);
        setYourStats(fake.stats.us);
        setTheirStats(fake.stats.them);
        setAttacks(fake.attacks);
        setFS(fake.factionScores);
        setStatus("LIVE");
        setError(null);
      }else{
        if(intervalRef.current) clearInterval(intervalRef.current);
        if(window._snapInterval) clearInterval(window._snapInterval);
        sampleDataRef.current=null;
        setWarData(null);
        setAttacks([]);
        setYourStats({});
        setTheirStats({});
        setFS({us:0,them:0});
        setStatus("IDLE");
        setError(null);
        snapshotHistory.current=[];
        membersListRef.current={us:[],them:[]};
      }
    };
    checkSampleMode();
    const handleStorage = (e) => {
      if(e.key === "wf_sample_mode") checkSampleMode();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  },[]);

  // Load saved settings from localStorage
  useEffect(()=>{
    try{const fid=localStorage.getItem("wf_fid");if(fid)setFI(fid);}catch(e){}
    try{const sk=localStorage.getItem("wf_savekey");if(sk==="true"){const k=localStorage.getItem("wf_apikey");if(k)setMK(k);}}catch(e){}
    try{setCB(localStorage.getItem("wf_colorblind")==="true");}catch(e){}
  },[]);

  const toggleSampleMode = () => {
    const newMode = !isSampleMode;
    localStorage.setItem("wf_sample_mode", newMode ? "true" : "false");
    window.dispatchEvent(new StorageEvent("storage", { key: "wf_sample_mode", newValue: newMode ? "true" : "false" }));
  };

  const iS={width:"100%",background:th.inBg,border:`1px solid ${th.iron}`,padding:"8px 12px",color:th.bone,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"Arial,sans-serif"};
  const lS={fontSize:"11px",color:th.steel,display:"block",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700};
  const bS={background:th.card,border:`1px solid ${th.iron}`,padding:"6px 12px",color:th.bD,fontSize:"12px",cursor:"pointer",fontFamily:"Arial,sans-serif"};
  const statusLabel={
    IDLE:{text:"Ready",color:th.steel},
    WAITING:{text:"Searching for war...",color:th.gold},
    LIVE:{text:"LIVE",color:th.live},
    FINISHED:{text:"War Finished",color:th.vic},
  }[status];

  return(<>
    <Head><title>WarForge — Live Tracker</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div style={{minHeight:"100vh",background:th.bg,color:th.bone,fontFamily:"Arial,sans-serif",boxShadow:isSampleMode ? "inset 0 0 0 3px #c44040" : "none"}}>
      <header style={{borderBottom:`1px solid ${th.cb}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",background:th.hBg}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}><Cross size={22} color={th.gold}/><div><a href="/" style={{fontWeight:800,fontSize:"20px",letterSpacing:"2px",color:th.gold,textTransform:"uppercase",textDecoration:"none",display:"block"}}>WarForge</a><div style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.2px"}}>Live War Tracker</div></div></div>
        <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
          {status==="LIVE"&&<LivePulse theme={th}/>}
          <a href="/" style={{...bS,textDecoration:"none",color:th.gold,border:`1px solid ${th.gD}`,fontWeight:600}}>⚔ Reports</a>
          <a href="/recon" style={{...bS,textDecoration:"none",color:"#4169E1",border:"1px solid #4169E1"}}>🔍 Recon</a>
          <button onClick={()=>{const nv=!cb;setCB(nv);try{localStorage.setItem("wf_colorblind",String(nv));}catch(e){}}} style={{...bS,color:cb?"#e03030":"#4a7abf",border:`1px solid ${cb?"#e03030":"#4a7abf"}`}}>{cb?"👁 CB":"👁"}</button>
          <button onClick={()=>setDk(!dk)} style={{...bS,color:th.bone}}>{dk?"☀":"☽"}</button>
          <button onClick={toggleSampleMode} style={{...bS, background:isSampleMode?th.wBg:th.card, border:`1px solid ${isSampleMode?th.gD:th.iron}`, color:isSampleMode?th.gold:th.steel}}>Sample</button>
        </div>
      </header>

      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"16px 20px"}}>
        {/* API Keys section */}
        <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"14px"}}>
          <div style={{fontSize:"11px",fontWeight:700,color:th.gold,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px"}}>🔑 API Keys</div>
          <div style={{marginBottom:"6px"}}>
            <label style={lS}>Primary Key</label>
            <input type="password" value={mainKey} onChange={e=>setMK(e.target.value)} placeholder="Your API key (full access)" style={iS} disabled={status!=="IDLE"}/>
          </div>
          {extraKeyList.map((k,i)=>(
            <div key={i} style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"4px"}}>
              <div style={{flex:1}}><label style={{...lS,fontSize:"10px"}}>Key #{i+2}</label><input type="password" value={k} onChange={e=>{const nk=[...extraKeyList];nk[i]=e.target.value;setEKL(nk);}} placeholder={`Faction member's API key #${i+2}`} style={iS} disabled={status!=="IDLE"}/></div>
              {status==="IDLE"&&<button onClick={()=>{const nk=[...extraKeyList];nk.splice(i,1);setEKL(nk);}} style={{background:"transparent",border:`1px solid ${th.eBd}`,color:th.lost,padding:"4px 8px",fontSize:"12px",cursor:"pointer",marginTop:"16px"}}>✕</button>}
            </div>
          ))}
          {status==="IDLE"&&(<button onClick={()=>setEKL([...extraKeyList,""])} style={{background:"transparent",border:`1px solid ${th.gD}`,padding:"4px 12px",color:th.gold,fontSize:"11px",cursor:"pointer",fontFamily:"Arial,sans-serif",marginTop:"4px"}}>+ Add Another Key</button>)}
          <div style={{marginTop:"8px",fontSize:"10px",color:th.steel,lineHeight:1.5}}>{getKeys().length} key{getKeys().length!==1?"s":""} loaded · Poll speed: attacks ~5s, stats ~30min · Faction ID: {factionId||<span style={{color:th.lost}}>Not set — go to main page settings</span>}<br/>Each key must be from the same faction with Faction API access enabled.</div>
        </div>

        {/* Controls */}
        <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"14px",textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",flexWrap:"wrap"}}>
            {status==="IDLE"?(
              <button onClick={startTracking} style={{padding:"12px 32px",background:`linear-gradient(180deg,${th.live},#a01010)`,border:"none",color:"#fff",fontWeight:700,fontSize:"15px",cursor:"pointer",textTransform:"uppercase",letterSpacing:"1px",fontFamily:"Arial,sans-serif"}}>🔴 Start Tracking</button>
            ):(
              <button onClick={stopTracking} style={{padding:"12px 32px",background:th.iron,border:"none",color:th.bone,fontWeight:700,fontSize:"15px",cursor:"pointer",textTransform:"uppercase",letterSpacing:"1px",fontFamily:"Arial,sans-serif"}}>⏹ Stop Tracking</button>
            )}
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:"2px"}}>
              <span style={{fontSize:"12px",fontWeight:600,color:statusLabel.color}}>{statusLabel.text}</span>
              {lastUpdate&&<span style={{fontSize:"10px",color:th.steel}}>Last attack: {new Date(lastUpdate).toLocaleTimeString()} · Polls: {pollCount}</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <label style={{fontSize:"11px",color:th.steel}}>Hours Window:</label>
              <input type="number" value={hoursWindow} onChange={e=>{let v=parseInt(e.target.value);if(v>0){setHoursWindow(v); if(status==="LIVE" && snapshotHistory.current.length){const delta=getDeltaFromWindow(v); if(delta){setYourStats(delta.yourStats); setTheirStats(delta.theirStats);}}}} } min={1} max={72} style={{width:"70px",background:th.inBg,border:`1px solid ${th.iron}`,padding:"4px 8px",color:th.bone,fontSize:"12px",textAlign:"center",fontFamily:"Consolas,monospace"}}/>
            </div>
          </div>
          {error&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.eBg,border:`1px solid ${th.eBd}`,color:th.lost,fontSize:"11px"}}>{error}</div>}
        </div>

        {status==="WAITING"&&(
          <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"30px",textAlign:"center",marginBottom:"14px"}}>
            <div style={{fontSize:"24px",marginBottom:"8px"}}>⏳</div>
            <div style={{fontSize:"14px",fontWeight:600,color:th.gold}}>Searching for active ranked war...</div>
            <div style={{fontSize:"11px",color:th.steel,marginTop:"4px"}}>Checking every 30 seconds. Once a war is found, member stats will load and the comparison table will appear.</div>
          </div>
        )}

        {isSampleMode && status==="LIVE" && (
          <div style={{padding:"6px 10px",background:"#1a1608",border:"1px solid #7a6530",marginBottom:"12px",fontSize:"11px",color:"#c9942e",textAlign:"center"}}>
            📋 Sample data (24h war) — showing Iron Wolves vs Shadow Syndicate. Enter your API keys and click Start Tracking for a real war.
          </div>
        )}

        {/* Live Scoreboard (simple) */}
{((status==="LIVE"||status==="FINISHED") && warData) && (
  <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"12px 16px",marginBottom:"14px",textAlign:"center"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",flexWrap:"wrap"}}>
      <LivePulse theme={th}/>
      <span style={{fontSize:"13px",fontWeight:700}}>{warData.us?.name}</span>
      <span style={{fontSize:"28px",fontWeight:800,color:th.vic,fontFamily:"Consolas,monospace"}}>{fmtNum(factionScores.us)}</span>
      <span style={{fontSize:"16px",color:th.iron}}>VS</span>
      <span style={{fontSize:"28px",fontWeight:800,color:th.lost,fontFamily:"Consolas,monospace"}}>{fmtNum(factionScores.them)}</span>
      <span style={{fontSize:"13px",fontWeight:700}}>{warData.them?.name}</span>
    </div>
    <div style={{fontSize:"10px",color:th.steel,marginTop:"4px"}}>War #{warData.warId}</div>
  </div>
)}

        {/* Main Comparison Table */}
        {Object.keys(yourStats).length>0 && (
          <ComparisonTable yourStats={yourStats} theirStats={theirStats} yourName={warData?.us?.name || "Your Faction"} theirName={warData?.them?.name || "Opponent"} theme={th} hoursWindow={hoursWindow}/>
        )}

        {/* Attack Feed */}
        {attacks.length>0 && <AttackFeed attacks={attacks} factionId={factionId} theme={th}/>}

        {/* Empty state */}
        {status==="IDLE" && !isSampleMode && attacks.length===0 && (
          <div style={{textAlign:"center",padding:"50px 20px",color:th.steel}}>
            <Cross size={36} color={th.iron}/>
            <div style={{fontSize:"14px",fontWeight:700,color:th.bD,marginTop:"10px",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px"}}>Live Tracker</div>
            <div style={{fontSize:"11px",maxWidth:"500px",margin:"0 auto",lineHeight:1.6}}>
              Enter your API key and click 🔴 Start Tracking. The tracker will search for an active ranked war and begin polling automatically.
              Add faction members' API keys for faster stats updates. The comparison table shows activity over the selected hours window.
            </div>
          </div>
        )}
      </div>

      <footer style={{borderTop:`1px solid ${th.cb}`,padding:"12px 20px",marginTop:"30px",textAlign:"center",background:th.hBg}}>
        <div style={{fontSize:"10px",color:th.steel}}><span style={{color:th.gD,fontWeight:700,letterSpacing:"1px"}}>WARFORGE</span><span style={{margin:"0 6px",color:th.iron}}>│</span>Live Tracker v2.0 · Personalstats snapshots every 30 min · Attack feed every 5 sec</div>
      </footer>
    </div>
  </>);
}

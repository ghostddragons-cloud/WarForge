import { useState, useEffect } from 'react';
import Head from 'next/head';

/*
 * ================================================================
 *  WARFORGE v1.0 — Major cleanup
 * ================================================================
 *  v1.0 — 2026-04-05
 *    [MOVE] API key + Remember toggle moved into ⚙ Settings panel.
 *           Input bar now shows only War ID + Load War button.
 *           Cleaner first impression — just enter a war ID and go.
 *    [NEW]  Graph rebuilt from scratch:
 *           - Taller (220px viewbox), wider area
 *           - Area fill under both lines (semi-transparent)
 *           - Proper legend showing faction names + colors
 *           - Day markers with vertical dashed lines
 *           - Y-axis label, better grid, end-score labels
 *           - Smooth rendering with rounded joins
 *    [FIX]  Settings auto-opens if API key is missing on Load War
 *    [FIX]  Empty state message adapts: no key → "set up in settings"
 *    [FIX]  Header cleanup — removed duplicate Hide button
 *    [FIX]  Changelog version updated throughout
 * ================================================================
 */

// ============================================================
//  THEMES
// ============================================================
const DARK = {
  n:"dark",bg:"#08080a",card:"#111113",cb:"#1f1d19",
  rA:"#111113",rB:"#191920",
  gold:"#c9942e",gB:"#e2b650",gD:"#7a6530",
  iron:"#3a3632",steel:"#706a5e",
  bone:"#d4cfc4",bD:"#8a847a",
  vic:"#4a9e3e",vicBg:"#1a2e14",vicFill:"#4a9e3e18",
  def:"#8b1a1a",defBg:"#1c0e0e",
  link:"#7aade0",chain:"#4a9e3e",asst:"#5b8fce",lost:"#c44040",lostFill:"#c4404018",
  wBg:"#1a1608",eBg:"#1c0e0e",eBd:"#8b1a1a",
  iBg:"#0d1118",iBd:"#1a2940",
  inBg:"#08080a",hBg:"#111113",tBg:"#0d0d10",tBd:"#1a1a22",
  graphBg:"#0a0a0e",graphGrid:"#1a1a22",graphText:"#5a5a64",
  histBg:"#0e0e12",histHover:"#18181e",
};
const LIGHT = {
  n:"light",bg:"#eae5da",card:"#faf8f4",cb:"#c8c0b0",
  rA:"#faf8f4",rB:"#f0ece2",
  gold:"#7a5a10",gB:"#5a4008",gD:"#a88030",
  iron:"#b8b0a0",steel:"#6a6458",
  bone:"#1a1810",bD:"#3a3630",
  vic:"#1a6a10",vicBg:"#ddf0d8",vicFill:"#1a6a1020",
  def:"#901818",defBg:"#f8dada",
  link:"#1a5a9a",chain:"#1a6a10",asst:"#204a8a",lost:"#a02020",lostFill:"#a0202020",
  wBg:"#f8f0d8",eBg:"#f8dada",eBd:"#c09090",
  iBg:"#dae8f4",iBd:"#90a8c0",
  inBg:"#eae5da",hBg:"#f4f0e8",tBg:"#f0ece2",tBd:"#c8c0b0",
  graphBg:"#f4f0e8",graphGrid:"#d8d0c4",graphText:"#8a847a",
  histBg:"#f0ece2",histHover:"#e8e2d6",
};

// ============================================================
//  RANK SYSTEM
// ============================================================
const TIER_COLORS={bronze:{d:"#cd7f32",db:"#3d2a1a",l:"#8a5a20",lb:"#f0e4d0"},silver:{d:"#c0c0c0",db:"#252528",l:"#505058",lb:"#e8e8ec"},gold:{d:"#ffd700",db:"#2a2510",l:"#7a6010",lb:"#f4ecd0"},platinum:{d:"#e0e8f0",db:"#202428",l:"#3a4858",lb:"#e4e8f0"},diamond:{d:"#a0d8f0",db:"#182028",l:"#1a5070",lb:"#d8eef8"}};
const TIERS=["bronze","silver","gold","platinum","diamond"];
const ROM={i:1,ii:2,iii:3,iv:4,v:5};
function parseTier(s){if(!s)return null;const lo=s.toLowerCase().trim();for(const t of TIERS){if(lo.includes(t)){return{tier:t,val:TIERS.indexOf(t)*5+(ROM[lo.replace(t,"").trim()]||0)};}}return null;}

function RankBadge({before,after,isWinner,theme:th}){
  const a=parseTier(after);if(!a)return after?<span style={{fontSize:"10px",color:th.bD}}>{after}</span>:null;
  const b=parseTier(before);const tc=TIER_COLORS[a.tier];const dk=th.n==="dark";
  let arrow="",ac=th.iron;
  if(b){if(a.val>b.val){arrow=" ↑";ac=th.vic;}else if(a.val<b.val){arrow=" ↓";ac=th.lost;}}
  else{if(isWinner){arrow=" ↑";ac=th.vic;}else{arrow=" ↓";ac=th.lost;}}
  return(<div style={{display:"inline-flex",alignItems:"center",gap:"4px",marginTop:"3px"}}>
    {b&&b.val!==a.val&&<><span style={{fontSize:"9px",color:th.bD,textDecoration:"line-through"}}>{before}</span><span style={{fontSize:"9px",color:ac}}>→</span></>}
    <span style={{padding:"2px 7px",fontSize:"10px",fontWeight:700,letterSpacing:"0.4px",textTransform:"uppercase",color:dk?tc.d:tc.l,background:dk?tc.db:tc.lb,border:`1px solid ${dk?tc.d:tc.l}30`}}>{after}{arrow&&<span style={{color:ac}}>{arrow}</span>}</span>
  </div>);
}

// ============================================================
//  DATA PROCESSING
// ============================================================
const CH=[10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000];

function processWarData(raw,fid,wid){
  const r=raw.rankedwarreport;if(!r)return null;
  let fac=null,opp=null;
  for(const k in r.factions){if(String(k)===String(fid))fac={...r.factions[k],id:k};else opp={...r.factions[k],id:k};}
  if(!fac)return null;
  const mm=o=>Object.entries(o.members).map(([id,m])=>({id,name:m.name,warHits:m.attacks,respect:m.score,outsideHits:0,chainBonus:0,fairFight:0,attacked:0,mugged:0,hosp:0,assist:0,retal:0,overseas:0,stalemate:0,escape:0,lost:0}));
  const mr=rw=>{if(!rw)return null;const it=[];if(rw.items)for(const i in rw.items)it.push({name:rw.items[i].name,qty:rw.items[i].quantity});return{respect:rw.respect||0,points:rw.points||0,items:it};};
  const won=String(r.war.winner)===String(fid);
  return{warId:wid,result:won?"VICTORY":"DEFEAT",startTime:r.war.start,endTime:r.war.end,
    faction:{id:fac.id,name:fac.name,score:fac.score,rewards:mr(fac.rewards),rank_before:fac.rank_before,rank_after:fac.rank_after,members:mm(fac),isWinner:won},
    opponent:{id:opp.id,name:opp.name,score:opp.score,rewards:mr(opp.rewards),rank_before:opp.rank_before,rank_after:opp.rank_after,members:mm(opp),isWinner:!won}};
}

function processAttacks(atks,fid,mems){
  const f={};
  for(const id in atks){const d=atks[id];if(String(d.attacker_faction)!==String(fid))continue;
    if(!f[d.attacker_id])f[d.attacker_id]={attacked:0,mugged:0,hospitalized:0,assist:0,escape:0,lost:0,stalemate:0,respect:0,chain_bonus:0,retaliation:0,overseas:0,fair_fight:0};
    const t=f[d.attacker_id],rk=d.result.toLowerCase();t[rk]=(t[rk]||0)+1;
    if(CH.includes(d.chain))t.chain_bonus+=d.respect;else t.respect+=d.respect;
    if(d.modifiers?.retaliation>1)t.retaliation++;if(d.modifiers?.overseas>1)t.overseas++;
    t.fair_fight+=(d.modifiers?.fair_fight||0);}
  return mems.map(m=>{const a=f[m.id];if(!a)return m;
    const ta=a.attacked+a.mugged+a.hospitalized,oh=Math.max(0,ta-m.warHits),th2=m.warHits+oh;
    return{...m,outsideHits:oh,respect:m.respect-a.chain_bonus,chainBonus:a.chain_bonus,
      fairFight:th2>0?a.fair_fight/th2:0,attacked:a.attacked,mugged:a.mugged,hosp:a.hospitalized,
      assist:a.assist,retal:a.retaliation,overseas:a.overseas,stalemate:a.stalemate,escape:a.escape,lost:a.lost};});
}

function buildTimeline(attacks,factionId,opponentId,startTime,endTime){
  const facPts=[],oppPts=[];
  for(const id in attacks){const a=attacks[id];if(!a.respect||a.respect<=0)continue;
    const fid=String(a.attacker_faction);
    if(fid===String(factionId))facPts.push({t:a.timestamp_started,r:a.respect});
    else if(fid===String(opponentId))oppPts.push({t:a.timestamp_started,r:a.respect});}
  facPts.sort((a,b)=>a.t-b.t);oppPts.sort((a,b)=>a.t-b.t);
  const bc=(pts)=>{let c=0;const o=[{t:startTime,s:0}];pts.forEach(p=>{c+=p.r;o.push({t:p.t,s:Math.round(c*100)/100});});o.push({t:endTime,s:c});return o;};
  return{faction:bc(facPts),opponent:bc(oppPts)};
}

// ============================================================
//  TIMELINE GRAPH — Rebuilt with area fills, legend, better axes
// ============================================================
function TimelineGraph({timeline,theme:th,startTime,endTime,factionName,opponentName}){
  if(!timeline||!timeline.faction.length||!timeline.opponent.length)
    return<div style={{padding:"16px",background:th.tBg,border:`1px dashed ${th.tBd}`,textAlign:"center"}}><div style={{fontSize:"11px",color:th.steel}}>📈 Score timeline — attack data not available</div></div>;

  const W=760,H=240,P={t:30,r:55,b:32,l:58};
  const gW=W-P.l-P.r,gH=H-P.t-P.b;
  const allS=[...timeline.faction.map(p=>p.s),...timeline.opponent.map(p=>p.s)];
  const maxS=Math.max(...allS,1);
  const tR=endTime-startTime||1;
  const toX=t=>P.l+((t-startTime)/tR)*gW;
  const toY=s=>P.t+gH-(s/maxS)*gH;
  const bottomY=P.t+gH;

  // Build line path
  const linePath=pts=>pts.map((p,i)=>`${i===0?'M':'L'}${toX(p.t).toFixed(1)},${toY(p.s).toFixed(1)}`).join(' ');
  // Build area path (line + close along bottom)
  const areaPath=(pts)=>{
    let d=pts.map((p,i)=>`${i===0?'M':'L'}${toX(p.t).toFixed(1)},${toY(p.s).toFixed(1)}`).join(' ');
    d+=`L${toX(pts[pts.length-1].t).toFixed(1)},${bottomY}L${toX(pts[0].t).toFixed(1)},${bottomY}Z`;
    return d;
  };

  // Y grid
  const grid=[];
  const step=maxS>8000?2000:maxS>4000?1000:maxS>2000?500:maxS>800?200:100;
  for(let s=0;s<=maxS;s+=step){
    const y=toY(s);
    grid.push(<g key={`g${s}`}>
      <line x1={P.l} y1={y} x2={W-P.r} y2={y} stroke={th.graphGrid} strokeWidth="0.5"/>
      <text x={P.l-8} y={y+3} textAnchor="end" fill={th.graphText} fontSize="9" fontFamily="Consolas,monospace">{s>=1000?(s/1000).toFixed(s%1000===0?0:1)+"k":s}</text>
    </g>);
  }

  // X axis — day markers
  const dayLen=86400;
  const xMarks=[];
  for(let d=0;d<=Math.ceil(tR/dayLen);d++){
    const t=startTime+d*dayLen;
    if(t>endTime+3600)break;
    const x=toX(Math.min(t,endTime));
    xMarks.push(<g key={`x${d}`}>
      {d>0&&<line x1={x} y1={P.t} x2={x} y2={bottomY} stroke={th.graphGrid} strokeWidth="0.5" strokeDasharray="4,4"/>}
      <text x={x} y={H-8} textAnchor="middle" fill={th.graphText} fontSize="9" fontFamily="Consolas,monospace">
        {d===0?"Start":d===Math.ceil(tR/dayLen)?"End":`Day ${d+1}`}
      </text>
    </g>);
  }

  const facEnd=timeline.faction[timeline.faction.length-1]?.s||0;
  const oppEnd=timeline.opponent[timeline.opponent.length-1]?.s||0;
  // Prevent label overlap
  const facY=toY(facEnd);const oppY=toY(oppEnd);
  const labelSep=Math.abs(facY-oppY)<14;
  const facLabelY=labelSep?(facEnd>oppEnd?facY-2:facY+12):(facY+4);
  const oppLabelY=labelSep?(oppEnd>facEnd?oppY-2:oppY+12):(oppY+4);

  return(
    <div style={{overflowX:"auto"}}>
      {/* Legend */}
      <div style={{display:"flex",justifyContent:"center",gap:"20px",marginBottom:"6px"}}>
        <span style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:th.vic}}>
          <span style={{width:"14px",height:"3px",background:th.vic,display:"inline-block"}}/>
          {factionName||"Your Faction"}
        </span>
        <span style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:th.lost}}>
          <span style={{width:"14px",height:"3px",background:th.lost,display:"inline-block"}}/>
          {opponentName||"Opponent"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:`${W}px`,height:"auto",display:"block",margin:"0 auto"}}>
        <rect x="0" y="0" width={W} height={H} fill={th.graphBg} rx="3"/>
        {/* Axes */}
        <line x1={P.l} y1={P.t} x2={P.l} y2={bottomY} stroke={th.graphGrid} strokeWidth="1"/>
        <line x1={P.l} y1={bottomY} x2={W-P.r} y2={bottomY} stroke={th.graphGrid} strokeWidth="1"/>
        {grid}{xMarks}
        {/* Area fills */}
        <path d={areaPath(timeline.faction)} fill={th.vicFill}/>
        <path d={areaPath(timeline.opponent)} fill={th.lostFill}/>
        {/* Lines */}
        <path d={linePath(timeline.opponent)} fill="none" stroke={th.lost} strokeWidth="1.8" strokeLinejoin="round" opacity="0.85"/>
        <path d={linePath(timeline.faction)} fill="none" stroke={th.vic} strokeWidth="2.2" strokeLinejoin="round"/>
        {/* End dots */}
        <circle cx={toX(endTime)} cy={toY(facEnd)} r="3" fill={th.vic}/>
        <circle cx={toX(endTime)} cy={toY(oppEnd)} r="3" fill={th.lost}/>
        {/* End labels */}
        <text x={W-P.r+6} y={facLabelY} fill={th.vic} fontSize="10" fontWeight="700" fontFamily="Consolas,monospace">{Math.round(facEnd).toLocaleString()}</text>
        <text x={W-P.r+6} y={oppLabelY} fill={th.lost} fontSize="10" fontWeight="700" fontFamily="Consolas,monospace">{Math.round(oppEnd).toLocaleString()}</text>
      </svg>
    </div>
  );
}

// ============================================================
//  API
// ============================================================
async function fetchWarReport(wid,key){return(await fetch(`/api/torn?type=war&id=${encodeURIComponent(wid)}&key=${encodeURIComponent(key)}`)).json();}
async function fetchAllAttacks(st,et,key){
  let all={},from=st,s=0;
  while(from<et&&s<50){s++;const r=await fetch(`/api/torn?type=attacks&from=${from}&to=${et}&key=${encodeURIComponent(key)}`);
    const d=await r.json();if(d.error)throw new Error(`API ${d.error.code}: ${d.error.error}`);
    if(!d.attacks||!Object.keys(d.attacks).length)break;let mx=from;
    for(const a in d.attacks){all[a]=d.attacks[a];if(d.attacks[a].timestamp_started>mx)mx=d.attacks[a].timestamp_started;}
    if(mx<=from)break;from=mx;}return all;
}

// ============================================================
//  UTILITY
// ============================================================
function fmtDur(s,e){const d=(e-s)*1000;return`${Math.floor(d/3600000)}h ${Math.floor((d%3600000)/60000)}m ${Math.floor((d%60000)/1000)}s`;}
function fmtNum(n){return typeof n==="number"&&!isNaN(n)?n.toLocaleString("en-US",{maximumFractionDigits:2}):"0";}
function fmtTCT(ts){const d=new Date(ts*1000);return`${d.getUTCHours().toString().padStart(2,"0")}:${d.getUTCMinutes().toString().padStart(2,"0")} - ${(d.getUTCMonth()+1).toString().padStart(2,"0")}/${d.getUTCDate().toString().padStart(2,"0")}/${d.getUTCFullYear().toString().slice(-2)} TCT`;}
function fmtLocal(ts){const d=new Date(ts*1000);const tz=d.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop();return`${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} - ${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getDate().toString().padStart(2,"0")}/${d.getFullYear().toString().slice(-2)} ${tz}`;}
function fmtDateShort(ts){const d=new Date(ts*1000);return`${(d.getUTCMonth()+1).toString().padStart(2,"0")}/${d.getUTCDate().toString().padStart(2,"0")}/${d.getUTCFullYear().toString().slice(-2)}`;}

function statColor(k,v,th){
  if(!v||v===0)return th.iron;const dk=th.n==="dark";
  switch(k){
    case"fairFight":if(v<1.5)return dk?"#6a8a5a":"#5a7a4a";if(v<2.5)return dk?"#6ab04c":"#3a8a2a";if(v<3.5)return dk?"#2ecc71":"#1a7a10";return dk?"#00e676":"#0a6a00";
    case"warHits":if(v<10)return dk?"#8a8a7a":"#6a6a5a";if(v<30)return dk?"#b0aa90":"#5a5440";if(v<60)return dk?"#d4cca0":"#3a3420";if(v<100)return dk?"#e8deb0":"#2a2410";return dk?"#f0eac0":"#1a1a08";
    case"respect":if(v<50)return dk?"#9a8030":"#7a6020";if(v<200)return dk?"#c0a030":"#6a5010";if(v<500)return dk?"#e0b840":"#5a4008";return dk?"#f0d050":"#4a3000";
    case"chainBonus":if(v<=0)return th.iron;if(v<20)return dk?"#508040":"#3a7030";if(v<50)return dk?"#60a050":"#2a6020";return dk?"#70c060":"#1a5010";
    case"outsideHits":if(v<3)return dk?"#707068":"#5a5a50";if(v<10)return dk?"#8a8a78":"#4a4a3a";return dk?"#a0a088":"#3a3a2a";
    case"assist":if(v<3)return dk?"#5080a0":"#305a80";if(v<10)return dk?"#6090b8":"#204a70";return dk?"#70a8d0":"#103a60";
    case"retal":if(v<2)return dk?"#808070":"#5a5a4a";if(v<5)return dk?"#a0a088":"#4a4a3a";return dk?"#b8b898":"#3a3a2a";
    case"overseas":if(v<5)return dk?"#708080":"#4a5a5a";if(v<15)return dk?"#80a0a0":"#3a4a4a";return dk?"#90b8b8":"#2a3a3a";
    case"lost":if(v<3)return dk?"#a06050":"#803828";if(v<8)return dk?"#c05040":"#a02818";return dk?"#e04030":"#c01808";
    default:return th.bD;
  }
}

function exportCSV(wd){const h=["Faction","Member","ID","War Hits","Outside Hits","Respect","Chain Bonus","FF Avg","Assist","Retal","Overseas","Lost"];const rows=[h.join(",")];const add=f=>f.members.forEach(m=>rows.push([`"${f.name}"`,`"${m.name}"`,m.id,m.warHits,m.outsideHits,m.respect.toFixed(2),m.chainBonus.toFixed(2),m.fairFight?m.fairFight.toFixed(2):"",m.assist,m.retal,m.overseas,m.lost].join(",")));add(wd.faction);add(wd.opponent);const b=new Blob([rows.join("\n")],{type:"text/csv"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=`warforge_${wd.warId}.csv`;a.click();URL.revokeObjectURL(u);}

function exportAllHistoryCSV(wars){
  const h=["War ID","War Date","Result","Your Faction","Opponent","Your Score","Their Score","Duration (hrs)","Side","Member","Member ID","War Hits","Outside Hits","Respect","Chain Bonus","FF Avg","Assist","Retal","Overseas","Lost"];
  const rows=[h.join(",")];
  Object.entries(wars).sort((a,b)=>(a[1].summary?.date||0)-(b[1].summary?.date||0)).forEach(([wid,entry])=>{
    const wd=entry.warData;if(!wd)return;
    const dur=((wd.endTime-wd.startTime)/3600).toFixed(1);const dt=wd.startTime?fmtDateShort(wd.startTime):"";
    const addSide=(fac,side)=>{fac.members.forEach(m=>{rows.push([wid,`"${dt}"`,`"${wd.result}"`,`"${wd.faction.name}"`,`"${wd.opponent.name}"`,wd.faction.score,wd.opponent.score,dur,`"${side}"`,`"${m.name}"`,m.id,m.warHits,m.outsideHits,m.respect.toFixed(2),m.chainBonus.toFixed(2),m.fairFight?m.fairFight.toFixed(2):"",m.assist,m.retal,m.overseas,m.lost].join(","));});};
    addSide(wd.faction,"Your Faction");addSide(wd.opponent,"Opponent");
  });
  const b=new Blob([rows.join("\n")],{type:"text/csv"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=`warforge_all_history.csv`;a.click();URL.revokeObjectURL(u);
}

// ============================================================
//  WAR HISTORY
// ============================================================
function loadSavedWars(){try{const s=localStorage.getItem("wf_history");return s?JSON.parse(s):{};}catch(e){return{};}}
function saveWarToHistory(wd,hasAtk,tl){try{const h=loadSavedWars();h[wd.warId]={warData:wd,hasAtk,timeline:tl,savedAt:Date.now(),summary:{opponent:wd.opponent.name,result:wd.result,fScore:wd.faction.score,oScore:wd.opponent.score,date:wd.startTime,fName:wd.faction.name}};localStorage.setItem("wf_history",JSON.stringify(h));return h;}catch(e){return loadSavedWars();}}
function deleteWarFromHistory(wid){try{const h=loadSavedWars();delete h[wid];localStorage.setItem("wf_history",JSON.stringify(h));return h;}catch(e){return loadSavedWars();}}
function clearAllHistory(){try{localStorage.removeItem("wf_history");return{};}catch(e){return{};}}

// ============================================================
//  SMALL COMPONENTS
// ============================================================
function Cross({size=16,color}){return<svg width={size} height={size} viewBox="0 0 16 16"><rect x="6" y="1" width="4" height="14" rx=".5" fill={color}/><rect x="1" y="5" width="14" height="4" rx=".5" fill={color}/></svg>;}
function Rewards({rewards,theme:th}){if(!rewards)return null;const p=[];if(rewards.respect)p.push(`${fmtNum(rewards.respect)} Respect`);if(rewards.points)p.push(`${fmtNum(rewards.points)} Points`);rewards.items.forEach(i=>p.push(`${i.qty}x ${i.name}`));return p.length?<div style={{fontSize:"10px",color:th.steel,marginTop:"2px"}}>{p.join(" · ")}</div>:null;}
function ScoreBar({fs,os,theme:th}){const tot=fs+os||1,p=(fs/tot)*100;return(<div><div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:th.bD,marginBottom:"3px",fontFamily:"Consolas,monospace"}}><span>{fmtNum(fs)}</span><span>{fmtNum(os)}</span></div><div style={{height:"7px",background:th.iron,overflow:"hidden",display:"flex",border:`1px solid ${th.cb}`}}><div style={{width:`${p}%`,background:`linear-gradient(90deg,${th.vic},#2d6b24)`,transition:"width 0.6s"}}/><div style={{flex:1,background:`linear-gradient(90deg,${th.def},#5a1010)`}}/></div></div>);}
function FactionBlock({f,align,accent,theme:th}){const isR=align==="right";return(<div style={{textAlign:align,flex:1}}><div style={{height:"3px",background:accent,marginBottom:"6px",width:"70%",marginLeft:isR?"auto":0,marginRight:isR?0:"auto"}}/><div style={{fontSize:"15px",fontWeight:700,color:th.bone}}>{f.name}</div><div style={{fontSize:"28px",fontWeight:800,color:accent,fontFamily:"Consolas,monospace"}}>{fmtNum(f.score)}</div><RankBadge before={f.rank_before} after={f.rank_after} isWinner={f.isWinner} theme={th}/><Rewards rewards={f.rewards} theme={th}/></div>);}

// ============================================================
//  HISTORY PANEL
// ============================================================
function HistoryPanel({wars,onLoad,onDelete,onClearAll,onExportAll,theme:th}){
  const entries=Object.entries(wars).sort((a,b)=>(b[1].summary?.date||0)-(a[1].summary?.date||0));
  if(!entries.length)return<div style={{padding:"20px",textAlign:"center",color:th.steel,fontSize:"12px"}}>No saved wars yet. Load a war and it will appear here.</div>;
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
      <span style={{fontSize:"11px",color:th.steel}}>{entries.length} saved (newest first)</span>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={onExportAll} style={{background:"transparent",border:`1px solid ${th.gD}`,padding:"3px 8px",color:th.gold,fontSize:"10px",cursor:"pointer",fontFamily:"Arial,sans-serif"}}>⬇ Export All CSV</button>
        <button onClick={onClearAll} style={{background:"transparent",border:`1px solid ${th.eBd}`,padding:"3px 8px",color:th.lost,fontSize:"10px",cursor:"pointer",fontFamily:"Arial,sans-serif"}}>Clear All</button>
      </div>
    </div>
    {entries.map(([wid,entry])=>{const s=entry.summary||{};return(<div key={wid} onClick={()=>onLoad(wid)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 10px",marginBottom:"4px",background:th.histBg,border:`1px solid ${th.cb}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=th.histHover} onMouseLeave={e=>e.currentTarget.style.background=th.histBg}>
      <span style={{fontSize:"14px"}}>{s.result==="VICTORY"?"💰":"💀"}</span>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:"12px",fontWeight:600,color:th.bone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>#{wid} vs {s.opponent||"Unknown"}</div><div style={{fontSize:"10px",color:th.steel}}>{fmtNum(s.fScore||0)} - {fmtNum(s.oScore||0)} · {s.date?fmtDateShort(s.date):""}</div></div>
      <span style={{fontSize:"12px",fontWeight:700,color:s.result==="VICTORY"?th.vic:th.lost}}>{s.result==="VICTORY"?"W":"L"}</span>
      <button onClick={e=>{e.stopPropagation();onDelete(wid);}} style={{background:"transparent",border:"none",color:th.steel,cursor:"pointer",fontSize:"14px",padding:"2px 4px"}} title="Delete">✕</button>
    </div>);})}
  </div>);
}

// ============================================================
//  MEMBER TABLE
// ============================================================
function MemberTable({members,title,accent,theme:th,hasAtk,isWinner,compact}){
  const[sC,setSC]=useState("warHits");const[sA,setSA]=useState(false);
  const HIDE=["retal","overseas","lost"];
  const allCols=[{k:"name",l:"Member",a:"left",w:"130px"},{k:"warHits",l:"War Hits"},{k:"outsideHits",l:"Outside",at:1},{k:"respect",l:"Respect"},{k:"chainBonus",l:"Chain",at:1},{k:"fairFight",l:"FF Avg",at:1},{k:"assist",l:"Assist",at:1},{k:"retal",l:"Retal",at:1},{k:"overseas",l:"OS",at:1},{k:"lost",l:"Lost",at:1}];
  const cols=compact?allCols.filter(c=>!HIDE.includes(c.k)):allCols;
  const dataCols=cols.filter(c=>c.k!=="name").map(c=>c.k);
  const sorted=[...members].sort((a,b)=>{const av=a[sC],bv=b[sC];return typeof av==="string"?(sA?av.localeCompare(bv):bv.localeCompare(av)):(sA?av-bv:bv-av);});
  const tots={};["warHits","outsideHits","respect","chainBonus","assist","retal","overseas","lost"].forEach(k=>{tots[k]=members.reduce((s,m)=>s+(m[k]||0),0);});
  const ds=k=>{if(sC===k)setSA(!sA);else{setSC(k);setSA(false);}};
  const c={padding:"5px 4px",fontSize:"11.5px",borderBottom:`1px solid ${th.cb}`,whiteSpace:"nowrap",fontFamily:"Arial,sans-serif"};
  const mn={fontFamily:"Consolas,monospace",fontSize:"11.5px"};
  const hd={...c,color:th.gold,fontWeight:700,cursor:"pointer",userSelect:"none",position:"sticky",top:0,background:th.card,zIndex:1,fontSize:"12px",textTransform:"uppercase",letterSpacing:"0.4px",padding:"8px 4px"};
  const clr=(k,v)=>{if(!hasAtk&&k!=="warHits"&&k!=="respect"&&k!=="name")return th.iron;return statColor(k,v,th);};
  const val=(k,m)=>{if(!hasAtk&&allCols.find(x=>x.k===k)?.at)return"—";if(k==="respect"||k==="chainBonus")return fmtNum(m[k]);if(k==="fairFight")return m.fairFight?m.fairFight.toFixed(2):"—";return m[k];};
  return(
    <div style={{flex:1,minWidth:"340px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
        <span style={{fontSize:"16px"}}>{isWinner?"💰":"💀"}</span>
        <div style={{height:"2px",width:"20px",background:accent}}/>
        <h3 style={{margin:0,fontSize:"13px",fontWeight:700,color:th.bone}}>{title}</h3>
        <span style={{fontSize:"10px",color:th.steel,marginLeft:"auto"}}>{members.length} members</span>
      </div>
      <div style={{overflowX:"auto",border:`1px solid ${th.cb}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:th.card}}>
          <thead><tr style={{borderBottom:`2px solid ${accent}40`}}>{cols.map(x=><th key={x.k} onClick={()=>ds(x.k)} style={{...hd,textAlign:x.a||"right",minWidth:x.w||"48px"}}>{x.l}{sC===x.k?(sA?" ▲":" ▼"):""}</th>)}</tr></thead>
          <tbody>{sorted.map((m,i)=>(<tr key={m.id} style={{background:i%2===0?th.rA:th.rB}}><td style={{...c,textAlign:"left",fontWeight:500}}><a href={`https://www.torn.com/profiles.php?XID=${m.id}`} target="_blank" rel="noopener noreferrer" style={{color:th.link,textDecoration:"none",fontSize:"11.5px"}}>{m.name}</a></td>{dataCols.map(k=>(<td key={k} style={{...c,...mn,textAlign:"right",color:clr(k,m[k]),fontWeight:k==="warHits"?600:k==="fairFight"?600:400}}>{val(k,m)}</td>))}</tr>))}</tbody>
          <tfoot><tr style={{borderTop:`2px solid ${th.iron}`,background:th.n==="dark"?"#0c0c0e":"#e8e2d6"}}>
            <td style={{...c,textAlign:"left",color:th.gold,fontWeight:700,fontSize:"12px",textTransform:"uppercase",letterSpacing:"0.4px",padding:"8px 4px"}}>Totals</td>
            {dataCols.map(k=>{const noData=!hasAtk&&k!=="warHits"&&k!=="respect";const isFf=k==="fairFight";
              return<td key={k} style={{...c,...mn,textAlign:"right",fontWeight:700,fontSize:"12px",padding:"8px 4px",color:noData||isFf?th.iron:statColor(k,tots[k],th)}}>{noData?"—":isFf?"—":(k==="respect"||k==="chainBonus"?fmtNum(tots[k]):tots[k])}</td>;
            })}
          </tr></tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================
//  MAIN APP
// ============================================================
export default function WarForge(){
  const[dk,setDk]=useState(true);const th=dk?DARK:LIGHT;
  const[apiKey,setAK]=useState("");
  const[warId,setWI]=useState("");
  const[factionId,setFI]=useState("");
  const[showSet,setSS]=useState(false);
  const[showHist,setSH]=useState(false);
  const[loading,setL]=useState(false);
  const[error,setE]=useState(null);
  const[lMsg,setLM]=useState("");
  const[warData,setWD]=useState(null);
  const[hasAtk,setHA]=useState(false);
  const[timeline,setTL]=useState(null);
  const[savedWars,setSW]=useState({});
  const[compact,setCompact]=useState(false);
  const[saveKey,setSaveKey]=useState(false);

  useEffect(()=>{
    try{const s=localStorage.getItem("wf_fid");if(s)setFI(s);}catch(e){}
    try{const sk=localStorage.getItem("wf_savekey");if(sk==="true"){setSaveKey(true);const k=localStorage.getItem("wf_apikey");if(k)setAK(k);}}catch(e){}
    setSW(loadSavedWars());
  },[]);
  useEffect(()=>{if(factionId.trim())try{localStorage.setItem("wf_fid",factionId);}catch(e){}},[factionId]);
  useEffect(()=>{try{localStorage.setItem("wf_savekey",saveKey?"true":"false");if(saveKey&&apiKey.trim())localStorage.setItem("wf_apikey",apiKey);if(!saveKey)localStorage.removeItem("wf_apikey");}catch(e){}},[saveKey]);
  useEffect(()=>{if(saveKey&&apiKey.trim())try{localStorage.setItem("wf_apikey",apiKey);}catch(e){}},[apiKey,saveKey]);

  const loadWar=async()=>{
    if(!apiKey.trim()){setE("Enter your API key in ⚙ Settings");setSS(true);return;}
    if(!warId.trim()){setE("Enter a War ID");return;}
    if(!factionId.trim()){setE("Set Faction ID in ⚙ Settings first");setSS(true);return;}
    setL(true);setE(null);setLM("Forging connection to Torn API...");setTL(null);
    try{
      const raw=await fetchWarReport(warId,apiKey);
      if(raw.error)throw new Error(`API Error ${raw.error.code}: ${raw.error.error}`);
      if(!raw.rankedwarreport)throw new Error("No war report found for this ID.");
      const p=processWarData(raw,factionId,warId);
      if(!p)throw new Error("Faction ID not found in this war. Check Settings.");
      setLM("Forging attack details...");
      let ga=false,tl=null;
      try{const atk=await fetchAllAttacks(p.startTime,p.endTime,apiKey);setLM(`Processing ${Object.keys(atk).length} attacks...`);p.faction.members=processAttacks(atk,factionId,p.faction.members);p.opponent.members=processAttacks(atk,p.opponent.id,p.opponent.members);ga=true;tl=buildTimeline(atk,factionId,p.opponent.id,p.startTime,p.endTime);setTL(tl);}catch(ae){console.warn("Attack details unavailable:",ae.message);}
      setWD(p);setHA(ga);const updated=saveWarToHistory(p,ga,tl);setSW(updated);
    }catch(e){setE(e.message);setWD(null);}
    finally{setL(false);setLM("");}
  };

  const loadFromHistory=(wid)=>{const entry=savedWars[wid];if(!entry)return;setWD(entry.warData);setHA(entry.hasAtk||false);setTL(entry.timeline||null);setWI(wid);setSH(false);setE(null);};
  const deleteFromHist=(wid)=>{const u=deleteWarFromHistory(wid);setSW(u);if(warData?.warId===wid){setWD(null);setTL(null);setHA(false);}};
  const clearHist=()=>setSW(clearAllHistory());
  const clear=()=>{setWD(null);setWI("");setE(null);setHA(false);setTL(null);};

  const iS={width:"100%",background:th.inBg,border:`1px solid ${th.iron}`,padding:"8px 12px",color:th.bone,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"Arial,sans-serif"};
  const lS={fontSize:"11px",color:th.steel,display:"block",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700,fontFamily:"Arial,sans-serif"};
  const bP={padding:"9px 24px",background:dk?`linear-gradient(180deg,${th.gold},#a07820)`:`linear-gradient(180deg,#b08020,#8a6010)`,border:"none",color:dk?"#0a0a0a":"#fff",fontWeight:700,fontSize:"14px",cursor:"pointer",whiteSpace:"nowrap",minWidth:"120px",textTransform:"uppercase",letterSpacing:"0.3px",fontFamily:"Arial,sans-serif"};
  const bS={background:th.card,border:`1px solid ${th.iron}`,padding:"6px 12px",color:th.bD,fontSize:"12px",cursor:"pointer",fontFamily:"Arial,sans-serif"};
  const rc=warData?.result==="VICTORY"?th.vic:th.def;
  const rb=warData?.result==="VICTORY"?th.vicBg:th.defBg;
  const histCount=Object.keys(savedWars).length;
  const hasKey=apiKey.trim().length>0;

  return(<>
    <Head><title>WarForge — Ranked War Analytics</title><meta name="description" content="Torn City ranked war report viewer and analytics"/><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div style={{minHeight:"100vh",background:th.bg,color:th.bone,fontFamily:"Arial,sans-serif"}}>

      {/* HEADER */}
      <header style={{borderBottom:`1px solid ${th.cb}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",background:th.hBg}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}><Cross size={22} color={th.gold}/><div><div style={{fontWeight:800,fontSize:"20px",letterSpacing:"2px",color:th.gold,textTransform:"uppercase"}}>WarForge</div><div style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.2px"}}>Ranked War Analytics</div></div></div>
        <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
          {warData&&<button onClick={clear} style={bS}>✕ Clear</button>}
          <a href="/live" style={{...bS,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"4px",color:th.lost}}>🔴 Live</a>
          <button onClick={()=>{setSH(!showHist);if(!showHist)setSS(false);}} style={{...bS,borderColor:showHist?th.gD:th.iron,color:showHist?th.gold:th.bD}}>
            📜 History{histCount>0&&<span style={{marginLeft:"4px",background:th.gold,color:"#0a0a0a",borderRadius:"8px",padding:"0 5px",fontSize:"10px",fontWeight:700}}>{histCount}</span>}
          </button>
          <button onClick={()=>setDk(!dk)} style={{...bS,fontSize:"15px",padding:"3px 8px",lineHeight:1}}>{dk?"☀":"☽"}</button>
          <button onClick={()=>{setSS(!showSet);if(!showSet)setSH(false);}} style={{...bS,borderColor:showSet?th.gD:th.iron,color:showSet?th.gold:th.bD}}>⚙ Settings</button>
        </div>
      </header>

      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"16px 20px"}}>

        {/* SETTINGS — now contains API key + Faction ID */}
        {showSet&&(<div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"16px",marginBottom:"14px"}}>
          <div style={{fontSize:"11px",fontWeight:700,color:th.gold,marginBottom:"10px",textTransform:"uppercase",letterSpacing:"1px"}}>⚙ Forge Settings</div>
          <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
            {/* API Key */}
            <div style={{flex:2,minWidth:"220px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
                <label style={{...lS,margin:0}}>API Key</label>
                <button onClick={()=>setSaveKey(!saveKey)} style={{background:"transparent",border:`1px solid ${saveKey?th.gD:th.iron}`,padding:"1px 6px",fontSize:"9px",color:saveKey?th.gold:th.steel,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>{saveKey?"🔒 Saved":"🔓 Remember"}</button>
              </div>
              <input type="password" value={apiKey} onChange={e=>setAK(e.target.value)} placeholder="Your Torn API key (full access)" style={iS}/>
              <div style={{fontSize:"9px",color:th.steel,marginTop:"3px"}}>{saveKey?"Key saved in this browser — auto-fills on return.":"Key clears when you leave. Click Remember to save."}</div>
            </div>
            {/* Faction ID */}
            <div style={{flex:1,minWidth:"160px"}}>
              <label style={lS}>Faction ID</label>
              <input value={factionId} onChange={e=>setFI(e.target.value)} placeholder="e.g. 12345" style={iS}/>
              <div style={{fontSize:"9px",color:th.steel,marginTop:"3px"}}>From URL: <span style={{fontFamily:"Consolas,monospace"}}>...&ID=<span style={{color:th.gB}}>12345</span></span> · <span style={{color:th.gD}}>✓ Auto-saved</span></div>
            </div>
          </div>
        </div>)}

        {/* HISTORY */}
        {showHist&&(<div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"14px"}}>
          <div style={{fontSize:"11px",fontWeight:700,color:th.gold,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px"}}>📜 War History</div>
          <HistoryPanel wars={savedWars} onLoad={loadFromHistory} onDelete={deleteFromHist} onClearAll={clearHist} onExportAll={()=>exportAllHistoryCSV(savedWars)} theme={th}/>
        </div>)}

        {/* INPUT — just War ID + Load button */}
        <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"16px"}}>
          <div style={{display:"flex",gap:"10px",alignItems:"end",flexWrap:"wrap"}}>
            <div style={{flex:"1",minWidth:"120px",maxWidth:"240px"}}><label style={lS}>War ID</label><input value={warId} onChange={e=>setWI(e.target.value)} placeholder="e.g. 42069" onKeyDown={e=>e.key==="Enter"&&loadWar()} style={iS}/></div>
            <button onClick={loadWar} disabled={loading} style={{...bP,opacity:loading?0.5:1,cursor:loading?"wait":"pointer"}}>{loading?"Forging...":"⚔ Load War"}</button>
            {!hasKey&&<span style={{fontSize:"11px",color:th.gold,padding:"8px 0"}}>← Set your API key in ⚙ Settings first</span>}
          </div>
          {error&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.eBg,border:`1px solid ${th.eBd}`,color:th.lost,fontSize:"11px",lineHeight:1.5}}>{error}</div>}
          {loading&&lMsg&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.iBg,border:`1px solid ${th.iBd}`,color:th.link,fontSize:"11px"}}>{lMsg}</div>}
        </div>

        {/* WAR REPORT */}
        {warData&&(<>
          <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"18px",marginBottom:"16px"}}>
            <div style={{textAlign:"center",marginBottom:"6px"}}>
              <span style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:700}}>Ranked War #{warData.warId}</span>
              <div style={{marginTop:"4px"}}><button onClick={()=>exportCSV(warData)} style={{background:"transparent",border:`1px solid ${th.gD}`,padding:"3px 10px",color:th.gold,fontSize:"10px",cursor:"pointer",fontFamily:"Arial,sans-serif"}}>⬇ Download CSV</button></div>
            </div>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"center",gap:"18px",marginBottom:"12px",flexWrap:"wrap"}}>
              <FactionBlock f={warData.faction} align="right" accent={th.vic} theme={th}/>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",paddingTop:"10px"}}><Cross size={12} color={th.iron}/><div style={{fontSize:"11px",color:th.steel,fontWeight:700,letterSpacing:"2px"}}>VS</div><div style={{fontSize:"12px",fontWeight:800,color:rc,padding:"2px 10px",background:rb,border:`1px solid ${rc}40`,textTransform:"uppercase",letterSpacing:"1px"}}>{warData.result}</div></div>
              <FactionBlock f={warData.opponent} align="left" accent={th.lost} theme={th}/>
            </div>
            <ScoreBar fs={warData.faction.score} os={warData.opponent.score} theme={th}/>

            {/* TIMELINE GRAPH */}
            <div style={{margin:"14px 0 10px"}}>
              {timeline
                ?<TimelineGraph timeline={timeline} theme={th} startTime={warData.startTime} endTime={warData.endTime} factionName={warData.faction.name} opponentName={warData.opponent.name}/>
                :<div style={{padding:"16px",background:th.tBg,border:`1px dashed ${th.tBd}`,textAlign:"center"}}><div style={{fontSize:"11px",color:th.steel}}>📈 Score timeline — attack data not available</div></div>
              }
            </div>

            {/* DATES + DURATION */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",flexWrap:"wrap"}}>
              <div style={{flex:1,height:"1px",background:`linear-gradient(90deg,transparent,${th.iron})`}}/>
              <div style={{textAlign:"center",fontSize:"11px",color:th.steel,lineHeight:1.8}}>
                <div style={{fontFamily:"Consolas,monospace"}}><span style={{color:th.bone}}>{fmtTCT(warData.startTime)}</span><span style={{margin:"0 6px",color:th.iron}}>until</span><span style={{color:th.bone}}>{fmtTCT(warData.endTime)}</span></div>
                <div style={{fontFamily:"Consolas,monospace",fontSize:"10px",color:th.bD}}><span>{fmtLocal(warData.startTime)}</span><span style={{margin:"0 6px",color:th.iron}}>until</span><span>{fmtLocal(warData.endTime)}</span></div>
                <div style={{marginTop:"2px"}}>Duration: <span style={{fontFamily:"Consolas,monospace",color:th.bD}}>{fmtDur(warData.startTime,warData.endTime)}</span><span style={{margin:"0 6px",color:th.iron}}>│</span><a href={`https://www.torn.com/war.php?step=rankreport&rankID=${warData.warId}`} target="_blank" rel="noopener noreferrer" style={{color:th.link,textDecoration:"none"}}>Official Torn Report ↗</a></div>
              </div>
              <div style={{flex:1,height:"1px",background:`linear-gradient(90deg,${th.iron},transparent)`}}/>
            </div>
          </div>

          {!hasAtk&&<div style={{padding:"6px 10px",background:th.iBg,border:`1px solid ${th.iBd}`,marginBottom:"12px",fontSize:"10px",color:th.link}}>Showing War Hits + Respect. Detail columns need attack data.</div>}

          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"8px"}}>
            <button onClick={()=>setCompact(!compact)} style={{...bS,fontSize:"11px",borderColor:compact?th.gD:th.iron,color:compact?th.gold:th.bD}}>{compact?"▶ Show All Columns":"◀ Compact View"}</button>
          </div>
          <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
            <MemberTable members={warData.faction.members} title={warData.faction.name} accent={th.vic} theme={th} hasAtk={hasAtk} isWinner={warData.faction.isWinner} compact={compact}/>
            <MemberTable members={warData.opponent.members} title={warData.opponent.name} accent={th.lost} theme={th} hasAtk={hasAtk} isWinner={warData.opponent.isWinner} compact={compact}/>
          </div>
        </>)}

        {/* EMPTY STATE */}
        {!warData&&!loading&&(<div style={{textAlign:"center",padding:"50px 20px",color:th.steel}}>
          <Cross size={36} color={th.iron}/>
          <div style={{fontSize:"14px",fontWeight:700,color:th.bD,marginTop:"10px",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px"}}>The forge awaits</div>
          <div style={{fontSize:"11px",maxWidth:"400px",margin:"0 auto",lineHeight:1.6}}>
            {!hasKey&&!factionId?"Open ⚙ Settings to enter your API key and Faction ID.":!hasKey?"Open ⚙ Settings to enter your API key.":!factionId?"Open ⚙ Settings to set your Faction ID.":histCount>0?"Enter a War ID and click ⚔ Load War, or open 📜 History to view a saved report.":"Enter a War ID above and click ⚔ Load War to get started."}
          </div>
        </div>)}
      </div>

      <footer style={{borderTop:`1px solid ${th.cb}`,padding:"12px 20px",marginTop:"30px",textAlign:"center",background:th.hBg}}><div style={{fontSize:"10px",color:th.steel}}><span style={{color:th.gD,fontWeight:700,letterSpacing:"1px"}}>WARFORGE</span><span style={{margin:"0 6px",color:th.iron}}>│</span>v1.0 · API key never stored on server · Data from Torn API</div></footer>
    </div>
  </>);
}

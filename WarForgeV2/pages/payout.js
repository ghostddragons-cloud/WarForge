import { useState, useEffect } from 'react';
import Head from 'next/head';

/*
 * ================================================================
 *  WARFORGE — PAYOUT CALCULATOR v1.1
 * ================================================================
 *  v1.1 — 2026-04-06
 *    [NEW]  OUTSIDE Chain Hits section with manual per-hit rate
 *           - outsideHits column in member table
 *           - OUTSIDE chain hit payout in distribution bar
 *    [FIX]  Payout persists on screen — state saved to localStorage
 *           - War data, payout config, and all inputs survive page exit
 *  v1.0 — 2026-04-06
 *    [NEW]  Payout calculator page (initial build)
 * ================================================================
 */

const DARK={n:"dark",bg:"#08080a",card:"#111113",cb:"#1f1d19",rA:"#111113",rB:"#191920",gold:"#c9942e",gB:"#e2b650",gD:"#7a6530",iron:"#3a3632",steel:"#706a5e",bone:"#d4cfc4",bD:"#8a847a",vic:"#4a9e3e",vicBg:"#1a2e14",def:"#8b1a1a",defBg:"#1c0e0e",link:"#7aade0",chain:"#4a9e3e",asst:"#5b8fce",lost:"#c44040",wBg:"#1a1608",eBg:"#1c0e0e",eBd:"#8b1a1a",iBg:"#0d1118",iBd:"#1a2940",inBg:"#08080a",hBg:"#111113",tBg:"#0d0d10",tBd:"#1a1a22",histBg:"#0e0e12",histHover:"#18181e",chainHit:"#b08030"};
const LIGHT={n:"light",bg:"#eae5da",card:"#faf8f4",cb:"#c8c0b0",rA:"#faf8f4",rB:"#f0ece2",gold:"#7a5a10",gB:"#5a4008",gD:"#a88030",iron:"#b8b0a0",steel:"#6a6458",bone:"#1a1810",bD:"#3a3630",vic:"#1a6a10",vicBg:"#ddf0d8",def:"#901818",defBg:"#f8dada",link:"#1a5a9a",chain:"#1a6a10",asst:"#204a8a",lost:"#a02020",wBg:"#f8f0d8",eBg:"#f8dada",eBd:"#c09090",iBg:"#dae8f4",iBd:"#90a8c0",inBg:"#eae5da",hBg:"#f4f0e8",tBg:"#f0ece2",tBd:"#c8c0b0",histBg:"#f0ece2",histHover:"#e8e2d6",chainHit:"#8a6020"};

function Cross({size=16,color}){return<svg width={size} height={size} viewBox="0 0 16 16"><rect x="6" y="1" width="4" height="14" rx=".5" fill={color}/><rect x="1" y="5" width="14" height="4" rx=".5" fill={color}/></svg>;}
function fmtNum(n){return typeof n==="number"&&!isNaN(n)?n.toLocaleString("en-US",{maximumFractionDigits:2}):"0";}
function fmtMoney(n){if(!n||isNaN(n))return"$0";return"$"+Math.round(n).toLocaleString("en-US");}
function fmtMoneyShort(n){if(!n||n===0)return"$0";if(n>=1e9)return"$"+((n/1e9).toFixed(2))+"B";if(n>=1e6)return"$"+((n/1e6).toFixed(2))+"M";if(n>=1e3)return"$"+((n/1e3).toFixed(1))+"K";return"$"+Math.round(n).toLocaleString("en-US");}


                                
const SAMPLE_PAYOUT={warId:"00000",result:"VICTORY",startTime:1743080400,endTime:1743345229,faction:{id:"99999",name:"Iron Wolves",score:4280,isWinner:true,rank_before:"Gold II",rank_after:"Gold III",rewards:{respect:4280,points:0,items:[{name:"Armor Cache",qty:2},{name:"Medium Arms Cache",qty:1}]},members:[{id:"100001",name:"SteelFang",warHits:95,outsideHits:0,chainHitsOutsideWar:8,respect:620.5,chainBonus:40,fairFight:2.45,assist:12,retal:3,overseas:8,lost:3},{id:"100002",name:"Phantom_X",warHits:82,outsideHits:0,chainHitsOutsideWar:3,respect:540.2,chainBonus:20,fairFight:2.18,assist:5,retal:1,overseas:15,lost:5},{id:"100003",name:"NovaBlade",warHits:71,outsideHits:0,chainHitsOutsideWar:5,respect:480.9,chainBonus:0,fairFight:2.65,assist:8,retal:0,overseas:4,lost:2},{id:"100004",name:"CrimsonAce",warHits:65,outsideHits:0,chainHitsOutsideWar:0,respect:390.1,chainBonus:10,fairFight:1.92,assist:3,retal:2,overseas:0,lost:4},{id:"100005",name:"Wraith99",warHits:48,outsideHits:0,chainHitsOutsideWar:4,respect:310.7,chainBonus:0,fairFight:2.31,assist:6,retal:0,overseas:2,lost:6},{id:"100006",name:"ToxicRain",warHits:35,outsideHits:0,chainHitsOutsideWar:2,respect:220.4,chainBonus:0,fairFight:1.78,assist:2,retal:1,overseas:0,lost:3},{id:"100007",name:"GhostPilot",warHits:28,outsideHits:0,chainHitsOutsideWar:0,respect:175.3,chainBonus:10,fairFight:3.12,assist:0,retal:0,overseas:0,lost:1},{id:"100008",name:"Viper_Kai",warHits:15,outsideHits:0,chainHitsOutsideWar:6,respect:98.5,chainBonus:0,fairFight:2.05,assist:1,retal:0,overseas:3,lost:2},{id:"100009",name:"Ember_Sky",warHits:8,outsideHits:0,chainHitsOutsideWar:0,respect:52.1,chainBonus:0,fairFight:1.55,assist:0,retal:0,overseas:0,lost:5}]},opponent:{id:"88888",name:"Shadow Syndicate",score:2150,isWinner:false,rank_before:"Gold III",rank_after:"Gold II",rewards:{respect:2150,points:0,items:[{name:"Small Arms Cache",qty:1}]},members:[]}};

const CH=[10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000];
function processWarData(raw,fid,wid){const r=raw.rankedwarreport;if(!r)return null;let fac=null,opp=null;for(const k in r.factions){if(String(k)===String(fid))fac={...r.factions[k],id:k};else opp={...r.factions[k],id:k};}if(!fac)return null;const mm=o=>Object.entries(o.members).map(([id,m])=>({id,name:m.name,warHits:m.attacks,respect:m.score,outsideHits:0,chainBonus:0,fairFight:0,assist:0,retal:0,overseas:0,lost:0}));const mr=rw=>{if(!rw)return null;const it=[];if(rw.items)for(const i in rw.items)it.push({name:rw.items[i].name,qty:rw.items[i].quantity});return{respect:rw.respect||0,points:rw.points||0,items:it};};const won=String(r.war.winner)===String(fid);return{warId:wid,result:won?"VICTORY":"DEFEAT",startTime:r.war.start,endTime:r.war.end,faction:{id:fac.id,name:fac.name,score:fac.score,rewards:mr(fac.rewards),rank_before:fac.rank_before,rank_after:fac.rank_after,members:mm(fac),isWinner:won},opponent:{id:opp.id,name:opp.name,score:opp.score,rewards:mr(opp.rewards),rank_before:opp.rank_before,rank_after:opp.rank_after,members:mm(opp),isWinner:!won}};}
function processAttacks(atks,fid,mems){const f={};for(const id in atks){const d=atks[id];if(String(d.attacker_faction)!==String(fid))continue;if(!f[d.attacker_id])f[d.attacker_id]={attacked:0,mugged:0,hospitalized:0,assist:0,escape:0,lost:0,stalemate:0,respect:0,chain_bonus:0,retaliation:0,overseas:0,fair_fight:0};const t=f[d.attacker_id],rk=d.result.toLowerCase();t[rk]=(t[rk]||0)+1;if(CH.includes(d.chain))t.chain_bonus+=d.respect;else t.respect+=d.respect;if(d.modifiers?.retaliation>1)t.retaliation++;if(d.modifiers?.overseas>1)t.overseas++;t.fair_fight+=(d.modifiers?.fair_fight||0);}return mems.map(m=>{const a=f[m.id];if(!a)return m;const totalHits=a.attacked+a.mugged+a.hospitalized;return{...m,outsideHits:0,chainHitsOutsideWar:0,respect:m.respect-a.chain_bonus,chainBonus:a.chain_bonus,fairFight:totalHits>0?a.fair_fight/totalHits:0,assist:a.assist,retal:a.retaliation,overseas:a.overseas,lost:a.lost};});}

// Fetch faction chains list, filter to those overlapping with war period
async function fetchWarChains(startTime,endTime,key){
  const res=await fetch(`/api/torn?type=faction_chains&key=${encodeURIComponent(key)}`);
  const data=await res.json();
  if(data.error||!data.chains)return[];
  // chains is an object keyed by chain ID, each has: chain, respect, start, end
  return Object.entries(data.chains).filter(([_,c])=>{
    // Chain overlaps with war if chain.start < warEnd AND chain.end > warStart
    return c.start<endTime&&c.end>startTime;
  }).map(([id,c])=>({id,...c}));
}

// Fetch a single chain report and extract per-member OUTSIDE chain hits
async function fetchChainReport(chainId,key){
  const res=await fetch(`/api/torn?type=chain_report&id=${encodeURIComponent(chainId)}&key=${encodeURIComponent(key)}`);
  const data=await res.json();
  if(data.error)return null;
  const report=data.chainreport;
  if(!report||!report.members)return null;
  // Each member has: attacks (total), war (war hits) — OUTSIDE = attacks - war
  const perMember={};
  for(const uid in report.members){
    const m=report.members[uid];
    const nonWar=Math.max(0,(m.attacks||0)-(m.war||0));
    if(nonWar>0)perMember[uid]=nonWar;
  }
  return perMember;
}

// Aggregate OUTSIDE chain hits across all chains during the war, apply to members
async function applyChainData(members,startTime,endTime,key,setLM){
  try{
    const chains=await fetchWarChains(startTime,endTime,key);
    if(!chains.length)return members;
    setLM(`Found ${chains.length} chain${chains.length>1?"s":""} during war. Loading reports...`);
    const aggregated={};// uid -> total OUTSIDE chain hits
    for(let i=0;i<chains.length;i++){
      const report=await fetchChainReport(chains[i].id,key);
      if(!report)continue;
      for(const uid in report){
        aggregated[uid]=(aggregated[uid]||0)+report[uid];
      }
      if(i%2===0)await new Promise(r=>setTimeout(r,200));// rate limit courtesy
    }
    setLM(`Processed ${chains.length} chain report${chains.length>1?"s":""}. ${Object.keys(aggregated).length} members had OUTSIDE chain hits.`);
    return members.map(m=>({...m,chainHitsOutsideWar:aggregated[m.id]||0}));
  }catch(e){console.warn("Chain data unavailable:",e.message);return members;}
}

async function fetchWarReport(wid,key){return(await fetch(`/api/torn?type=war&id=${encodeURIComponent(wid)}&key=${encodeURIComponent(key)}`)).json();}
async function fetchAllAttacks(st,et,key){let all={},from=st,s=0;while(from<et&&s<50){s++;const r=await fetch(`/api/torn?type=attacks&from=${from}&to=${et}&key=${encodeURIComponent(key)}`);const d=await r.json();if(d.error)throw new Error(`API ${d.error.code}: ${d.error.error}`);if(!d.attacks||!Object.keys(d.attacks).length)break;let mx=from;for(const a in d.attacks){all[a]=d.attacks[a];if(d.attacks[a].timestamp_started>mx)mx=d.attacks[a].timestamp_started;}if(mx<=from)break;from=mx;}return all;}

function loadSavedWars(){try{const s=localStorage.getItem("wf_history");return s?JSON.parse(s):{};}catch(e){return{};}}
function savePayoutState(state){try{localStorage.setItem("wf_payout_state",JSON.stringify(state));}catch(e){}}
function loadPayoutState(){try{const s=localStorage.getItem("wf_payout_state");return s?JSON.parse(s):null;}catch(e){return null;}}

export default function PayoutCalc(){
  const[dk,setDk]=useState(true);const[cb,setCB]=useState(false);
  const baseTheme=dk?DARK:LIGHT;
  const th=cb?{...baseTheme,lost:dk?"#4a7abf":"#2050a0",def:dk?"#1a3a8b":"#183090",defBg:dk?"#0e0e1c":"#dadaf8",eBg:dk?"#0e0e1c":"#dadaf8",eBd:dk?"#1a3a8b":"#9090c0"}:baseTheme;
  const[apiKey,setAK]=useState("");const[warId,setWI]=useState("");const[factionId,setFI]=useState("");
  const[loading,setL]=useState(false);const[error,setE]=useState(null);const[lMsg,setLM]=useState("");
  const[warData,setWD]=useState(null);const[hasAtk,setHA]=useState(false);
  const[showSet,setSS]=useState(false);const[showHist,setSH]=useState(false);
  const[savedWars,setSW]=useState({});const[saveKey,setSaveKey]=useState(false);
  const[isSample,setIsSample]=useState(false);
  const[copiedId, setCopiedId] = useState(null);
  const[estimateNote, setEstimateNote] = useState("");
  const[totalReward,setTotalReward]=useState("");const[takeawayPct,setTakeawayPct]=useState(20);
  const[expSpies,setExpSpies]=useState("");const[expRevives,setExpRevives]=useState("");
  const[expBounty,setExpBounty]=useState("");const[expChain,setExpChain]=useState("");
  const[expXanax,setExpXanax]=useState("");const[scorePct,setScorePct]=useState(75);
  const[payAssists,setPayAssists]=useState(true);const[assistRate,setAssistRate]=useState("300,000");
  const[payNonWarChainHits,setPayNWCH]=useState(false);const[chainHitRate,setChainHitRate]=useState("0");
  const[sortCol,setSortCol]=useState("totalPay");const[sortAsc,setSortAsc]=useState(false);
  const[liveStatus,setLiveStatus]=useState("IDLE");

  // Persist payout config
  useEffect(()=>{if(!warData)return;savePayoutState({warData,hasAtk,warId,totalReward,takeawayPct,expSpies,expRevives,expBounty,expChain,expXanax,scorePct,payAssists,assistRate,payNonWarChainHits,chainHitRate});},[warData,hasAtk,warId,totalReward,takeawayPct,expSpies,expRevives,expBounty,expChain,expXanax,scorePct,payAssists,assistRate,payNonWarChainHits,chainHitRate]);

  // Init
  useEffect(()=>{
    try{const s=localStorage.getItem("wf_fid");if(s)setFI(s);}catch(e){}
    try{const sk=localStorage.getItem("wf_savekey");if(sk==="true"){setSaveKey(true);const k=localStorage.getItem("wf_apikey");if(k)setAK(k);}}catch(e){}
    try{setCB(localStorage.getItem("wf_colorblind")==="true");}catch(e){}
    try{const ls=localStorage.getItem("wf_live_state");if(ls){const lp=JSON.parse(ls);setLiveStatus(lp.status||"IDLE");}}catch(e){}
    setSW(loadSavedWars());
    const saved=loadPayoutState();
    if(saved){
      if(saved.warData){setWD(saved.warData);setHA(saved.hasAtk||false);setWI(saved.warId||"");}
      if(saved.totalReward)setTotalReward(saved.totalReward);
      if(saved.takeawayPct!==undefined)setTakeawayPct(saved.takeawayPct);
      if(saved.expSpies)setExpSpies(saved.expSpies);if(saved.expRevives)setExpRevives(saved.expRevives);
      if(saved.expBounty)setExpBounty(saved.expBounty);if(saved.expChain)setExpChain(saved.expChain);
      if(saved.expXanax)setExpXanax(saved.expXanax);
      if(saved.scorePct!==undefined)setScorePct(saved.scorePct);
      if(saved.payAssists!==undefined)setPayAssists(saved.payAssists);
      if(saved.assistRate)setAssistRate(saved.assistRate);
      if(saved.payNonWarChainHits!==undefined)setPayNWCH(saved.payNonWarChainHits);
      if(saved.chainHitRate)setChainHitRate(saved.chainHitRate);
    }
  },[]);

  // Sample mode sync
  useEffect(()=>{const check=()=>{const flag=localStorage.getItem("wf_sample_mode")==="true";setIsSample(flag);if(flag&&warData?.warId!=="00000"){setWD(SAMPLE_PAYOUT);setHA(true);setWI("00000");setE(null);setTotalReward("988,000,000");setTakeawayPct(20);setExpXanax("40,000,000");setExpSpies("1,500,000");setExpRevives("10,000,000");setExpBounty("5,250,000");setExpChain("6,900,000");setChainHitRate("0");}else if(!flag&&warData?.warId==="00000"){setWD(null);setWI("");setHA(false);try{localStorage.removeItem("wf_payout_state");}catch(e){}}};check();const h=(e)=>{if(e.key==="wf_sample_mode")check();};window.addEventListener("storage",h);return()=>window.removeEventListener("storage",h);},[warData]);

  const loadWar=async()=>{if(!apiKey.trim()){setE("Enter your API key in ⚙ Settings");setSS(true);return;}if(!warId.trim()){setE("Enter a War ID");return;}if(!factionId.trim()){setE("Set Faction ID in ⚙ Settings first");setSS(true);return;}setL(true);setE(null);setLM("Forging connection to Torn API...");try{const raw=await fetchWarReport(warId,apiKey);if(raw.error)throw new Error(`API Error ${raw.error.code}: ${raw.error.error}`);if(!raw.rankedwarreport)throw new Error("No war report found for this ID.");const p=processWarData(raw,factionId,warId);if(!p)throw new Error("Faction ID not found in this war. Check Settings.");setLM("Forging attack details...");let ga=false;try{const atk=await fetchAllAttacks(p.startTime,p.endTime,apiKey);setLM(`Processing ${Object.keys(atk).length} attacks...`);p.faction.members=processAttacks(atk,factionId,p.faction.members);p.opponent.members=processAttacks(atk,p.opponent.id,p.opponent.members);ga=true;}catch(ae){console.warn("Attack details unavailable:",ae.message);}setLM("Loading chain reports...");try{p.faction.members=await applyChainData(p.faction.members,p.startTime,p.endTime,apiKey,setLM);}catch(ce){console.warn("Chain data unavailable:",ce.message);}setWD(p);setHA(ga);if(localStorage.getItem("wf_sample_mode")==="true"){localStorage.setItem("wf_sample_mode","false");window.dispatchEvent(new StorageEvent("storage",{key:"wf_sample_mode",newValue:"false"}));}}catch(e){setE(e.message);setWD(null);}finally{setL(false);setLM("");}};

  const loadFromHistory=(wid)=>{const entry=savedWars[wid];if(!entry)return;setWD(entry.warData);setHA(entry.hasAtk||false);setWI(wid);setSH(false);setE(null);if(localStorage.getItem("wf_sample_mode")==="true"){localStorage.setItem("wf_sample_mode","false");window.dispatchEvent(new StorageEvent("storage",{key:"wf_sample_mode",newValue:"false"}));}};
  const loadSample=()=>{if(warData?.warId==="00000"){setWD(null);setWI("");setE(null);setHA(false);setTotalReward("");setExpSpies("");setExpRevives("");setExpBounty("");setExpChain("");setExpXanax("");setChainHitRate("0");try{localStorage.setItem("wf_sample_mode","false");localStorage.removeItem("wf_payout_state");window.dispatchEvent(new StorageEvent("storage",{key:"wf_sample_mode",newValue:"false"}));}catch(e){}}else{setWD(SAMPLE_PAYOUT);setHA(true);setWI("00000");setE(null);setTotalReward("988000000");setTakeawayPct(20);setExpXanax("40000000");setExpSpies("");setExpRevives("");setExpBounty("");setExpChain("");setChainHitRate("0");try{localStorage.setItem("wf_sample_mode","true");window.dispatchEvent(new StorageEvent("storage",{key:"wf_sample_mode",newValue:"true"}));}catch(e){}}};
  const clearPayout=()=>{setWD(null);setWI("");setE(null);setHA(false);setTotalReward("");setExpSpies("");setExpRevives("");setExpBounty("");setExpChain("");setExpXanax("");setChainHitRate("0");try{localStorage.removeItem("wf_payout_state");}catch(e){}};

  // --- CACHE ESTIMATOR LOGIC ---
const estimateCaches = async () => {
  if (!apiKey || !warData?.faction?.rewards?.items) return setE("No API key or items.");
  setL(true); setLM("Scanning..."); setE(null); setEstimateNote("");
  const itemIds = { "Melee Cache":361, "Small Arms Cache":362, "Medium Arms Cache":363, "Heavy Arms Cache":364, "Armor Cache":365 };
  let total = 0, fallback = false;
  for (const {name, qty} of warData.faction.rewards.items) {
    const id = itemIds[name];
    if (!id) continue;
    const res = await fetch(`/api/torn?type=bazaar_price&id=${id}&key=${encodeURIComponent(apiKey)}`);
    const data = await res.json();
    let price = data.bazaar?.length ? data.bazaar.sort((a,b)=>a.price-b.price)[0].price : null;
    if (!price && data.itemmarket?.length) {
      price = data.itemmarket.sort((a,b)=>a.cost-b.cost)[0].cost * 0.95;
      fallback = true;
    }
    total += (price || 0) * qty;
    await new Promise(r => setTimeout(r, 300));
  }
  total ? (setTotalReward(total.toLocaleString()), fallback && setEstimateNote("(market price - 5%)")) : setE("No listings found.");
  setL(false); setLM("");
};
  
  // Calculations
  const num=v=>{const n=parseFloat(String(v).replace(/,/g,""));return isNaN(n)?0:n;};
  const reward=num(totalReward);const takeaway=reward*(takeawayPct/100);
  const expTotal=num(expSpies)+num(expRevives)+num(expBounty)+num(expChain)+num(expXanax);
  const netReward=Math.max(0,reward-takeaway-expTotal);
  const members=warData?.faction?.members||[];
  const totalWarHits=members.reduce((s,m)=>s+(m.warHits||0),0);
  const totalScore=members.reduce((s,m)=>s+((m.respect||0)+(m.chainBonus||0)),0);
  const totalAssists=members.reduce((s,m)=>s+(m.assist||0),0);
  const totalNonWarHits=members.reduce((s,m)=>s+(m.chainHitsOutsideWar||0),0);
  const perAssist=payAssists?num(assistRate):0;const totalAssistPayout=payAssists?perAssist*totalAssists:0;
  const perChainHit=payNonWarChainHits?num(chainHitRate):0;const totalChainHitPayout=perChainHit*totalNonWarHits;
  const poolAfterDeductions=Math.max(0,netReward-totalAssistPayout-totalChainHitPayout);
  const scorePool=poolAfterDeductions*(scorePct/100);const hitPool=poolAfterDeductions-scorePool;
  const perHit=totalWarHits>0?hitPool/totalWarHits:0;const perScore=totalScore>0?scorePool/totalScore:0;

  const breakdown=members.map(m=>{const mScore=(m.respect||0)+(m.chainBonus||0);const hitPay=m.warHits*perHit;const scorePay=mScore*perScore;const assistPay=payAssists?(m.assist||0)*perAssist:0;const chainHitPay=payNonWarChainHits?(m.chainHitsOutsideWar||0)*perChainHit:0;const totalPay=hitPay+scorePay+assistPay+chainHitPay;return{...m,score:mScore,hitPay,scorePay,assistPay,chainHitPay,totalPay};});
  const doSort=k=>{if(sortCol===k)setSortAsc(!sortAsc);else{setSortCol(k);setSortAsc(false);}};
  const sorted=[...breakdown].sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];return typeof av==="string"?(sortAsc?av.localeCompare(bv):bv.localeCompare(av)):(sortAsc?av-bv:bv-av);});
  const maxHits = Math.max(...breakdown.map(m => m.warHits || 0));
  const maxRespect = Math.max(...breakdown.map(m => m.score || 0));
  const maxPay = Math.max(...breakdown.map(m => m.totalPay || 0));
  const totHitPay=breakdown.reduce((s,m)=>s+m.hitPay,0);const totScorePay=breakdown.reduce((s,m)=>s+m.scorePay,0);
  const totAssistPay=breakdown.reduce((s,m)=>s+m.assistPay,0);const totChainHitPay=breakdown.reduce((s,m)=>s+m.chainHitPay,0);
  const totPay=breakdown.reduce((s,m)=>s+m.totalPay,0);

  const exportCSV=()=>{const h=["Member","Member ID","War Hits","Chain Hits (OUTSIDE)","Score","Assists","Hit Payout","Score Payout","Assist Payout","Chain Hit Payout","Total Payout"];const rows=[h.join(",")];sorted.forEach(m=>{rows.push([`"${m.name}"`,m.id,m.warHits,m.chainHitsOutsideWar||0,m.score.toFixed(2),m.assist||0,Math.round(m.hitPay),Math.round(m.scorePay),Math.round(m.assistPay),Math.round(m.chainHitPay),Math.round(m.totalPay)].join(","));});rows.push(["TOTALS","",totalWarHits,totalNonWarHits,totalScore.toFixed(2),totalAssists,Math.round(totHitPay),Math.round(totScorePay),Math.round(totAssistPay),Math.round(totChainHitPay),Math.round(totPay)].join(","));const b=new Blob([rows.join("\n")],{type:"text/csv"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=`warforge_payout_${warData?.warId||"export"}.csv`;a.click();URL.revokeObjectURL(u);};
  const copyForumPost = () => {
    if (!warData || !breakdown.length) return;
    const w = warData, f = w.faction, o = w.opponent, top = sorted.slice(0, 15);
    const rows = top.map(m => `<tr style="border-bottom:1px solid #444;"><td style="padding:6px 8px;"><b>${escapeHtml(m.name)}</b></td><td style="padding:6px 8px;text-align:center;">${m.warHits||0}</td><td style="padding:6px 8px;text-align:center;">${(m.score||0).toFixed(1)}</td><td style="padding:6px 8px;text-align:right;">${fmtMoney(m.totalPay)}</td></tr>`).join('');
    const resultColor = w.result === 'VICTORY' ? '#4caf50' : '#f44336';
    const html = `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;"><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><strong>War #${w.warId}</strong><span style="font-size:22px;font-weight:bold;color:${resultColor};">${w.result}</span></div><div style="text-align:center;margin-bottom:8px;"><h2 style="margin:0;">${escapeHtml(f.name)}</h2></div><div style="text-align:center;margin-bottom:16px;font-size:18px;"><strong>${escapeHtml(f.name)} [${fmtNum(f.score)}] vs ${escapeHtml(o.name)} [${fmtNum(o.score)}]</strong></div><hr><div style="text-align:center;margin:16px 0;"><span style="font-size:24px;font-weight:bold;color:#4caf50;">Total Payout: ${fmtMoney(totPay)}</span></div><hr><table style="width:100%;border-collapse:collapse;background:#1e1e1e;color:#eee;"><thead><tr style="background:#333;"><th style="padding:8px;text-align:left;">Member</th><th style="padding:8px;text-align:center;">War Hits</th><th style="padding:8px;text-align:center;">Score</th><th style="padding:8px;text-align:right;">Payout</th></tr></thead><tbody>${rows}</tbody></table>${top.length < breakdown.length ? `<p><em>... and ${breakdown.length-top.length} more members</em></p>` : ''}<hr><p style="font-size:12px;color:#aaa;"><em>Generated by WarForge</em></p></div>`;
    navigator.clipboard.writeText(html);
    setCopiedId("forum");
    setTimeout(() => setCopiedId(null), 2000);
  };
  const rewardStr=()=>{if(!warData?.faction?.rewards)return"—";const r=warData.faction.rewards;const p=[];if(r.respect)p.push(`${fmtNum(r.respect)} Respect`);if(r.points)p.push(`${fmtNum(r.points)} Points`);if(r.items)r.items.forEach(i=>p.push(`${i.qty}x ${i.name}`));return p.join(" · ")||"—";};

  const isSampleActive=warData?.warId==="00000";
  const iS={width:"100%",background:th.inBg,border:`1px solid ${th.iron}`,padding:"8px 12px",color:th.bone,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"Arial,sans-serif"};
  const lS={fontSize:"11px",color:th.steel,display:"block",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700,fontFamily:"Arial,sans-serif"};
  const bP={padding:"9px 24px",background:dk?`linear-gradient(180deg,${th.gold},#a07820)`:`linear-gradient(180deg,#b08020,#8a6010)`,border:"none",color:dk?"#0a0a0a":"#fff",fontWeight:700,fontSize:"14px",cursor:"pointer",whiteSpace:"nowrap",minWidth:"120px",textTransform:"uppercase",letterSpacing:"0.3px",fontFamily:"Arial,sans-serif"};
  const bS={background:th.card,border:`1px solid ${th.iron}`,padding:"6px 12px",color:th.bD,fontSize:"12px",cursor:"pointer",fontFamily:"Arial,sans-serif"};
  const histCount=Object.keys(savedWars).length;const hasKey=apiKey.trim().length>0;
  const secBox={background:th.card,border:`1px solid ${th.cb}`,padding:"16px",marginBottom:"14px"};
  const secTitle={fontSize:"11px",fontWeight:700,color:th.gold,marginBottom:"10px",textTransform:"uppercase",letterSpacing:"1px"};
  const moneyInput = (label, val, setVal) => (
    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
      <span style={{fontSize:"11px",color:th.steel,minWidth:"180px",fontFamily:"Arial,sans-serif"}}>{label}</span>
      <div style={{position:"relative",flex:1,maxWidth:"220px", display:"flex", alignItems:"center"}}>
        <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",color:th.steel,fontSize:"13px",fontFamily:"Consolas,monospace", pointerEvents:"none"}}>$</span>
        <input 
          value={val} 
          onChange={e => {
            let raw = e.target.value.toLowerCase().replace(/[^0-9.kmb]/g, "");
            
            // Shorthand Parsing
            if (raw.endsWith('k')) raw = (parseFloat(raw) * 1000).toString();
            else if (raw.endsWith('m')) raw = (parseFloat(raw) * 1000000).toString();
            else if (raw.endsWith('b')) raw = (parseFloat(raw) * 1000000000).toString();
            
            const parts = raw.replace(/[^0-9.]/g, "").split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            const formatted = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
            setVal(formatted);
          }} 
          placeholder="0" 
          style={{...iS, paddingLeft:"22px", paddingRight:"28px", fontSize:"13px", fontFamily:"Consolas,monospace"}}
        />
        {val && (
          <button 
            onClick={() => setVal("")}
            style={{position: "absolute", right: "6px", background: "transparent", border: "none", color: th.steel, cursor: "pointer", fontSize: "16px", fontWeight: "bold"}}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
  const slider=(label,val,setVal,min,max,suffix="%")=>(<div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}><span style={{fontSize:"11px",color:th.steel,minWidth:"140px",fontFamily:"Arial,sans-serif"}}>{label}</span><input type="range" min={min} max={max} value={val} onChange={e=>setVal(Number(e.target.value))} style={{flex:1,maxWidth:"200px",accentColor:th.gold}}/><span style={{fontSize:"13px",fontWeight:700,color:th.bone,fontFamily:"Consolas,monospace",minWidth:"50px",textAlign:"right"}}>{val}{suffix}</span></div>);
  const statLine=(label,val,accent)=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${th.cb}`}}><span style={{fontSize:"11px",color:th.steel,textTransform:"uppercase",letterSpacing:"0.3px"}}>{label}</span><span style={{fontSize:"13px",fontWeight:700,color:accent||th.bone,fontFamily:"Consolas,monospace"}}>{val}</span></div>);
  const cellS={padding:"6px 6px",fontSize:"11.5px",borderBottom:`1px solid ${th.cb}`,whiteSpace:"nowrap",fontFamily:"Arial,sans-serif"};
  const monoS={fontFamily:"Consolas,monospace",fontSize:"11.5px"};
  const hdS={...cellS,color:th.gold,fontWeight:700,cursor:"pointer",userSelect:"none",position:"sticky",top:0,background:th.card,zIndex:1,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.4px",padding:"8px 6px"};
  const cols=[{k:"name",l:"Member",align:"left"},{k:"warHits",l:"War Hits"},{k:"chainHitsOutsideWar",l:"Chain (NW)"},{k:"score",l:"Score"},{k:"assist",l:"Assists"},{k:"hitPay",l:"Hit Payout",money:true},{k:"scorePay",l:"Score Payout",money:true},...(payAssists?[{k:"assistPay",l:"Assist Pay",money:true}]:[]),...(payNonWarChainHits&&perChainHit>0?[{k:"chainHitPay",l:"Chain Pay",money:true}]:[]),{k:"totalPay",l:"Total Payout",money:true,accent:true}];

  return(<>
    <Head><title>WarForge — Payout Calculator</title><meta name="description" content="Torn City ranked war payout calculator"/><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div style={{minHeight:"100vh",background:th.bg,color:th.bone,fontFamily:"Arial,sans-serif",boxShadow:isSampleActive?"inset 0 0 0 3px #c44040":"none"}}>
      <header style={{borderBottom:`1px solid ${th.cb}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",background:th.hBg}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}><Cross size={22} color={th.gold}/><div><a href="/" style={{fontWeight:800,fontSize:"20px",letterSpacing:"2px",color:th.gold,textTransform:"uppercase",textDecoration:"none",display:"block"}}>WarForge</a><div style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.2px"}}>Payout Calculator</div></div></div>
        <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
          <a href="/" style={{...bS,textDecoration:"none",color:th.gold,border:`1px solid ${th.gD}`,fontWeight:600}}>⚔ Reports</a>
          <a href="/live" style={{...bS,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"4px",color:liveStatus==="LIVE"?"#8A9A5B":"#4169E1",border:`1px solid ${liveStatus==="LIVE"?"#8A9A5B":"#4169E1"}`}}>{liveStatus==="LIVE"?"🚨 Live":"📴 Live"}</a>
          <a href="/recon" style={{...bS,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"4px",color:"#4169E1",border:"1px solid #4169E1"}}>🔍 Recon</a>
          <button onClick={()=>{setSH(!showHist);if(!showHist)setSS(false);}} style={{...bS,borderColor:showHist?th.gD:th.iron,color:showHist?th.gold:th.bD}}>📜 History{histCount>0&&<span style={{marginLeft:"4px",background:th.gold,color:"#0a0a0a",borderRadius:"8px",padding:"0 5px",fontSize:"10px",fontWeight:700}}>{histCount}</span>}</button>
          <button onClick={()=>{const nv=!cb;setCB(nv);try{localStorage.setItem("wf_colorblind",String(nv));}catch(e){}}} style={{...bS,color:cb?"#e03030":"#4a7abf",border:`1px solid ${cb?"#e03030":"#4a7abf"}`,padding:"6px 12px"}}>👁{cb?" CB":""}</button>
          <button onClick={()=>setDk(!dk)} style={{...bS,color:dk?"#ffffff":"#1a1810",padding:"6px 12px"}}>{dk?"☀":"☽"}</button>
          <button onClick={()=>{setSS(!showSet);if(!showSet)setSH(false);}} style={{...bS,borderColor:showSet?th.gD:th.iron,color:showSet?th.gold:th.bD}}>⚙ Settings</button>
        </div>
      </header>
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"16px 20px"}}>
        {showSet&&(<div style={secBox}><div style={secTitle}>⚙ Forge Settings</div><div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}><div style={{flex:2,minWidth:"220px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}><label style={{...lS,margin:0}}>API Key</label><button onClick={()=>setSaveKey(!saveKey)} style={{background:"transparent",border:`1px solid ${saveKey?th.gD:th.iron}`,padding:"1px 6px",fontSize:"9px",color:saveKey?th.gold:th.steel,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>{saveKey?"🔒 API Locked":"🔓 API Unlocked"}</button></div><input type="password" value={apiKey} onChange={e=>setAK(e.target.value)} placeholder="Your Torn API key (full access)" style={iS}/></div><div style={{flex:1,minWidth:"160px"}}><label style={lS}>Faction ID</label><input value={factionId} onChange={e=>setFI(e.target.value)} placeholder="e.g. 12345" style={iS}/></div></div></div>)}
        {showHist&&(<div style={secBox}><div style={secTitle}>📜 War History — select a war to load</div>{Object.keys(savedWars).length===0?<div style={{padding:"12px",textAlign:"center",color:th.steel,fontSize:"12px"}}>No saved wars. Load a war from the Reports page first.</div>:<div style={{maxHeight:"240px",overflowY:"auto"}}>{Object.entries(savedWars).sort((a,b)=>(b[1].summary?.date||0)-(a[1].summary?.date||0)).map(([wid,entry])=>{const s=entry.summary||{};return(<div key={wid} onClick={()=>loadFromHistory(wid)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 10px",marginBottom:"4px",background:th.histBg,border:`1px solid ${th.cb}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=th.histHover} onMouseLeave={e=>e.currentTarget.style.background=th.histBg}><span style={{fontSize:"14px"}}>{s.result==="VICTORY"?"💰":"💀"}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:"12px",fontWeight:600,color:th.bone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>#{wid} vs {s.opponent||"Unknown"}</div><div style={{fontSize:"10px",color:th.steel}}>{fmtNum(s.fScore||0)} - {fmtNum(s.oScore||0)}</div></div><span style={{fontSize:"12px",fontWeight:700,color:s.result==="VICTORY"?th.vic:th.lost}}>{s.result==="VICTORY"?"W":"L"}</span></div>);})}</div>}</div>)}
        <div style={secBox}><div style={{display:"flex",gap:"10px",alignItems:"end",justifyContent:"center",flexWrap:"wrap"}}><div style={{minWidth:"120px",maxWidth:"240px"}}><label style={lS}>War ID</label><input value={warId} onChange={e=>setWI(e.target.value)} placeholder="e.g. 42069" onKeyDown={e=>e.key==="Enter"&&loadWar()} style={iS}/></div><button onClick={loadWar} disabled={loading} style={{...bP,opacity:loading?0.5:1,cursor:loading?"wait":"pointer"}}>{loading?"Forging...":"⚔ Load War"}</button>{warData&&<button onClick={clearPayout} style={{...bP,padding:"9px 16px"}}>❌ Hide</button>}<button onClick={loadSample} style={{background:isSampleActive?th.wBg:th.card,border:`1px solid ${isSampleActive?th.gD:th.iron}`,padding:"9px 16px",color:isSampleActive?th.gold:th.steel,fontSize:"13px",cursor:"pointer",fontFamily:"Arial,sans-serif",whiteSpace:"nowrap"}}>Sample</button></div>{!hasKey&&<div style={{textAlign:"center",marginTop:"6px",fontSize:"11px",color:th.gold}}>Set your API key in ⚙ Settings first</div>}{error&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.eBg,border:`1px solid ${th.eBd}`,color:th.lost,fontSize:"11px",lineHeight:1.5}}>{error}</div>}{loading&&lMsg&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.iBg,border:`1px solid ${th.iBd}`,color:th.link,fontSize:"11px"}}>{lMsg}</div>}</div>
        {isSampleActive&&(<div style={{padding:"6px 10px",background:th.wBg,border:`1px solid ${th.gD}`,marginBottom:"12px",fontSize:"11px",color:th.gold,textAlign:"center"}}>📋 Sample data — enter your API key and a real War ID to load actual war reports.</div>)}
        {warData&&(<>
          <div style={secBox}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}><div><span style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:700}}>Ranked War #{warData.warId}</span><div style={{fontSize:"15px",fontWeight:700,color:th.bone,marginTop:"2px"}}>{warData.faction?.name} <span style={{color:th.vic,fontFamily:"Consolas,monospace"}}>{fmtNum(warData.faction?.score||0)}</span> <span style={{color:th.steel,fontSize:"11px"}}>vs</span> {warData.opponent?.name} <span style={{color:th.lost,fontFamily:"Consolas,monospace"}}>{fmtNum(warData.opponent?.score||0)}</span></div></div><div style={{fontSize:"12px",fontWeight:800,color:warData.result==="VICTORY"?th.vic:th.def,padding:"2px 10px",background:warData.result==="VICTORY"?th.vicBg:th.defBg,border:`1px solid ${warData.result==="VICTORY"?th.vic:th.def}40`,textTransform:"uppercase",letterSpacing:"1px"}}>{warData.result}</div></div><div style={{fontSize:"10px",color:th.steel,marginTop:"4px"}}>Rewards: {rewardStr()}</div></div>
          <div style={{display:"flex",gap:"14px",flexWrap:"wrap",marginBottom:"14px"}}>
            <div style={{...secBox,flex:1,minWidth:"320px",marginBottom:0}}>
              <div style={secTitle}>💰 Faction Reward & Expenses</div>
             {moneyInput("FACTION REWARD TOTAL",totalReward,setTotalReward)}
          {estimateNote && (
            <div style={{fontSize:"10px", color:th.steel, marginTop:"-4px", marginBottom:"4px", textAlign:"right"}}>
              {estimateNote}
            </div>
          )}
          {warData?.faction?.rewards?.items?.length > 0 && (
            <div style={{display:"flex", justifyContent:"flex-end", marginBottom:"8px"}}>
              <button 
                onClick={estimateCaches}
                disabled={loading}
                style={{background:"transparent", border:`1px solid ${th.gD}`, padding:"3px 10px", color:th.gold, fontSize:"10px", cursor:loading?"wait":"pointer", fontFamily:"Arial,sans-serif", opacity:loading?0.5:1}}
              >
                {loading ? "Estimating..." : "⚡ Auto-Estimate from Bazaar"}
              </button>
            </div>
          )}
              {slider("FACTION TAKEAWAY",takeawayPct,setTakeawayPct,0,50)}
              {statLine("Takeaway Amount",fmtMoney(takeaway),th.lost)}
              <div style={{height:"1px",background:th.iron,margin:"10px 0"}}/>
              {moneyInput("EXPENSE - STAT SPIES",expSpies,setExpSpies)}
              {moneyInput("EXPENSE - REVIVES",expRevives,setExpRevives)}
              {moneyInput("EXPENSE - BOUNTY / MERC",expBounty,setExpBounty)}
              {moneyInput("EXPENSE - CHAIN WATCHER",expChain,setExpChain)}
              {moneyInput("EXPENSE - XANAX & OTHER",expXanax,setExpXanax)}
              <div style={{height:"1px",background:th.iron,margin:"10px 0"}}/>
              {statLine("EXPENSE TOTAL",fmtMoney(expTotal),th.lost)}
              <div style={{height:"2px",background:th.gold+"60",margin:"10px 0"}}/>
              {statLine("NET REWARD FOR PAYOUT",fmtMoney(netReward),th.vic)}
            </div>
            <div style={{...secBox,flex:1,minWidth:"320px",marginBottom:0}}>
              <div style={secTitle}>⚔ War Hit Payout</div>
              {statLine("TOTAL WAR HITS",fmtNum(totalWarHits))}
              {statLine("PAYOUT / WAR HIT",fmtMoney(perHit),th.gB)}
              {statLine("TOTAL WAR HIT PAYOUT",fmtMoney(totHitPay),th.vic)}
              <div style={{height:"2px",background:th.iron,margin:"14px 0"}}/>
              <div style={secTitle}>📊 Score Payout</div>
              <div style={{display:"flex", gap:"8px", marginBottom:"10px"}}>
                {[
                  { label: "Aggressive (25%)", val: 25 },
                  { label: "Balanced (50%)", val: 50 },
                  { label: "Respect (75%)", val: 75 }
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => setScorePct(p.val)}
                    style={{
                      flex: 1,
                      padding: "5px",
                      fontSize: "10px",
                      background: scorePct === p.val ? th.gD : th.rB,
                      color: scorePct === p.val ? th.bone : th.steel,
                      border: `1px solid ${scorePct === p.val ? th.gold : th.cb}`,
                      borderRadius: "4px",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      fontFamily: "Arial, sans-serif"
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {slider("SCORE % OF POOL",scorePct,setScorePct,0,100)}
              {statLine("TOTAL SCORE",fmtNum(totalScore))}
              {statLine("PAYOUT / SCORE POINT",fmtMoney(perScore),th.gB)}
              {statLine("TOTAL SCORE PAYOUT",fmtMoney(totScorePay),th.vic)}
              <div style={{height:"2px",background:th.iron,margin:"14px 0"}}/>
              <div style={secTitle}>🤝 Assist Payout</div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}><span style={{fontSize:"11px",color:th.steel,minWidth:"140px"}}>PAY FOR ASSISTS?</span><button onClick={()=>setPayAssists(!payAssists)} style={{padding:"4px 16px",background:payAssists?th.vicBg:th.defBg,border:`1px solid ${payAssists?th.vic:th.def}`,color:payAssists?th.vic:th.lost,fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:"Arial,sans-serif",letterSpacing:"0.5px"}}>{payAssists?"YES":"NO"}</button></div>
              {payAssists&&(<>{moneyInput("$ PER ASSIST",assistRate,setAssistRate)}{statLine("TOTAL ASSISTS",fmtNum(totalAssists))}{statLine("TOTAL ASSISTS PAYOUT",fmtMoney(totalAssistPayout),th.asst)}</>)}
              <div style={{height:"2px",background:th.iron,margin:"14px 0"}}/>
              <div style={secTitle}>🔗 Outside Chain Hit Payout</div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}><span style={{fontSize:"11px",color:th.steel,minWidth:"140px"}}>PAY FOR CHAIN HITS?</span><button onClick={()=>setPayNWCH(!payNonWarChainHits)} style={{padding:"4px 16px",background:payNonWarChainHits?th.vicBg:th.defBg,border:`1px solid ${payNonWarChainHits?th.vic:th.def}`,color:payNonWarChainHits?th.vic:th.lost,fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:"Arial,sans-serif",letterSpacing:"0.5px"}}>{payNonWarChainHits?"YES":"NO"}</button></div>
              {statLine("TOTAL OUTSIDE CHAIN HITS",fmtNum(totalNonWarHits))}
              {payNonWarChainHits&&(<>{moneyInput("PAYOUT / OUTSIDE CHAIN HIT",chainHitRate,setChainHitRate)}{statLine("TOTAL OUTSIDE CHAIN HIT PAYOUT",fmtMoney(totalChainHitPayout),th.chainHit)}</>)}
              {!hasAtk&&<div style={{fontSize:"10px",color:th.steel,marginTop:"6px",fontStyle:"italic"}}>Chain hit counts require attack data. Load with API key for full data.</div>}
            </div>
          </div>
          {netReward>0&&(<div style={secBox}><div style={secTitle}>📊 Payout Distribution</div><div style={{height:"20px",display:"flex",overflow:"hidden",border:`1px solid ${th.cb}`,marginBottom:"6px"}}>{totHitPay>0&&<div style={{width:`${(totHitPay/netReward)*100}%`,background:th.gold,transition:"width 0.3s"}} title={`Hit Payout: ${fmtMoneyShort(totHitPay)}`}/>}{totScorePay>0&&<div style={{width:`${(totScorePay/netReward)*100}%`,background:th.vic,transition:"width 0.3s"}} title={`Score Payout: ${fmtMoneyShort(totScorePay)}`}/>}{totAssistPay>0&&<div style={{width:`${(totAssistPay/netReward)*100}%`,background:th.asst,transition:"width 0.3s"}} title={`Assist Payout: ${fmtMoneyShort(totAssistPay)}`}/>}{totChainHitPay>0&&<div style={{width:`${(totChainHitPay/netReward)*100}%`,background:th.chainHit,transition:"width 0.3s"}} title={`Chain Hit Payout: ${fmtMoneyShort(totChainHitPay)}`}/>}{(netReward-totPay)>1&&<div style={{flex:1,background:th.iron}} title="Unallocated"/>}</div><div style={{display:"flex",gap:"14px",flexWrap:"wrap",fontSize:"10px",color:th.steel}}><span><span style={{display:"inline-block",width:"10px",height:"10px",background:th.gold,marginRight:"4px",verticalAlign:"middle"}}/> Hits: {fmtMoneyShort(totHitPay)} ({netReward>0?((totHitPay/netReward)*100).toFixed(1):0}%)</span><span><span style={{display:"inline-block",width:"10px",height:"10px",background:th.vic,marginRight:"4px",verticalAlign:"middle"}}/> Score: {fmtMoneyShort(totScorePay)} ({netReward>0?((totScorePay/netReward)*100).toFixed(1):0}%)</span>{payAssists&&<span><span style={{display:"inline-block",width:"10px",height:"10px",background:th.asst,marginRight:"4px",verticalAlign:"middle"}}/> Assists: {fmtMoneyShort(totAssistPay)} ({netReward>0?((totAssistPay/netReward)*100).toFixed(1):0}%)</span>}{payNonWarChainHits&&perChainHit>0&&<span><span style={{display:"inline-block",width:"10px",height:"10px",background:th.chainHit,marginRight:"4px",verticalAlign:"middle"}}/> Chain Hits: {fmtMoneyShort(totChainHitPay)} ({netReward>0?((totChainHitPay/netReward)*100).toFixed(1):0}%)</span>}</div></div>)}
          <div style={secBox}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px", flexWrap:"wrap", gap:"8px"}}>
              <div style={secTitle}>👥 Per-Member Payout Breakdown</div>
              <div>
                <button onClick={exportCSV} style={{background:"transparent", border:`1px solid ${th.gD}`, padding:"4px 12px", color:th.gold, fontSize:"11px", cursor:"pointer"}}>⬇ CSV</button>
                <button onClick={copyForumPost} style={{background:"transparent", border:`1px solid ${th.gD}`, padding:"4px 12px", color:th.gold, fontSize:"11px", cursor:"pointer", marginLeft:"8px"}}>📋 Mail HTML</button>
              </div>
            </div>
            <div style={{overflowX:"auto", border:`1px solid ${th.cb}`}}>
              <table style={{width:"100%", borderCollapse:"collapse", background:th.card}}>
                <thead><tr style={{borderBottom:`2px solid ${th.gold}40`}}>{cols.map(c=>(<th key={c.k} onClick={()=>doSort(c.k)} style={{...hdS, textAlign:c.align||"right", minWidth:c.k==="name"?"130px":"60px"}}>{c.l}{sortCol===c.k?(sortAsc?" ▲":" ▼"):""}</th>))}}</tr></thead>
                <tbody>{sorted.map((m,i)=>(<tr key={m.id} style={{background:i%2===0?th.rA:th.rB}}>{cols.map(c=>{if(c.k==="name")return<td key={c.k} style={{...cellS, textAlign:"left", fontWeight:500}}><a href={`https://www.torn.com/profiles.php?XID=${m.id}`} target="_blank" rel="noopener noreferrer" style={{color:th.link, textDecoration:"none", fontSize:"11.5px"}}>{m.name}</a></td>;const v=m[c.k];let display=c.money?fmtMoney(v):(typeof v==="number"?fmtNum(v):(v||"—"));if(c.k==="warHits"&&v>0&&v===maxHits)display+=" 👑";if(c.k==="score"&&v>0&&v===maxRespect)display+=" ⭐";if(c.k==="totalPay"&&v>0&&v===maxPay)display+=" 💰";return<td key={c.k} style={{...cellS,...monoS, textAlign:"right", color:c.accent?th.gB:c.money?th.bone:th.bD, fontWeight:c.accent?700:400}}><div style={{display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"6px"}}><span>{display}</span>{c.k==="totalPay"&&<div style={{position:"relative", display:"flex", alignItems:"center"}}>{copiedId===m.id&&<span style={{position:"absolute", right:"22px", background:th.gD, color:th.bone, fontSize:"9px", padding:"2px 5px", borderRadius:"3px", fontWeight:700, zIndex:10, boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}}>COPIED</span>}<button onClick={()=>{navigator.clipboard.writeText(Math.round(v).toString());setCopiedId(m.id);setTimeout(()=>setCopiedId(null),1500);}} title="Copy raw amount" style={{background:"transparent", border:"none", cursor:"pointer", padding:"0", color:th.steel, fontSize:"12px", display:"flex", alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color=th.gold} onMouseLeave={e=>e.currentTarget.style.color=th.steel}>📋</button></div>}</div></td>;})}))}</tbody>
                </table>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </>);
  }

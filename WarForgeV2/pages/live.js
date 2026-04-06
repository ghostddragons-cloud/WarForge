import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const DARK = {
  n:"dark",bg:"#08080a",card:"#111113",cb:"#1f1d19",
  rA:"#111113",rB:"#191920",
  gold:"#c9942e",gB:"#e2b650",gD:"#7a6530",
  iron:"#3a3632",steel:"#706a5e",
  bone:"#d4cfc4",bD:"#8a847a",
  vic:"#4a9e3e",vicBg:"#1a2e14",
  def:"#8b1a1a",defBg:"#1c0e0e",
  link:"#7aade0",chain:"#4a9e3e",asst:"#5b8fce",lost:"#c44040",
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
  link:"#1a5a9a",chain:"#1a6a10",asst:"#204a8a",lost:"#a02020",
  wBg:"#f8f0d8",eBg:"#f8dada",eBd:"#c09090",
  iBg:"#dae8f4",iBd:"#90a8c0",
  inBg:"#eae5da",hBg:"#f4f0e8",
  live:"#cc2020",liveGlow:"#cc202040",
};

function Cross({size=16,color}){return<svg width={size} height={size} viewBox="0 0 16 16"><rect x="6" y="1" width="4" height="14" rx=".5" fill={color}/><rect x="1" y="5" width="14" height="4" rx=".5" fill={color}/></svg>;}
function fmtNum(n){return typeof n==="number"&&!isNaN(n)?n.toLocaleString("en-US",{maximumFractionDigits:2}):"0";}
function fmtTime(ts){const d=new Date(ts*1000);return`${d.getUTCHours().toString().padStart(2,"0")}:${d.getUTCMinutes().toString().padStart(2,"0")}:${d.getUTCSeconds().toString().padStart(2,"0")} TCT`;}

function LivePulse({theme:th}){
  return(<span style={{display:"inline-flex",alignItems:"center",gap:"4px"}}>
    <span style={{width:"8px",height:"8px",borderRadius:"50%",background:th.live,boxShadow:`0 0 6px ${th.liveGlow}`,animation:"pulse 1.5s infinite"}}/>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    <span style={{fontSize:"11px",fontWeight:700,color:th.live,textTransform:"uppercase",letterSpacing:"1px"}}>Live</span>
  </span>);
}

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

// Generate 24 hours of fake live data (Iron Wolves vs Shadow Syndicate)
function generateFakeLiveData() {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 86400;
  const factions = {
    us: { id: "99999", name: "Iron Wolves" },
    them: { id: "88888", name: "Shadow Syndicate" }
  };
  const attackers = {
    yours: ["SteelFang","Phantom_X","NovaBlade","CrimsonAce","Wraith99","ToxicRain","GhostPilot","Viper_Kai","Ember_Sky"],
    theirs: ["DarkMatter","SilentStorm","NightCrawler","BlazeRunner","FrostByte","Hex_Zero","RogueAgent","PixelDust"]
  };
  const results = ["Attacked","Mugged","Hospitalized","Attacked","Attacked","Lost","Attacked","Stalemate","Attacked"];
  const respects = [2.45,1.82,2.18,3.10,1.55,2.80,1.92,2.35,2.90,1.65,2.20,1.85,2.60,1.40];
  
  const attacks = [];
  let usScore = 0, themScore = 0;
  for (let i = 0; i < 200; i++) {
    const isOurs = Math.random() > 0.4;
    const attacker = isOurs ? attackers.yours[Math.floor(Math.random() * attackers.yours.length)] : attackers.theirs[Math.floor(Math.random() * attackers.theirs.length)];
    const defender = isOurs ? attackers.theirs[Math.floor(Math.random() * attackers.theirs.length)] : attackers.yours[Math.floor(Math.random() * attackers.yours.length)];
    const result = results[Math.floor(Math.random() * results.length)];
    const respect = isOurs && !["Lost","Stalemate"].includes(result) ? respects[Math.floor(Math.random() * respects.length)] : 0;
    const ts = start + Math.floor((i / 200) * 86400) + Math.random() * 3600;
    attacks.push({
      timestamp_started: ts,
      attacker_name: attacker,
      attacker_faction: isOurs ? factions.us.id : factions.them.id,
      defender_name: defender,
      result: result,
      respect: respect
    });
    if (isOurs) usScore += respect;
    else themScore += respect;
  }
  attacks.sort((a,b) => b.timestamp_started - a.timestamp_started);
  
  return {
    warData: { warId: "SAMPLE", us: factions.us, them: factions.them, start: start, end: now },
    attacks: attacks.slice(0, 100),
    factionScores: { us: Math.round(usScore * 100) / 100, them: Math.round(themScore * 100) / 100 }
  };
}

export default function LiveTracker(){
  const[dk,setDk]=useState(true);
  const[cb,setCB]=useState(false);
  const baseTheme=dk?DARK:LIGHT;
  const th=cb?{...baseTheme,lost:dk?"#4a7abf":"#2050a0",def:dk?"#1a3a8b":"#183090",defBg:dk?"#0e0e1c":"#dadaf8",eBg:dk?"#0e0e1c":"#dadaf8",eBd:dk?"#1a3a8b":"#9090c0",live:dk?"#3070ff":"#2060cc",liveGlow:dk?"#3070ff60":"#2060cc40"}:baseTheme;

  const[mainKey,setMK]=useState("");
  const[extraKeyList,setEKL]=useState([]);
  const[factionId,setFI]=useState("");
  const[status,setStatus]=useState("IDLE");
  const[warData,setWarData]=useState(null);
  const[attacks,setAttacks]=useState([]);
  const[factionScores,setFS]=useState({us:0,them:0});
  const[lastUpdate,setLU]=useState(null);
  const[error,setError]=useState(null);
  const[pollCount,setPollCount]=useState(0);
  const intervalRef=useRef(null);
  const keyIndexRef=useRef(0);
  const lastAttackTs=useRef(0);
  const allAttacks=useRef({});
  const lastSaveTs=useRef(0);
  const[isSampleMode, setIsSampleMode]=useState(false);
  const[sampleData, setSampleData]=useState(null);

  // Save state helper
  const saveState=useCallback((force)=>{
    const now=Date.now();
    if(!force&&now-lastSaveTs.current<10000)return;
    lastSaveTs.current=now;
    try{
      localStorage.setItem("wf_live_state",JSON.stringify({
        status:status==="IDLE"?null:status,
        warData,attacks,factionScores,
        lastAttackTs:lastAttackTs.current,
        allAttacks:allAttacks.current
      }));
    }catch(e){}
  },[status,warData,attacks,factionScores]);

  // Check sample mode on mount and listen for changes
  useEffect(() => {
    const checkSampleMode = () => {
      const sampleFlag = localStorage.getItem("wf_sample_mode") === "true";
      setIsSampleMode(sampleFlag);
      if (sampleFlag) {
        if (!sampleData) {
          const fake = generateFakeLiveData();
          setSampleData(fake);
          setWarData(fake.warData);
          setAttacks(fake.attacks);
          setFS(fake.factionScores);
          setStatus("LIVE");
          setError(null);
        }
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setSampleData(null);
        setWarData(null);
        setAttacks([]);
        setFS({ us: 0, them: 0 });
        setStatus("IDLE");
        setError(null);
        allAttacks.current = {};
        lastAttackTs.current = 0;
      }
    };
    checkSampleMode();
    const handleStorage = (e) => {
      if (e.key === "wf_sample_mode") checkSampleMode();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [sampleData]);

  useEffect(()=>{
    try{
      const fid=localStorage.getItem("wf_fid");if(fid)setFI(fid);
      const sk=localStorage.getItem("wf_savekey");
      if(sk==="true"){const k=localStorage.getItem("wf_apikey");if(k)setMK(k);}
    }catch(e){}
    try{setCB(localStorage.getItem("wf_colorblind")==="true");}catch(e){}
  },[]);

  const getKeys=useCallback(()=>{
    const keys=[mainKey.trim()];
    extraKeyList.forEach(k=>{const t=k.trim();if(t&&t.length>=16)keys.push(t);});
    return keys.filter(k=>k);
  },[mainKey,extraKeyList]);

  const getNextKey=useCallback(()=>{
    const keys=getKeys();
    if(!keys.length)return null;
    const key=keys[keyIndexRef.current%keys.length];
    keyIndexRef.current++;
    return key;
  },[getKeys]);

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
            if(us&&them){
              return{warId:wid,war:w,us,them,status:w.war?.status||"active"};
            }
          }
        }
      }
      return null;
    }catch(e){setError(e.message);return null;}
  },[getNextKey,factionId]);

  const fetchNewAttacks=useCallback(async()=>{
    const key=getNextKey();
    if(!key)return;
    const from=lastAttackTs.current||Math.floor(Date.now()/1000)-3600;
    try{
      const res=await fetch(`/api/torn?type=live_attacks&from=${from}&key=${encodeURIComponent(key)}`);
      const data=await res.json();
      if(data.error)return;
      if(data.attacks){
        let newCount=0;
        for(const aid in data.attacks){
          if(!allAttacks.current[aid]){
            allAttacks.current[aid]=data.attacks[aid];
            newCount++;
          }
          if(data.attacks[aid].timestamp_started>lastAttackTs.current){
            lastAttackTs.current=data.attacks[aid].timestamp_started;
          }
        }
        if(newCount>0){
          const sorted=Object.values(allAttacks.current).sort((a,b)=>b.timestamp_started-a.timestamp_started);
          setAttacks(sorted.slice(0,100));
          let us=0,them=0;
          Object.values(allAttacks.current).forEach(a=>{
            if(String(a.attacker_faction)===String(factionId))us+=a.respect||0;
            else them+=a.respect||0;
          });
          setFS({us:Math.round(us*100)/100,them:Math.round(them*100)/100});
        }
      }
      setLU(Date.now());
      setPollCount(c=>c+1);
    }catch(e){}
  },[getNextKey,factionId]);

  const setupPolling=useCallback(()=>{
    const keys=getKeys();
    const attackInterval=Math.max(3000,Math.floor(30000/keys.length));
    let warCheckCounter=0;
    intervalRef.current=setInterval(async()=>{
      warCheckCounter++;
      if(!warData||warCheckCounter%(Math.floor(30000/attackInterval))===0){
        const found=await checkForWar();
        if(found){
          setWarData(found);
          if(!lastAttackTs.current&&found.war?.start){
            lastAttackTs.current=found.war.start;
          }
          setStatus("LIVE");
        }else{
          setStatus(s=>s==="LIVE"?"FINISHED":"WAITING");
        }
      }
      if(warData||status==="LIVE"){
        await fetchNewAttacks();
      }
    },attackInterval);
  },[getKeys,checkForWar,fetchNewAttacks,warData,status]);

  const startTracking=useCallback(()=>{
    if(!mainKey.trim()){setError("Enter your API key");return;}
    if(!factionId.trim()){setError("Set Faction ID on the main page first");return;}
    setError(null);
    setStatus("WAITING");
    allAttacks.current={};
    lastAttackTs.current=0;
    setAttacks([]);
    setFS({us:0,them:0});
    setPollCount(0);
    setupPolling();
  },[mainKey,factionId,setupPolling]);

  const stopTracking=()=>{
    if(intervalRef.current)clearInterval(intervalRef.current);
    intervalRef.current=null;
    setStatus("IDLE");
    try{localStorage.removeItem("wf_live_state");}catch(e){}
  };

  const toggleSampleMode = () => {
    const newSampleMode = !isSampleMode;
    localStorage.setItem("wf_sample_mode", newSampleMode ? "true" : "false");
    window.dispatchEvent(new StorageEvent("storage", { key: "wf_sample_mode", newValue: newSampleMode ? "true" : "false" }));
  };

  useEffect(()=>{return()=>{if(intervalRef.current)clearInterval(intervalRef.current);};},[]);

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
          <a href="/" style={{...bS,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"4px",color:th.gold,border:`1px solid ${th.gD}`,fontWeight:600}}>⚔ Reports</a>
          <a href="/recon" style={{...bS,textDecoration:"none",color:"#4169E1",border:"1px solid #4169E1"}}>🔍 Recon</a>
          <button onClick={()=>{const nv=!cb;setCB(nv);try{localStorage.setItem("wf_colorblind",String(nv));}catch(e){}}} style={{...bS,color:cb?"#e03030":"#4a7abf",border:`1px solid ${cb?"#e03030":"#4a7abf"}`}}>{cb?"👁 CB":"👁"}</button>
          <button onClick={()=>setDk(!dk)} style={{...bS,color:th.bone}}>{dk?"☀":"☽"}</button>
          <button onClick={toggleSampleMode} style={{...bS, background:isSampleMode?th.wBg:th.card, border:`1px solid ${isSampleMode?th.gD:th.iron}`, color:isSampleMode?th.gold:th.steel}}>Sample</button>
        </div>
      </header>

      <div style={{maxWidth:"900px",margin:"0 auto",padding:"16px 20px"}}>
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
          <div style={{marginTop:"8px",fontSize:"10px",color:th.steel,lineHeight:1.5}}>{getKeys().length} key{getKeys().length!==1?"s":""} loaded · Poll speed: ~{Math.max(3,Math.floor(30/getKeys().length))}s per update · Faction ID: {factionId||<span style={{color:th.lost}}>Not set — go to main page settings</span>}<br/>Each key must be from the same faction with Faction API access enabled.</div>
        </div>

        <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"14px",textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",flexWrap:"wrap"}}>
            {status==="IDLE"?(
              <button onClick={startTracking} style={{padding:"12px 32px",background:`linear-gradient(180deg,${th.live},#a01010)`,border:"none",color:"#fff",fontWeight:700,fontSize:"15px",cursor:"pointer",textTransform:"uppercase",letterSpacing:"1px",fontFamily:"Arial,sans-serif"}}>🔴 Start Tracking</button>
            ):(
              <button onClick={stopTracking} style={{padding:"12px 32px",background:th.iron,border:"none",color:th.bone,fontWeight:700,fontSize:"15px",cursor:"pointer",textTransform:"uppercase",letterSpacing:"1px",fontFamily:"Arial,sans-serif"}}>⏹ Stop Tracking</button>
            )}
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:"2px"}}><span style={{fontSize:"12px",fontWeight:600,color:statusLabel.color}}>{statusLabel.text}</span>{lastUpdate&&<span style={{fontSize:"10px",color:th.steel}}>Last update: {new Date(lastUpdate).toLocaleTimeString()} · Polls: {pollCount}</span>}</div>
          </div>
          {error&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.eBg,border:`1px solid ${th.eBd}`,color:th.lost,fontSize:"11px"}}>{error}</div>}
        </div>

        {status==="WAITING"&&(
          <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"30px",textAlign:"center",marginBottom:"14px"}}><div style={{fontSize:"24px",marginBottom:"8px"}}>⏳</div><div style={{fontSize:"14px",fontWeight:600,color:th.gold}}>Searching for active ranked war...</div><div style={{fontSize:"11px",color:th.steel,marginTop:"4px"}}>Checking your faction's ranked war status. If no war has started yet, the tracker will keep checking and begin automatically when the war begins.</div></div>
        )}

        {isSampleMode&&<div style={{padding:"6px 10px",background:"#1a1608",border:"1px solid #7a6530",marginBottom:"12px",fontSize:"11px",color:"#c9942e",textAlign:"center"}}>📋 Sample data (24h war) — showing Iron Wolves vs Shadow Syndicate. Enter your API key and click Start Tracking for a real war.</div>}

        {((status==="LIVE"||status==="FINISHED"||isSampleMode)&&warData)&&(
          <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"18px",marginBottom:"14px"}}>
            <div style={{textAlign:"center",marginBottom:"6px"}}>{status==="LIVE"&&<LivePulse theme={th}/>}{status==="FINISHED"&&<span style={{fontSize:"11px",color:th.vic,fontWeight:700}}>✓ WAR FINISHED</span>}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"20px",flexWrap:"wrap",marginBottom:"10px"}}>
              <div style={{textAlign:"right",flex:1}}><div style={{fontSize:"14px",fontWeight:700,color:th.bone}}>{warData.us?.name||"Your Faction"}</div><div style={{fontSize:"32px",fontWeight:800,color:th.vic,fontFamily:"Consolas,monospace"}}>{fmtNum(factionScores.us)}</div></div>
              <div style={{fontSize:"12px",color:th.steel,fontWeight:700,letterSpacing:"2px"}}>VS</div>
              <div style={{textAlign:"left",flex:1}}><div style={{fontSize:"14px",fontWeight:700,color:th.bone}}>{warData.them?.name||"Opponent"}</div><div style={{fontSize:"32px",fontWeight:800,color:th.lost,fontFamily:"Consolas,monospace"}}>{fmtNum(factionScores.them)}</div></div>
            </div>
            <div style={{height:"7px",background:th.iron,overflow:"hidden",display:"flex",border:`1px solid ${th.cb}`}}>
              {(()=>{const t=factionScores.us+factionScores.them||1;const p=(factionScores.us/t)*100;return<><div style={{width:`${p}%`,background:`linear-gradient(90deg,${th.vic},#2d6b24)`,transition:"width 0.3s"}}/><div style={{flex:1,background:`linear-gradient(90deg,${th.def},#5a1010)`}}/></>;})()}
            </div>
            <div style={{textAlign:"center",marginTop:"6px",fontSize:"10px",color:th.steel}}>{Object.keys(allAttacks.current).length} attacks tracked · War #{warData.warId}</div>
          </div>
        )}

        {attacks.length>0&&(
          <div style={{background:th.card,border:`1px solid ${th.cb}`,marginBottom:"14px"}}>
            <div style={{padding:"10px 12px",borderBottom:`1px solid ${th.cb}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"11px",fontWeight:700,color:th.gold,textTransform:"uppercase",letterSpacing:"1px"}}>Attack Feed</span><span style={{fontSize:"10px",color:th.steel}}>{attacks.length} recent</span></div>
            <div style={{maxHeight:"400px",overflowY:"auto"}}>{attacks.map((a,i)=><AttackItem key={`${a.timestamp_started}_${i}`} atk={a} factionId={factionId} theme={th}/>)}</div>
          </div>
        )}

        {status==="IDLE"&&attacks.length===0&&(
          <div style={{textAlign:"center",padding:"50px 20px",color:th.steel}}><Cross size={36} color={th.iron}/><div style={{fontSize:"14px",fontWeight:700,color:th.bD,marginTop:"10px",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px"}}>Live Tracker</div><div style={{fontSize:"11px",maxWidth:"420px",margin:"0 auto",lineHeight:1.6}}>Enter your API key and click 🔴 Start Tracking. The tracker will search for an active ranked war and begin polling automatically. Add faction members' API keys for faster updates. Start this up to 30 minutes before a war — it will wait and begin tracking when the war starts.</div></div>
        )}
      </div>

      <footer style={{borderTop:`1px solid ${th.cb}`,padding:"12px 20px",marginTop:"30px",textAlign:"center",background:th.hBg}}><div style={{fontSize:"10px",color:th.steel}}><span style={{color:th.gD,fontWeight:700,letterSpacing:"1px"}}>WARFORGE</span><span style={{margin:"0 6px",color:th.iron}}>│</span>Live Tracker v1.0 · API keys never stored on server</div></footer>
    </div>
  </>);
}

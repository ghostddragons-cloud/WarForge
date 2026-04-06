import { useState, useEffect } from 'react';
import Head from 'next/head';

/*
 * WARFORGE RECON — Pre-War Intelligence
 * 
 * Loads both factions from a ranked war match and fetches
 * public personalstats for every member. Shows xanax taken,
 * refills, attacks won, defends, networth, ODs, and more.
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

// Stats we want to display and their labels
const RECON_STATS = [
  { key:"xantaken",         label:"Xanax",       tip:"Xanax taken (lifetime)" },
  { key:"refills",          label:"Refills",      tip:"Energy refills" },
  { key:"statenhancersused",label:"SE Used",      tip:"Stat enhancers used" },
  { key:"attackswon",       label:"Atk Won",      tip:"Attacks won" },
  { key:"attackslost",      label:"Atk Lost",     tip:"Attacks lost" },
  { key:"defendswon",       label:"Def Won",      tip:"Defends won" },
  { key:"defendslost",      label:"Def Lost",     tip:"Defends lost" },
  { key:"networth",         label:"Networth",     tip:"Total networth", fmt:"money" },
  { key:"overdosed",        label:"ODs",          tip:"Times overdosed" },
  { key:"traveltime",       label:"Travel",       tip:"Time spent traveling" },
  { key:"bestchain",        label:"Best Chain",   tip:"Best chain achieved" },
  { key:"respectforfaction",label:"Respect",      tip:"Respect earned for faction" },
  { key:"revives",          label:"Revives",      tip:"Revives given" },
  { key:"drugsused",        label:"Drugs Used",   tip:"Total drugs used" },
];

// ============================================================
//  RECON TABLE
// ============================================================
function ReconTable({members,title,accent,theme:th,sortCol,sortAsc,onSort}){
  const sorted=[...members].sort((a,b)=>{
    const av=a.stats?.[sortCol]??0,bv=b.stats?.[sortCol]??0;
    if(sortCol==="name")return sortAsc?String(a.name).localeCompare(b.name):String(b.name).localeCompare(a.name);
    return sortAsc?av-bv:bv-av;
  });

  const c={padding:"5px 4px",fontSize:"11px",borderBottom:`1px solid ${th.cb}`,whiteSpace:"nowrap",fontFamily:"Arial,sans-serif"};
  const mn={fontFamily:"Consolas,monospace",fontSize:"11px"};
  const hd={...c,color:th.gold,fontWeight:700,cursor:"pointer",userSelect:"none",position:"sticky",top:0,background:th.card,zIndex:1,fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.3px",padding:"7px 4px"};

  // Compute faction totals
  const totals={};
  RECON_STATS.forEach(s=>{totals[s.key]=members.reduce((sum,m)=>sum+(m.stats?.[s.key]||0),0);});

  return(
    <div style={{flex:1,minWidth:"380px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
        <div style={{height:"2px",width:"20px",background:accent}}/>
        <h3 style={{margin:0,fontSize:"13px",fontWeight:700,color:th.bone}}>{title}</h3>
        <span style={{fontSize:"10px",color:th.steel,marginLeft:"auto"}}>{members.length} members</span>
      </div>
      <div style={{overflowX:"auto",border:`1px solid ${th.cb}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:th.card}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${accent}40`}}>
              <th onClick={()=>onSort("name")} style={{...hd,textAlign:"left",minWidth:"100px"}}>Member{sortCol==="name"?(sortAsc?" ▲":" ▼"):""}</th>
              <th style={{...hd,textAlign:"right",minWidth:"30px"}}>Lvl</th>
              {RECON_STATS.map(s=>(
                <th key={s.key} onClick={()=>onSort(s.key)} title={s.tip}
                  style={{...hd,textAlign:"right",minWidth:"50px"}}>
                  {s.label}{sortCol===s.key?(sortAsc?" ▲":" ▼"):""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m,i)=>(
              <tr key={m.id} style={{background:i%2===0?th.rA:th.rB}}>
                <td style={{...c,textAlign:"left",fontWeight:500}}>
                  <a href={`https://www.torn.com/profiles.php?XID=${m.id}`} target="_blank" rel="noopener noreferrer" style={{color:th.link,textDecoration:"none",fontSize:"11px"}}>{m.name}</a>
                  {!m.stats&&<span style={{fontSize:"9px",color:th.steel,marginLeft:"4px"}}>loading...</span>}
                </td>
                <td style={{...c,...mn,textAlign:"right",color:th.bD}}>{m.level||"—"}</td>
                {RECON_STATS.map(s=>{
                  const v=m.stats?.[s.key];
                  const display=v===undefined?"—":s.fmt==="money"?fmtMoney(v):fmtNum(v);
                  return<td key={s.key} style={{...c,...mn,textAlign:"right",color:v?th.bone:th.iron}}>{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{borderTop:`2px solid ${th.iron}`,background:th.n==="dark"?"#0c0c0e":"#e8e2d6"}}>
              <td style={{...c,textAlign:"left",color:th.gold,fontWeight:700,fontSize:"11px",textTransform:"uppercase",padding:"7px 4px"}} colSpan={2}>Totals</td>
              {RECON_STATS.map(s=>(
                <td key={s.key} style={{...c,...mn,textAlign:"right",fontWeight:700,fontSize:"11px",padding:"7px 4px",color:th.gB}}>
                  {s.fmt==="money"?fmtMoney(totals[s.key]):fmtNum(totals[s.key])}
                </td>
              ))}
            </tr>
            <tr style={{background:th.n==="dark"?"#0c0c0e":"#e8e2d6"}}>
              <td style={{...c,textAlign:"left",color:th.steel,fontSize:"10px",padding:"5px 4px"}} colSpan={2}>Average</td>
              {RECON_STATS.map(s=>{
                const avg=members.length?totals[s.key]/members.length:0;
                return<td key={s.key} style={{...c,...mn,textAlign:"right",fontSize:"10px",padding:"5px 4px",color:th.bD}}>
                  {s.fmt==="money"?fmtMoney(Math.round(avg)):fmtNum(Math.round(avg))}
                </td>;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================
//  FACTION SUMMARY COMPARISON BAR
// ============================================================
function CompareBar({label,yourVal,theirVal,theme:th}){
  const total=yourVal+theirVal||1;
  const pct=(yourVal/total)*100;
  return(
    <div style={{marginBottom:"8px"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:th.steel,marginBottom:"2px"}}>
        <span>{fmtNum(yourVal)}</span>
        <span style={{color:th.bD,fontWeight:600}}>{label}</span>
        <span>{fmtNum(theirVal)}</span>
      </div>
      <div style={{height:"5px",background:th.iron,overflow:"hidden",display:"flex",border:`1px solid ${th.cb}`}}>
        <div style={{width:`${pct}%`,background:th.vic,transition:"width 0.4s"}}/>
        <div style={{flex:1,background:th.lost}}/>
      </div>
    </div>
  );
}

// ============================================================
//  MAIN RECON PAGE
// ============================================================
export default function Recon(){
  const[dk,setDk]=useState(true);const th=dk?DARK:LIGHT;
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
  const[sortCol,setSC]=useState("xantaken");
  const[sortAsc,setSA]=useState(false);

  useEffect(()=>{
    try{const s=localStorage.getItem("wf_fid");if(s)setFI(s);}catch(e){}
    try{const sk=localStorage.getItem("wf_savekey");if(sk==="true"){const k=localStorage.getItem("wf_apikey");if(k)setAK(k);}}catch(e){}
  },[]);

  const doSort=(col)=>{if(sortCol===col)setSA(!sortAsc);else{setSC(col);setSA(false);}};

  // Fetch personalstats for a single user
  const fetchStats=async(userId,key)=>{
    try{
      const r=await fetch(`/api/torn?type=personalstats&id=${userId}&key=${encodeURIComponent(key)}`);
      const d=await r.json();
      if(d.error)return null;
      return d.personalstats||null;
    }catch(e){return null;}
  };

  // Fetch user profile (for level)
  const fetchProfile=async(userId,key)=>{
    try{
      const r=await fetch(`/api/torn?type=user_profile&id=${userId}&key=${encodeURIComponent(key)}`);
      const d=await r.json();
      if(d.error)return null;
      return{level:d.level};
    }catch(e){return null;}
  };

  // Load recon data from a war ID
  const loadRecon=async()=>{
    if(!apiKey.trim()){setE("Set your API key in ⚙ Settings on the main page");return;}
    if(!warId.trim()){setE("Enter a War ID");return;}
    if(!factionId.trim()){setE("Set Faction ID on the main page first");return;}

    setL(true);setE(null);setLM("Fetching war match data...");
    setProg({done:0,total:0});setYM([]);setTM([]);

    try{
      // Step 1: Get war report to find both factions and their members
      const raw=await(await fetch(`/api/torn?type=war&id=${encodeURIComponent(warId)}&key=${encodeURIComponent(apiKey)}`)).json();
      if(raw.error)throw new Error(`API Error ${raw.error.code}: ${raw.error.error}`);
      if(!raw.rankedwarreport)throw new Error("No war report found for this ID.");

      const report=raw.rankedwarreport;
      let yourFac=null,theirFac=null;
      for(const fid in report.factions){
        if(String(fid)===String(factionId))yourFac={...report.factions[fid],id:fid};
        else theirFac={...report.factions[fid],id:fid};
      }
      if(!yourFac)throw new Error("Your Faction ID not found in this war.");

      setYN(yourFac.name);
      setTN(theirFac.name);

      // Build member lists
      const yourList=Object.entries(yourFac.members).map(([id,m])=>({id,name:m.name,level:null,stats:null}));
      const theirList=Object.entries(theirFac.members).map(([id,m])=>({id,name:m.name,level:null,stats:null}));

      setYM(yourList);
      setTM(theirList);

      // Step 2: Fetch personalstats for each member
      const allMembers=[...yourList.map(m=>({...m,side:"yours"})),...theirList.map(m=>({...m,side:"theirs"}))];
      const total=allMembers.length;
      setProg({done:0,total});
      setLM(`Loading stats: 0 / ${total} members...`);

      // Process in batches to respect rate limits (max ~2 per second to be safe)
      for(let i=0;i<allMembers.length;i++){
        const m=allMembers[i];
        const[stats,profile]=await Promise.all([
          fetchStats(m.id,apiKey),
          fetchProfile(m.id,apiKey)
        ]);

        // Update the correct list
        if(m.side==="yours"){
          setYM(prev=>prev.map(p=>p.id===m.id?{...p,stats,level:profile?.level}:p));
        }else{
          setTM(prev=>prev.map(p=>p.id===m.id?{...p,stats,level:profile?.level}:p));
        }

        setProg({done:i+1,total});
        setLM(`Loading stats: ${i+1} / ${total} members...`);

        // Rate limit: wait between calls (2 calls per member, ~500ms gap)
        if(i<allMembers.length-1)await new Promise(r=>setTimeout(r,500));
      }

      setLM("");
    }catch(e){setE(e.message);}
    finally{setL(false);}
  };

  const iS={width:"100%",background:th.inBg,border:`1px solid ${th.iron}`,padding:"8px 12px",color:th.bone,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"Arial,sans-serif"};
  const lS={fontSize:"11px",color:th.steel,display:"block",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700};
  const bP={padding:"9px 24px",background:dk?`linear-gradient(180deg,${th.gold},#a07820)`:`linear-gradient(180deg,#b08020,#8a6010)`,border:"none",color:dk?"#0a0a0a":"#fff",fontWeight:700,fontSize:"14px",cursor:"pointer",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.3px",fontFamily:"Arial,sans-serif"};
  const bS={background:th.card,border:`1px solid ${th.iron}`,padding:"6px 12px",color:th.bD,fontSize:"12px",cursor:"pointer",fontFamily:"Arial,sans-serif"};

  // Compute comparison stats
  const yourTotals={},theirTotals={};
  RECON_STATS.forEach(s=>{
    yourTotals[s.key]=yourMembers.reduce((sum,m)=>sum+(m.stats?.[s.key]||0),0);
    theirTotals[s.key]=theirMembers.reduce((sum,m)=>sum+(m.stats?.[s.key]||0),0);
  });
  const hasData=yourMembers.some(m=>m.stats)||theirMembers.some(m=>m.stats);

  return(<>
    <Head><title>WarForge — Recon</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div style={{minHeight:"100vh",background:th.bg,color:th.bone,fontFamily:"Arial,sans-serif"}}>

      {/* HEADER */}
      <header style={{borderBottom:`1px solid ${th.cb}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",background:th.hBg}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <Cross size={22} color={th.gold}/>
          <div>
            <div style={{fontWeight:800,fontSize:"20px",letterSpacing:"2px",color:th.gold,textTransform:"uppercase"}}>WarForge</div>
            <div style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.2px"}}>Pre-War Recon</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
          <a href="/" style={{...bS,textDecoration:"none"}}>← Reports</a>
          <a href="/live" style={{...bS,textDecoration:"none",color:th.lost}}>🔴 Live</a>
          <button onClick={()=>setDk(!dk)} style={{...bS,fontSize:"15px",padding:"3px 8px",lineHeight:1}}>{dk?"☀":"☽"}</button>
        </div>
      </header>

      <div style={{maxWidth:"1400px",margin:"0 auto",padding:"16px 20px"}}>

        {/* INPUT */}
        <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"14px",marginBottom:"16px"}}>
          <div style={{display:"flex",gap:"10px",alignItems:"end",justifyContent:"center",flexWrap:"wrap"}}>
            <div style={{minWidth:"120px",maxWidth:"240px"}}>
              <label style={lS}>War ID</label>
              <input value={warId} onChange={e=>setWI(e.target.value)} placeholder="e.g. 42069" onKeyDown={e=>e.key==="Enter"&&loadRecon()} style={iS}/>
            </div>
            <button onClick={loadRecon} disabled={loading} style={{...bP,opacity:loading?0.5:1,cursor:loading?"wait":"pointer"}}>
              {loading?"Loading...":"🔍 Scout Factions"}
            </button>
          </div>
          {error&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.eBg,border:`1px solid ${th.eBd}`,color:th.lost,fontSize:"11px",textAlign:"center"}}>{error}</div>}

          {/* Progress bar */}
          {loading&&progress.total>0&&(
            <div style={{marginTop:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:th.steel,marginBottom:"3px"}}>
                <span>{loadMsg}</span>
                <span>{Math.round((progress.done/progress.total)*100)}%</span>
              </div>
              <div style={{height:"4px",background:th.iron,overflow:"hidden",border:`1px solid ${th.cb}`}}>
                <div style={{width:`${(progress.done/progress.total)*100}%`,height:"100%",background:th.gold,transition:"width 0.3s"}}/>
              </div>
            </div>
          )}
          {loading&&!progress.total&&loadMsg&&<div style={{marginTop:"8px",padding:"6px 10px",background:th.iBg,border:`1px solid ${th.iBd}`,color:th.link,fontSize:"11px",textAlign:"center"}}>{loadMsg}</div>}
        </div>

        {/* FACTION COMPARISON SUMMARY */}
        {hasData&&(
          <div style={{background:th.card,border:`1px solid ${th.cb}`,padding:"16px",marginBottom:"16px"}}>
            <div style={{textAlign:"center",marginBottom:"10px"}}>
              <span style={{fontSize:"10px",color:th.steel,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:700}}>Faction Comparison — War #{warId}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",fontWeight:700,marginBottom:"8px"}}>
              <span style={{color:th.vic}}>{yourName} ({yourMembers.length})</span>
              <span style={{color:th.lost}}>{theirName} ({theirMembers.length})</span>
            </div>
            <CompareBar label="Total Xanax" yourVal={yourTotals.xantaken} theirVal={theirTotals.xantaken} theme={th}/>
            <CompareBar label="Total Refills" yourVal={yourTotals.refills} theirVal={theirTotals.refills} theme={th}/>
            <CompareBar label="Stat Enhancers" yourVal={yourTotals.statenhancersused} theirVal={theirTotals.statenhancersused} theme={th}/>
            <CompareBar label="Attacks Won" yourVal={yourTotals.attackswon} theirVal={theirTotals.attackswon} theme={th}/>
            <CompareBar label="Defends Won" yourVal={yourTotals.defendswon} theirVal={theirTotals.defendswon} theme={th}/>
            <CompareBar label="Total Networth" yourVal={yourTotals.networth} theirVal={theirTotals.networth} theme={th}/>
            <CompareBar label="Drugs Used" yourVal={yourTotals.drugsused} theirVal={theirTotals.drugsused} theme={th}/>
            <CompareBar label="Overdoses" yourVal={yourTotals.overdosed} theirVal={theirTotals.overdosed} theme={th}/>
          </div>
        )}

        {/* MEMBER TABLES */}
        {(yourMembers.length>0||theirMembers.length>0)&&(
          <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
            {yourMembers.length>0&&<ReconTable members={yourMembers} title={yourName} accent={th.vic} theme={th} sortCol={sortCol} sortAsc={sortAsc} onSort={doSort}/>}
            {theirMembers.length>0&&<ReconTable members={theirMembers} title={theirName} accent={th.lost} theme={th} sortCol={sortCol} sortAsc={sortAsc} onSort={doSort}/>}
          </div>
        )}

        {/* EMPTY STATE */}
        {!yourMembers.length&&!loading&&(
          <div style={{textAlign:"center",padding:"50px 20px",color:th.steel}}>
            <Cross size={36} color={th.iron}/>
            <div style={{fontSize:"14px",fontWeight:700,color:th.bD,marginTop:"10px",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px"}}>Pre-War Intelligence</div>
            <div style={{fontSize:"11px",maxWidth:"450px",margin:"0 auto",lineHeight:1.6}}>
              Enter a War ID to scout both factions. WarForge will pull public personal stats for every member — xanax usage, attack history, refills, networth, and more. Takes about 30 seconds for a full roster.
            </div>
          </div>
        )}
      </div>

      <footer style={{borderTop:`1px solid ${th.cb}`,padding:"12px 20px",marginTop:"30px",textAlign:"center",background:th.hBg}}>
        <div style={{fontSize:"10px",color:th.steel}}>
          <span style={{color:th.gD,fontWeight:700,letterSpacing:"1px"}}>WARFORGE</span>
          <span style={{margin:"0 6px",color:th.iron}}>│</span>Recon · All data is publicly visible on Torn profiles
        </div>
      </footer>
    </div>
  </>);
}

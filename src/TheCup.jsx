import React, { useState, useMemo, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  TheCup — 2026 FIFA World Cup companion
//  Groups · Bracket · Scores · Predictions
//  Data current to Jun 27, 2026 (group stage concluding)
// ─────────────────────────────────────────────────────────────
//
//  ░░ DEPLOYING TO VERCEL ░░
//  Predictions persist via an in-memory store so this runs inside
//  sandboxed previews. For your real Vercel build, set
//  USE_LOCAL_STORAGE = true — picks then survive reloads in the
//  user's browser. To move to a shared DB later, swap the two
//  functions in `store` for API calls; nothing else changes.
//
const USE_LOCAL_STORAGE = true; // ← set true on Vercel
const STORE_KEY = "thecup.predictions.v1";

let _mem = {};
const store = {
  load() {
    if (USE_LOCAL_STORAGE && typeof window !== "undefined") {
      try { return JSON.parse(window.localStorage.getItem(STORE_KEY)) || {}; }
      catch { return {}; }
    }
    return _mem;
  },
  save(data) {
    if (USE_LOCAL_STORAGE && typeof window !== "undefined") {
      try { window.localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
    } else { _mem = data; }
  },
};

// ── reference data ───────────────────────────────────────────
const FLAG = {
  MEX:"🇲🇽",RSA:"🇿🇦",KOR:"🇰🇷",CZE:"🇨🇿",SUI:"🇨🇭",CAN:"🇨🇦",BIH:"🇧🇦",QAT:"🇶🇦",
  BRA:"🇧🇷",MAR:"🇲🇦",SCO:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",HTI:"🇭🇹",USA:"🇺🇸",AUS:"🇦🇺",PAR:"🇵🇾",TUR:"🇹🇷",
  GER:"🇩🇪",CIV:"🇨🇮",ECU:"🇪🇨",CUW:"🇨🇼",NED:"🇳🇱",JPN:"🇯🇵",SWE:"🇸🇪",TUN:"🇹🇳",
  BEL:"🇧🇪",EGY:"🇪🇬",IRN:"🇮🇷",NZL:"🇳🇿",ESP:"🇪🇸",CPV:"🇨🇻",URU:"🇺🇾",KSA:"🇸🇦",
  FRA:"🇫🇷",NOR:"🇳🇴",SEN:"🇸🇳",IRQ:"🇮🇶",ARG:"🇦🇷",AUT:"🇦🇹",DZA:"🇩🇿",JOR:"🇯🇴",
  COL:"🇨🇴",POR:"🇵🇹",COD:"🇨🇩",UZB:"🇺🇿",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",CRO:"🇭🇷",GHA:"🇬🇭",PAN:"🇵🇦",
};
const NAME = {
  MEX:"Mexico",RSA:"South Africa",KOR:"South Korea",CZE:"Czechia",SUI:"Switzerland",
  CAN:"Canada",BIH:"Bosnia & Herz.",QAT:"Qatar",BRA:"Brazil",MAR:"Morocco",SCO:"Scotland",
  HTI:"Haiti",USA:"United States",AUS:"Australia",PAR:"Paraguay",TUR:"Türkiye",GER:"Germany",
  CIV:"Côte d'Ivoire",ECU:"Ecuador",CUW:"Curaçao",NED:"Netherlands",JPN:"Japan",SWE:"Sweden",
  TUN:"Tunisia",BEL:"Belgium",EGY:"Egypt",IRN:"Iran",NZL:"New Zealand",ESP:"Spain",
  CPV:"Cape Verde",URU:"Uruguay",KSA:"Saudi Arabia",FRA:"France",NOR:"Norway",SEN:"Senegal",
  IRQ:"Iraq",ARG:"Argentina",AUT:"Austria",DZA:"Algeria",JOR:"Jordan",COL:"Colombia",
  POR:"Portugal",COD:"DR Congo",UZB:"Uzbekistan",ENG:"England",CRO:"Croatia",GHA:"Ghana",PAN:"Panama",
};
const HOST = { MEX:"mex", CAN:"can", USA:"usa" };

const GROUPS = {
  A:[["MEX",3,0,0,9],["RSA",1,1,1,4],["KOR",1,0,2,3],["CZE",0,1,2,1]],
  B:[["SUI",2,1,0,7],["CAN",1,1,1,4],["BIH",1,1,1,4],["QAT",0,1,2,1]],
  C:[["BRA",2,1,0,7],["MAR",2,1,0,7],["SCO",1,0,2,3],["HTI",0,0,3,0]],
  D:[["USA",2,0,1,6],["AUS",1,1,1,4],["PAR",1,1,1,4],["TUR",1,0,2,3]],
  E:[["GER",2,0,1,6],["CIV",2,0,1,6],["ECU",1,1,1,4],["CUW",0,1,2,1]],
  F:[["NED",2,1,0,7],["JPN",1,2,0,5],["SWE",1,1,1,4],["TUN",0,0,3,0]],
  G:[["BEL",1,2,0,5],["EGY",1,2,0,5],["IRN",0,3,0,3],["NZL",0,1,2,1]],
  H:[["ESP",2,1,0,7],["CPV",0,3,0,3],["URU",0,2,1,2],["KSA",0,2,1,2]],
  I:[["FRA",3,0,0,9],["NOR",2,0,1,6],["SEN",1,0,2,3],["IRQ",0,0,3,0]],
  J:[["ARG",2,0,0,6],["AUT",1,0,1,3],["DZA",1,0,1,3],["JOR",0,0,2,0]],
  K:[["COL",2,1,0,7],["POR",1,2,0,5],["COD",1,1,1,4],["UZB",0,0,3,0]],
  L:[["ENG",2,1,0,7],["CRO",2,0,1,6],["GHA",1,1,1,4],["PAN",0,0,3,0]],
};

const RESULTS = [
  ["COD",3,"UZB",1,"Group K"],["COL",0,"POR",0,"Group K"],["CRO",2,"GHA",1,"Group L"],
  ["PAN",0,"ENG",2,"Group L"],["EGY",1,"IRN",1,"Group G"],["NZL",1,"BEL",5,"Group G"],
  ["CPV",0,"KSA",0,"Group H"],["URU",0,"ESP",1,"Group H"],["SEN",5,"IRQ",0,"Group I"],
  ["NOR",1,"FRA",4,"Group I"],
];
const UPCOMING = [
  ["JOR","ARG","Sat Jun 27","Group J"],["DZA","AUT","Sat Jun 27","Group J"],
  ["RSA","CAN","Sun Jun 28","Group A·B"],["BRA","JPN","Mon Jun 29","Group C·F"],
  ["GER","PAR","Mon Jun 29","Group E·D"],["NED","MAR","Mon Jun 29","Group F·C"],
];

// ── Round of 32 ──────────────────────────────────────────────
// id, side, seed labels (fallback), and resolved teams.
// `home`/`away` are real team codes; a missing `away` means the
// opponent is still TBD (shown as a seed). Add `result:{hs,as}`
// once a match is played to auto-grade predictions.
// Matchups confirmed from the official bracket (Jun 27, 2026).
const R32 = [
  // ── Left side ──
  { id:"M73", side:"L", a:"1E", b:"2D", home:"GER", away:"PAR", kickoff:"Mon Jun 29" },
  { id:"M74", side:"L", a:"1I", b:"2F", home:"FRA", away:"SWE", kickoff:"Tue Jun 30" },
  { id:"M75", side:"L", a:"2A", b:"2B", home:"RSA", away:"CAN", kickoff:"Sun Jun 28" },
  { id:"M76", side:"L", a:"1F", b:"2C", home:"NED", away:"MAR", kickoff:"Mon Jun 29" },
  { id:"M77", side:"L", a:"2K", b:"2L", home:"POR", away:"CRO", kickoff:"Wed Jul 1" },
  { id:"M78", side:"L", a:"1H", b:"TBD", home:"ESP", kickoff:"TBD" },           // opponent TBD
  { id:"M79", side:"L", a:"1D", b:"2B2", home:"USA", away:"BIH", kickoff:"TBD" },
  { id:"M80", side:"L", a:"1G", b:"2I", home:"BEL", away:"SEN", kickoff:"TBD" },
  // ── Right side ──
  { id:"M81", side:"R", a:"1C", b:"2F2", home:"BRA", away:"JPN", kickoff:"Mon Jun 29" },
  { id:"M82", side:"R", a:"2E", b:"2I2", home:"CIV", away:"NOR", kickoff:"Tue Jun 30" },
  { id:"M83", side:"R", a:"1A", b:"3?2", home:"MEX", away:"ECU", kickoff:"Tue Jun 30" },
  { id:"M84", side:"R", a:"1L", b:"2K2", home:"ENG", away:"COD", kickoff:"Wed Jul 1" },
  { id:"M85", side:"R", a:"1J", b:"2H", home:"ARG", away:"CPV", kickoff:"TBD" },
  { id:"M86", side:"R", a:"2D2", b:"2G", home:"AUS", away:"EGY", kickoff:"TBD" },
  { id:"M87", side:"R", a:"1B", b:"TBD", home:"SUI", kickoff:"TBD" },          // opponent TBD
  { id:"M88", side:"R", a:"1K", b:"2L2", home:"COL", away:"GHA", kickoff:"TBD" },
];

const teamsOf = (m)=>({ a:m.home||null, b:m.away||null, ready:!!(m.home&&m.away) });
const resultOf = (m)=> m.result || null;

// ── scoring ──────────────────────────────────────────────────
const PTS_WINNER = 3, PTS_EXACT_BONUS = 2;
function gradePick(pick, result){
  if(!pick || !result) return null;
  const realWinner = result.hs>result.as ? "a" : result.as>result.hs ? "b" : "draw";
  const exact = pick.hs===result.hs && pick.as===result.as;
  const winnerRight = pick.pickWinner === realWinner;
  let pts = 0;
  if(winnerRight) pts += PTS_WINNER;
  if(exact) pts += PTS_EXACT_BONUS;
  return { pts, winnerRight, exact };
}

const tone = (code)=> HOST[code] ? `var(--${HOST[code]})` : "var(--ink-300)";
function TeamLabel({ code, right }){
  if(!code) return null;
  return (
    <span className={`tl ${right?"right":""}`}>
      {!right && <em className="flag">{FLAG[code]}</em>}
      <em className="tname" style={HOST[code]?{color:tone(code)}:{}}>{NAME[code]}</em>
      {right && <em className="flag">{FLAG[code]}</em>}
    </span>
  );
}
const Seed = ({ s }) => <span className="seed">{s}</span>;

// ── Group card ───────────────────────────────────────────────
function GroupCard({ letter, rows }){
  const [face,setFace]=useState("table");
  return (
    <div className="gcard">
      <div className="gcard-head">
        <span className="gcard-letter">{letter}</span>
        <button className="flip" onClick={()=>setFace(f=>f==="table"?"info":"table")}>
          {face==="table"?"how it works":"standings"}
        </button>
      </div>
      {face==="table" ? (
        <div className="gtable">
          <div className="grow ghead"><span/><span>team</span><span>W</span><span>D</span><span>L</span><span>Pts</span></div>
          {rows.map((r,i)=>{
            const [code,w,d,l,pts]=r;
            const q = i<2?"qual":i<3?"maybe":"out";
            return (
              <div key={code} className={`grow ${q}`}>
                <span className="pos">{i+1}</span>
                <span className="team"><em className="flag">{FLAG[code]}</em>
                  <em className="tname" style={HOST[code]?{color:tone(code)}:{}}>{NAME[code]}</em></span>
                <span>{w}</span><span>{d}</span><span>{l}</span><span className="pts">{pts}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ginfo">
          <p><strong className="qd qual">Top 2</strong> advance automatically.</p>
          <p><strong className="qd maybe">3rd</strong> may advance — the 8 best third-placed teams go through.</p>
          <p><strong className="qd out">4th</strong> is out.</p>
        </div>
      )}
    </div>
  );
}

// ── Bracket ──────────────────────────────────────────────────
function BracketSlot({ m }){
  const { a, b, ready } = teamsOf(m);
  return (
    <div className={`bmatch ${ready?"ready":""}`}>
      <div className="bteam">{a ? <TeamLabel code={a}/> : <Seed s={m.a}/>}</div>
      <div className="bteam">{b ? <TeamLabel code={b}/> : <Seed s={m.b}/>}</div>
      {m.kickoff && <div className="bkick">{m.kickoff}</div>}
    </div>
  );
}

// ── Prediction card ──────────────────────────────────────────
function PredictionCard({ m, pick, onPick }){
  const { a, b, ready } = teamsOf(m);
  const result = resultOf(m);
  const grade = gradePick(pick, result);
  const [ha,setHa]=useState(pick?.hs ?? "");
  const [aw,setAw]=useState(pick?.as ?? "");

  if(!ready){
    return (
      <div className="pcard pending">
        <div className="pcard-teams"><Seed s={m.a}/><span className="vs">vs</span><Seed s={m.b}/></div>
        <p className="pwait">Locked until the group stage decides these slots.</p>
      </div>
    );
  }

  const commit=(hs,as)=>{
    if(hs==="" || as==="") return;
    const h=Math.max(0,parseInt(hs,10)||0), w=Math.max(0,parseInt(as,10)||0);
    const pickWinner = h>w?"a":w>h?"b":"draw";
    onPick(m.id,{ hs:h, as:w, pickWinner });
  };

  return (
    <div className={`pcard ${result?"played":""}`}>
      <div className="pcard-top">
        <TeamLabel code={a}/>
        <div className="pscore">
          <input className="sin" inputMode="numeric" value={ha} disabled={!!result}
            onChange={e=>setHa(e.target.value.replace(/\D/g,"").slice(0,2))}
            onBlur={e=>commit(e.target.value,aw)} aria-label={`${NAME[a]} score`}/>
          <i>:</i>
          <input className="sin" inputMode="numeric" value={aw} disabled={!!result}
            onChange={e=>setAw(e.target.value.replace(/\D/g,"").slice(0,2))}
            onBlur={e=>commit(ha,e.target.value)} aria-label={`${NAME[b]} score`}/>
        </div>
        <TeamLabel code={b} right/>
      </div>
      {result ? (
        <div className={`presult ${grade?.pts?"hit":"miss"}`}>
          <span>Final {result.hs}–{result.as}</span>
          {grade ? (
            grade.pts>0
              ? <span className="pbadge win">{grade.exact?"Exact score":"Winner"} +{grade.pts}</span>
              : <span className="pbadge lose">No points</span>
          ) : <span className="pbadge">No pick</span>}
        </div>
      ) : (
        <div className="phint">{pick ? `Your pick: ${pick.hs}–${pick.as}` : "Enter a scoreline to lock your prediction"}</div>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────
export default function TheCup(){
  const [tab,setTab]=useState("groups");
  const [picks,setPicks]=useState(()=>store.load());
  useEffect(()=>{ store.save(picks); },[picks]);

  const onPick=(id,p)=>setPicks(prev=>({ ...prev, [id]:p }));

  const totals=useMemo(()=>{
    let pts=0, graded=0;
    for(const m of R32){
      const r=resultOf(m); if(!r) continue;
      const g=gradePick(picks[m.id], r);
      if(g){ pts+=g.pts; graded++; }
    }
    return { pts, graded };
  },[picks]);

  const left=R32.filter(m=>m.side==="L"), right=R32.filter(m=>m.side==="R");

  return (
    <div className="cup-root">
      <style>{CSS}</style>

      <header className="masthead">
        <div className="mast-thread"><i style={{background:"var(--can)"}}/><i style={{background:"var(--usa)"}}/><i style={{background:"var(--mex)"}}/></div>
        <div className="mast-main">
          <h1>The&nbsp;<span>Cup</span></h1>
          <p className="mast-sub">2026 · Canada · Mexico · USA · <strong>48 teams, 104 matches</strong></p>
        </div>
        <nav className="tabs">
          <button className={tab==="groups"?"on":""} onClick={()=>setTab("groups")}>Groups</button>
          <button className={tab==="bracket"?"on":""} onClick={()=>setTab("bracket")}>Bracket</button>
          <button className={tab==="scores"?"on":""} onClick={()=>setTab("scores")}>Scores</button>
          <button className={`pred-tab ${tab==="predict"?"on":""}`} onClick={()=>setTab("predict")}>Predictions</button>
        </nav>
      </header>

      {tab==="groups" && (
        <main className="groups-grid">
          {Object.entries(GROUPS).map(([l,rows])=><GroupCard key={l} letter={l} rows={rows}/>)}
        </main>
      )}

      {tab==="bracket" && (
        <main className="bracket-wrap">
          <p className="b-note">Round of 32 → Final, from the official bracket. Two ties (Spain, Switzerland) show <span className="seed">TBD</span> until today's group matches set their opponents.</p>
          <div className="bracket-scroll">
            <div className="bcol">
              <h4>Round of 32 · Left</h4>
              {left.map(m=><BracketSlot key={m.id} m={m}/>)}
            </div>
            <div className="bcol final-col">
              <div className="trophy">🏆</div><h4>The Final</h4>
              <p className="final-place">MetLife Stadium</p>
              <p className="final-date">July 19 · East Rutherford, NJ</p>
              <p className="final-extra">First-ever halftime show</p>
            </div>
            <div className="bcol">
              <h4>Round of 32 · Right</h4>
              {right.map(m=><BracketSlot key={m.id} m={m}/>)}
            </div>
          </div>
        </main>
      )}

      {tab==="scores" && (
        <main className="scores">
          <section className="score-block">
            <h3>Latest results</h3>
            {RESULTS.map((r,i)=>{
              const [h,hs,a,as_,tag]=r; const hw=hs>as_, awn=as_>hs;
              return (
                <div key={i} className="result">
                  <span className="r-tag">{tag}</span>
                  <span className={`r-side ${hw?"win":""}`}><em>{FLAG[h]}</em>{NAME[h]}</span>
                  <span className="r-score">{hs}<i>–</i>{as_}</span>
                  <span className={`r-side right ${awn?"win":""}`}>{NAME[a]}<em>{FLAG[a]}</em></span>
                </div>
              );
            })}
          </section>
          <section className="score-block">
            <h3>Coming up</h3>
            {UPCOMING.map((r,i)=>{
              const [h,a,when,tag]=r;
              return (
                <div key={i} className="result upcoming">
                  <span className="r-tag">{tag}</span>
                  <span className="r-side"><em>{FLAG[h]}</em>{NAME[h]}</span>
                  <span className="r-score next">{when}</span>
                  <span className="r-side right">{NAME[a]}<em>{FLAG[a]}</em></span>
                </div>
              );
            })}
          </section>
        </main>
      )}

      {tab==="predict" && (
        <main className="predict">
          <div className="pred-head">
            <div>
              <h3>Round of 32 predictions</h3>
              <p>Call the scoreline for each tie. <strong>Winner +3</strong>, <strong>exact score +5</strong> (3 + 2 bonus). Picks grade themselves as results come in.</p>
            </div>
            <div className="scoreboard">
              <span className="sb-pts">{totals.pts}</span>
              <span className="sb-lbl">your points · {totals.graded} graded</span>
            </div>
          </div>
          <div className="pred-grid">
            {R32.map(m=><PredictionCard key={m.id} m={m} pick={picks[m.id]} onPick={onPick}/>)}
          </div>
        </main>
      )}

      <footer className="cup-foot">
        Data current to June 27, 2026 · group stage concluding. {USE_LOCAL_STORAGE ? "Predictions saved to this browser." : "Preview mode — predictions reset on reload."}
      </footer>
    </div>
  );
}

const CSS = `
.cup-root{
  --display:'Space Grotesk',system-ui,sans-serif;
  --body:'Inter Tight',system-ui,sans-serif;
  --num:'Archivo','Space Grotesk',sans-serif;
  --bg:#0a1626;--panel:#0f2036;--panel-2:#13294a;
  --ink-100:#eaf1fb;--ink-300:#9fb2cc;--ink-500:#5c728f;
  --mex:#28b463;--can:#ff4d4d;--usa:#4d9bff;--gold:#f4c95d;
  --line:rgba(159,178,204,.14);
  background:radial-gradient(120% 80% at 50% -10%,#13294a 0%,var(--bg) 55%);
  color:var(--ink-100);font-family:var(--body);
  min-height:100%;padding:0 0 40px;border-radius:14px;overflow:hidden;
}
.cup-root *{box-sizing:border-box}
.masthead{padding:0;position:relative}
.mast-thread{display:flex;gap:4px;margin-bottom:18px}
.mast-thread i{height:4px;flex:1;border-radius:2px;display:block}
.mast-main h1{font-family:var(--display);font-weight:600;
  font-size:clamp(30px,5vw,44px);line-height:1;letter-spacing:-.02em;margin:0;text-transform:none}
.mast-main h1 span{color:var(--gold);font-weight:700}
.mast-sub{margin:8px 0 0;color:var(--ink-300);font-size:13px;letter-spacing:.02em}
.mast-sub strong{color:var(--ink-100)}
.tabs{display:flex;gap:4px;margin-top:20px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.tabs button{background:none;border:none;color:var(--ink-500);font-weight:700;font-size:14px;
  padding:10px 16px;cursor:pointer;border-bottom:2px solid transparent;letter-spacing:.02em;transition:color .15s}
.tabs button:hover{color:var(--ink-300)}
.tabs button.on{color:var(--ink-100);border-bottom-color:var(--gold)}
.tabs button:focus-visible{outline:2px solid var(--usa);outline-offset:2px;border-radius:4px}
.pred-tab{position:relative;color:var(--gold)!important;opacity:.85;padding-left:22px!important}
.pred-tab.on{opacity:1}
.pred-tab::before{content:"";position:absolute;left:8px;top:14px;width:6px;height:6px;border-radius:50%;background:var(--gold)}

.groups-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:24px 0}
.gcard{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;min-height:200px}
.gcard-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.gcard-letter{font-family:var(--display);font-weight:700;font-size:24px;width:40px;height:40px;
  display:grid;place-items:center;background:var(--panel-2);border-radius:9px;color:var(--gold)}
.flip{background:none;border:1px solid var(--line);color:var(--ink-300);font-size:11px;padding:5px 9px;border-radius:20px;cursor:pointer;font-weight:600}
.flip:hover{border-color:var(--ink-300);color:var(--ink-100)}
.gtable{display:flex;flex-direction:column;gap:1px}
.grow{display:grid;grid-template-columns:18px 1fr 18px 18px 18px 26px;align-items:center;gap:6px;padding:6px 4px;font-size:13px;border-radius:6px}
.grow.ghead{color:var(--ink-500);font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;padding:2px 4px}
.grow.ghead span:nth-child(n+3){text-align:center}
.grow span:nth-child(n+3){text-align:center;color:var(--ink-300)}
.grow .pos{color:var(--ink-500);font-weight:700;text-align:center}
.grow .pts{color:var(--ink-100);font-weight:800}
.team{display:flex;align-items:center;gap:7px;min-width:0}
.flag{font-style:normal;font-size:15px;flex:none}
.tname{font-style:normal;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grow.qual{background:linear-gradient(90deg,rgba(40,180,99,.10),transparent)}
.grow.qual .pos{color:var(--mex)}
.grow.maybe{background:linear-gradient(90deg,rgba(244,201,93,.08),transparent)}
.grow.maybe .pos{color:var(--gold)}
.grow.out{opacity:.5}
.ginfo{font-size:13px;color:var(--ink-300);line-height:1.5;display:flex;flex-direction:column;gap:10px;padding-top:4px}
.ginfo p{margin:0}
.qd{display:inline-block;padding:1px 7px;border-radius:5px;font-size:11px;margin-right:4px;font-weight:700}
.qd.qual{background:rgba(40,180,99,.18);color:var(--mex)}
.qd.maybe{background:rgba(244,201,93,.16);color:var(--gold)}
.qd.out{background:rgba(255,77,77,.16);color:var(--can)}

.bracket-wrap{padding:20px 0}
.b-note{color:var(--ink-300);font-size:13px;margin:0 0 16px;line-height:1.5}
.seed{font-family:monospace;color:var(--ink-500);font-weight:700;font-size:12px}
.b-note .seed{color:var(--gold)}
.bracket-scroll{display:flex;gap:24px;overflow-x:auto;padding-bottom:14px;align-items:flex-start;justify-content:center;min-width:min-content}
@media (max-width:900px){.bracket-scroll{justify-content:flex-start}}
.bcol{flex:none;width:210px;display:flex;flex-direction:column;gap:10px}
.bcol h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-500);font-weight:700}
.bmatch{background:var(--panel);border:1px solid var(--line);border-radius:9px;overflow:hidden;position:relative}
.bmatch.ready{border-color:var(--gold)}
.bteam{padding:9px 11px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:7px}
.bteam:first-child{border-bottom:1px solid var(--line)}
.bkick{font-size:10px;color:var(--gold);padding:3px 11px;background:rgba(244,201,93,.08);text-align:right}
.tl{display:flex;align-items:center;gap:7px;min-width:0}
.tl.right{justify-content:flex-end}
.final-col{width:210px;align-items:center;text-align:center;
  background:linear-gradient(180deg,rgba(244,201,93,.10),transparent);
  border:1px solid rgba(244,201,93,.25);border-radius:12px;padding:24px 14px;align-self:center}
.trophy{font-size:46px;line-height:1}
.final-col h4{color:var(--gold);font-size:13px;margin:10px 0 6px;font-family:var(--display);font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.final-place{font-family:var(--display);font-weight:600;font-size:16px;margin:0}
.final-date{color:var(--ink-300);font-size:12px;margin:4px 0 0}
.final-extra{color:var(--ink-500);font-size:11px;margin:8px 0 0;font-style:italic}

.scores{padding:24px 0;display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}
.score-block h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-300);margin:0 0 12px}
.result{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;background:var(--panel);
  border:1px solid var(--line);border-radius:9px;padding:11px 12px;margin-bottom:8px;position:relative}
.r-tag{position:absolute;top:-7px;left:11px;font-size:9px;letter-spacing:.06em;text-transform:uppercase;
  background:var(--panel-2);color:var(--ink-500);padding:1px 6px;border-radius:4px;font-weight:700}
.r-side{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--ink-300)}
.r-side.right{justify-content:flex-end}
.r-side em{font-style:normal;font-size:16px}
.r-side.win{color:var(--ink-100)}
.r-score{font-family:var(--num);font-weight:800;font-size:20px;display:flex;gap:5px;align-items:center}
.r-score i{color:var(--ink-500);font-style:normal;font-size:14px}
.r-score.next{font-size:12px;font-weight:700;color:var(--gold);font-family:var(--body)}

.predict{padding:24px 0}
.pred-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:20px}
.pred-head h3{margin:0 0 6px;font-size:19px;font-family:var(--display);font-weight:600;letter-spacing:-.01em}
.pred-head p{margin:0;color:var(--ink-300);font-size:13px;max-width:440px;line-height:1.5}
.pred-head strong{color:var(--gold)}
.scoreboard{background:linear-gradient(180deg,rgba(244,201,93,.12),transparent);border:1px solid rgba(244,201,93,.3);
  border-radius:12px;padding:12px 20px;text-align:center;flex:none}
.sb-pts{display:block;font-family:var(--num);font-weight:800;font-size:38px;color:var(--gold);line-height:1}
.sb-lbl{font-size:11px;color:var(--ink-300);text-transform:uppercase;letter-spacing:.05em}
.pred-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.pcard{background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:14px}
.pcard.played{border-color:rgba(244,201,93,.3)}
.pcard.pending{opacity:.6;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:110px;text-align:center}
.pcard-teams{display:flex;align-items:center;gap:10px}
.vs{color:var(--ink-500);font-size:12px;font-weight:700}
.pwait{margin:8px 0 0;font-size:12px;color:var(--ink-500)}
.pcard-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.pscore{display:flex;align-items:center;gap:6px}
.pscore i{color:var(--ink-500);font-style:normal}
.sin{width:38px;height:40px;text-align:center;font-size:18px;font-weight:800;border-radius:8px;
  background:var(--panel-2);border:1px solid var(--line);color:var(--ink-100);font-family:var(--num)}
.sin:focus{outline:none;border-color:var(--gold)}
.sin:disabled{opacity:.8}
.phint{margin-top:10px;font-size:11px;color:var(--ink-500);text-align:center}
.presult{margin-top:10px;display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--ink-300)}
.pbadge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px}
.pbadge.win{background:rgba(40,180,99,.2);color:var(--mex)}
.pbadge.lose{background:rgba(255,77,77,.16);color:var(--can)}

.cup-foot{text-align:center;color:var(--ink-500);font-size:11px;padding:20px;border-top:1px solid var(--line);margin-top:10px}
@media (min-width:1100px){
  .bcol{width:250px}
  .final-col{width:250px}
  .bracket-scroll{gap:56px}
  .pred-grid{grid-template-columns:repeat(auto-fill,minmax(330px,1fr))}
  .mast-main h1{font-size:48px}
}
@media (max-width:520px){
  .scores,.pred-grid{grid-template-columns:1fr}
  .masthead,.groups-grid,.bracket-wrap,.predict{padding-left:0;padding-right:0}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

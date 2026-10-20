(() => {
"use strict";
const $=id=>document.getElementById(id);
const STORE="goalstats-data-v1", SETTINGS="goalstats-settings-v1", CACHE_DATA="goalstats-last-api-";
const compNames={BSA:"Brasileirão Série A",PL:"Premier League",CL:"UEFA Champions League",PD:"La Liga",SA:"Serie A",BL1:"Bundesliga",FL1:"Ligue 1"};
const demo={
  matches:[
    {competition:"Dados reais em breve",utcDate:"",status:"SCHEDULED",homeTeam:{name:"Atlético-MG"},awayTeam:{name:"Cruzeiro"},score:{fullTime:{home:null,away:null}},demo:true},
    {competition:"Dados reais em breve",utcDate:"",status:"SCHEDULED",homeTeam:{name:"Flamengo"},awayTeam:{name:"Palmeiras"},score:{fullTime:{home:null,away:null}},demo:true},
    {competition:"Dados reais em breve",utcDate:"",status:"FINISHED",homeTeam:{name:"Brasil"},awayTeam:{name:"Argentina"},score:{fullTime:{home:2,away:1}},demo:true}
  ],
  players:[
    {name:"Cadastre uma API",team:"Jogadores reais",position:"Conecte uma fonte",goals:"—",assists:"—",demo:true},
    {name:"Ou adicione pelo painel",team:"Dados locais",position:"Administrador",goals:"—",assists:"—",demo:true}
  ],
  news:[
    {title:"Bem-vindo ao Goalstats",summary:"Use o painel Admin para cadastrar notícias ou configure uma fonte de dados.",url:"",date:new Date().toISOString(),source:"Goalstats",demo:true}
  ], favorites:[], updatedAt:null
};
let db=load(STORE,demo), settings=load(SETTINGS,{token:"",competition:"BSA",refresh:"30"});
let currentComp="ALL", scorerComp=settings.competition||"BSA", installEvent=null, apiMatches=[], apiPlayers=[];
function load(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):structuredClone(fallback)}catch{return structuredClone(fallback)}}
function save(){localStorage.setItem(STORE,JSON.stringify(db));renderAll()}
function saveSettings(){settings={token:$("apiToken").value.trim(),competition:$("defaultComp").value,refresh:$("autoRefresh").value};localStorage.setItem(SETTINGS,JSON.stringify(settings));scorerComp=settings.competition;toast("Configuração salva neste aparelho"); if(settings.token){setTimeout(()=>fetchMatches(),500);}}
function toast(s){const el=$("toast");el.textContent=s;el.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display="none",2500)}
function safeUrl(url){try{const u=new URL(url);return ["https:","http:"].includes(u.protocol)?u.href:""}catch{return ""}}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateLabel(s){if(!s)return "Dados reais em breve";const d=new Date(s);return isNaN(d)?s:d.toLocaleString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
function scoreLabel(m){const s=m.score?.fullTime||{};return Number.isFinite(s.home)&&Number.isFinite(s.away)?`${s.home} – ${s.away}`:"VS"}
function isLive(m){return ["LIVE","IN_PLAY","PAUSED","EXTRA_TIME","PENALTY_SHOOTOUT"].includes(m.status)}
function matchCard(m){
 const home=m.homeTeam?.shortName||m.homeTeam?.name||"Mandante", away=m.awayTeam?.shortName||m.awayTeam?.name||"Visitante";
 const comp=m.competition?.name||m.competition||"Futebol", status=isLive(m)?'<span class="live">● AO VIVO</span>':(m.status==="FINISHED"?"ENCERRADO":escapeHtml(dateLabel(m.utcDate)));
 return `<article class="match"><div class="match-top"><span>${escapeHtml(comp)}</span><span>${status}</span></div><div class="teams"><div class="team"><div class="crest">⚽</div><span class="team-name">${escapeHtml(home)}</span></div><div class="score">${escapeHtml(scoreLabel(m))}</div><div class="team"><span class="team-name">${escapeHtml(away)}</span><div class="crest">⚽</div></div></div></article>`;
}
function newsCard(n,admin=false,i=0){const url=safeUrl(n.url);return `<article class="news"><div class="news-icon">▤</div><div class="news-content"><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.summary||"Sem resumo.")}</p><div class="hint">${escapeHtml(n.source||"Goalstats")} · ${escapeHtml(dateLabel(n.date))}</div>${url?`<a href="${url}" target="_blank" rel="noopener noreferrer">LER NA FONTE ↗</a>`:""}${admin?` <button class="btn danger small" data-delete-news="${i}">Excluir</button>`:""}</div></article>`}
function playerRow(p,i,admin=false){return `<div class="player-row"><div class="avatar">${escapeHtml((p.name||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</div><div class="player-info"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.team||"Clube não informado")} · ${escapeHtml(p.position||"Posição não informada")}</span></div><div class="metric">${escapeHtml(p.goals??"—")}<small>GOLS</small></div>${admin?`<button class="btn danger small" data-delete-player="${i}">×</button>`:""}</div>`}
function filteredMatches(){let all=apiMatches.length?apiMatches:db.matches;return currentComp==="ALL"?all:all.filter(m=>(m.competition?.code||m.competitionCode||"")===currentComp||m.demo)}
function renderMatches(){const ms=filteredMatches();const html=ms.map(matchCard).join("")||'<div class="empty"><b>Nenhuma partida encontrada</b>Conecte a API ou altere a competição.</div>';$("matchesList").innerHTML=html;$("homeMatches").innerHTML=ms.slice(0,3).map(matchCard).join("")||'<div class="empty"><b>Sem partidas carregadas</b>Conecte a API na aba Admin.</div>';$("matchCount").textContent=apiMatches.length||db.matches.length}
function allPlayers(){return [...apiPlayers,...db.players.filter(p=>!p.demo)]}
function renderPlayers(){const q=$("playerSearch").value.trim().toLowerCase();const ps=allPlayers().filter(p=>(p.name+" "+(p.team||"")).toLowerCase().includes(q));$("playersList").innerHTML=ps.map((p,i)=>playerRow(p,i)).join("")||'<div class="empty"><b>Nenhum jogador encontrado</b>Busque outro nome ou conecte uma API.</div>';$("playerCount").textContent=allPlayers().length}
function renderNews(){const list=db.news||[];$("newsList").innerHTML=list.map(n=>newsCard(n)).join("")||'<div class="empty"><b>Sem notícias</b>Adicione notícias no painel Admin.</div>';$("homeNews").innerHTML=list.slice(0,2).map(n=>newsCard(n)).join("")||'<div class="empty">Sem notícias publicadas.</div>';$("newsCount").textContent=list.length;$("adminNewsList").innerHTML=list.map((n,i)=>newsCard(n,true,i)).join("")||'<div class="empty">Nenhuma notícia cadastrada.</div>'}
function renderAdminPlayers(){$("adminPlayersList").innerHTML=(db.players||[]).map((p,i)=>playerRow(p,i,true)).join("")||'<div class="empty">Nenhum jogador local.</div>'}
function renderAll(){renderMatches();renderPlayers();renderNews();renderAdminPlayers()}
function setPage(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".navbtn").forEach(b=>b.classList.toggle("active",b.dataset.page===page));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.go)));
document.querySelectorAll("[data-comp]").forEach(b=>b.addEventListener("click",()=>{currentComp=b.dataset.comp;document.querySelectorAll("[data-comp]").forEach(x=>x.classList.toggle("active",x===b));renderMatches()}));
document.querySelectorAll("[data-scorer]").forEach(b=>b.addEventListener("click",()=>{scorerComp=b.dataset.scorer;document.querySelectorAll("[data-scorer]").forEach(x=>x.classList.toggle("active",x===b));fetchScorers()}));
document.querySelectorAll("[data-admin]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-admin]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".adminpage").forEach(x=>x.hidden=x.id!=="admin-"+b.dataset.admin)}));
document.addEventListener("click",e=>{const n=e.target.closest("[data-delete-news]");if(n){if(confirm("Excluir esta notícia local?")){db.news.splice(+n.dataset.deleteNews,1);save();toast("Notícia excluída")}}const p=e.target.closest("[data-delete-player]");if(p){if(confirm("Excluir este jogador local?")){db.players.splice(+p.dataset.deletePlayer,1);save();toast("Jogador excluído")}}});
function setOnline(){const on=navigator.onLine;$("netPill").innerHTML=`<i class="dot ${on?"":"off"}"></i>${on?"Online":"Offline"}`}window.addEventListener("online",setOnline);window.addEventListener("offline",setOnline);setOnline();
async function apiFetch(path){if(!settings.token)throw new Error("Configure um token da API na aba Admin.");const r=await fetch("https://api.football-data.org/v4"+path,{headers:{"X-Auth-Token":settings.token}});if(!r.ok){let detail="HTTP "+r.status;try{const j=await r.json();detail=j.message||detail}catch{}throw new Error(detail)}return r.json()}
function todayISO(){const d=new Date();return d.toISOString().slice(0,10)}
async function fetchMatches(){if(!settings.token){toast("Configure um token da API na aba Admin");return} $("refreshMatches").textContent="Buscando…";try{const from=todayISO(),to=new Date(Date.now()+6*864e5).toISOString().slice(0,10);const comp=currentComp==="ALL"?settings.competition:currentComp;let data;try{data=await apiFetch(`/competitions/${encodeURIComponent(comp)}/matches?dateFrom=${from}&dateTo=${to}`)}catch(e){if(currentComp!=="ALL")throw e;data=await apiFetch(`/matches?dateFrom=${from}&dateTo=${to}`)}apiMatches=data.matches||[];localStorage.setItem(CACHE_DATA+"matches",JSON.stringify({at:Date.now(),data:apiMatches}));renderMatches();$("apiStatus").textContent=`Conectado. ${apiMatches.length} partidas recebidas em ${new Date().toLocaleTimeString("pt-BR")}.`;toast("Partidas atualizadas")}catch(e){loadCached("matches");$("apiStatus").textContent="Falha ao buscar partidas: "+e.message;toast("Não foi possível atualizar")}finally{$("refreshMatches").textContent="↻ Atualizar"}}
async function fetchScorers(){if(!settings.token){loadCached("players");return} $("refreshPlayers").textContent="Buscando…";try{const data=await apiFetch(`/competitions/${encodeURIComponent(scorerComp)}/scorers?limit=20`);apiPlayers=(data.scorers||[]).map(s=>({name:s.player?.name||"Jogador",team:s.team?.name||"",position:s.player?.position||"Jogador",goals:s.goals??0,assists:s.assists??"—"}));localStorage.setItem(CACHE_DATA+"players",JSON.stringify({at:Date.now(),data:apiPlayers}));renderPlayers();$("apiStatus").textContent=`Artilheiros carregados: ${apiPlayers.length}.`;toast("Jogadores atualizados")}catch(e){loadCached("players");$("apiStatus").textContent="Falha ao buscar artilheiros: "+e.message;toast("Não foi possível atualizar jogadores")}finally{$("refreshPlayers").textContent="↻ Atualizar"}}
function loadCached(key){try{const c=JSON.parse(localStorage.getItem(CACHE_DATA+key)||"null");if(!c)return;if(key==="matches")apiMatches=c.data||[];if(key==="players")apiPlayers=c.data||[];renderAll()}catch{}}
$("quickRefresh").addEventListener("click",()=>{if(!navigator.onLine){toast("Você está offline; exibindo dados salvos");return}fetchMatches();fetchScorers()});
$("refreshMatches").addEventListener("click",fetchMatches);$("refreshPlayers").addEventListener("click",fetchScorers);$("playerSearch").addEventListener("input",renderPlayers);
$("saveApi").addEventListener("click",()=>{saveSettings();if(settings.token)fetchMatches()});
$("testApi").addEventListener("click",async()=>{saveSettings();$("apiStatus").textContent="Testando…";try{const d=await apiFetch("/competitions");$("apiStatus").textContent=`Conexão OK. A API retornou ${d.competitions?.length||0} competições disponíveis para seu plano.`;toast("API conectada")}catch(e){$("apiStatus").textContent="Teste falhou: "+e.message+" Confira o token e as permissões do plano.";toast("Falha no teste")}});
$("addNews").addEventListener("click",()=>{const title=$("newsTitle").value.trim(),summary=$("newsSummary").value.trim(),url=safeUrl($("newsUrl").value.trim());if(!title){toast("Digite um título");return}if($("newsUrl").value.trim()&&!url){toast("O link precisa ser http ou https");return}db.news.unshift({title,summary,url,date:new Date().toISOString(),source:"Publicado localmente"});$("newsTitle").value="";$("newsSummary").value="";$("newsUrl").value="";save();toast("Notícia salva neste aparelho")});
$("addPlayer").addEventListener("click",()=>{const name=$("newPlayerName").value.trim();if(!name){toast("Digite o nome do jogador");return}db.players.unshift({name,team:$("newPlayerClub").value.trim(),position:$("newPlayerPos").value,goals:Math.max(0,Number($("newPlayerGoals").value)||0),assists:"—"});$("newPlayerName").value="";$("newPlayerClub").value="";$("newPlayerGoals").value="0";save();toast("Jogador cadastrado localmente")});
function download(name,text,type="application/json"){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$("exportData").addEventListener("click",()=>download("goalstats-backup.json",JSON.stringify({db,settings:{...settings,token:""}},null,2)));
$("exportPublic").addEventListener("click",()=>download("data.json",JSON.stringify({appName:"Goalstats",message:"Conteúdo exportado do painel Goalstats.",updatedAt:new Date().toISOString(),items:db.news.map(n=>({title:n.title,summary:n.summary,url:n.url,date:n.date})),players:db.players},null,2)));
$("importButton").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",async e=>{const f=e.target.files?.[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!j.db||!Array.isArray(j.db.news)||!Array.isArray(j.db.players))throw new Error("Formato inválido");if(confirm("Importar vai substituir os dados locais atuais. Continuar?")){db=j.db;save();toast("Backup importado")}}catch(err){toast("Não foi possível importar: "+err.message)}e.target.value=""});
$("resetLocal").addEventListener("click",()=>{if(confirm("Restaurar os dados demonstrativos? Suas notícias e jogadores locais serão apagados.")){db=structuredClone(demo);apiMatches=[];apiPlayers=[];save();toast("Dados demonstrativos restaurados")}});
$("apiToken").value=settings.token||"";$("defaultComp").value=settings.competition||"BSA";$("autoRefresh").value=settings.refresh||"30";
function autoRefresh(){const minutes=Number(settings.refresh||0);if(minutes>0&&navigator.onLine&&settings.token){fetchMatches();fetchScorers()}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&navigator.onLine&&registration)registration.update().catch(()=>{})});
let registration=null;
if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js").then(r=>{registration=r;r.update().catch(()=>{});if(r.waiting&&navigator.serviceWorker.controller)toast("Nova versão pronta; feche e abra o app para atualizar")}).catch(e=>console.warn("Service Worker:",e));}
let autoTimer=null;function scheduleAuto(){if(autoTimer)clearInterval(autoTimer);const mins=Number(settings.refresh||0);if(mins>0)autoTimer=setInterval(()=>{if(navigator.onLine&&document.visibilityState==="visible"){fetchMatches();fetchScorers()}},mins*60*1000)}scheduleAuto();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvent=e;$("installBtn").hidden=false;$("installBanner").style.display="block"});
async function install(){if(!installEvent){toast("Use o menu do navegador e escolha Instalar app");return}installEvent.prompt();await installEvent.userChoice;installEvent=null;$("installBtn").hidden=true;$("installBanner").style.display="none"}
$("installBtn").addEventListener("click",install);$("installBannerBtn").addEventListener("click",install);
window.addEventListener("appinstalled",()=>{$("installBanner").style.display="none";toast("Goalstats instalado!")});
renderAll();loadCached("matches");loadCached("players");
})();
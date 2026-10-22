// ==========================
// GOALSTATS APP.JS - UNIFICADO ⚽🤖
// ==========================

// ==========================
// ⚙️ CONFIGURAÇÕES E CHAVES
// ==========================

function salvarConfiguracoes() {
    const football = document.getElementById("input-football").value;
    const gemini = document.getElementById("input-gemini").value;

    localStorage.setItem("goalstats_football_key", football);
    localStorage.setItem("goalstats_gemini_key", gemini);

    alert("APIs salvas com sucesso! ✅");

    carregarChavesSalvas();
}


function carregarChavesSalvas() {
    const g = localStorage.getItem("goalstats_gemini_key");
    const f = localStorage.getItem("goalstats_football_key");

    const statusGeminiEl = document.getElementById("status-gemini");
    const statusFootballEl = document.getElementById("status-football");

    if (statusGeminiEl) {
        if (g) {
            statusGeminiEl.innerHTML = `
                <span class="font-bold text-gray-300">🤖 Gemini IA:</span>
                <span class="text-emerald-400 font-black text-[10px]">ONLINE</span>
            `;
        } else {
            statusGeminiEl.innerHTML = `
                <span class="font-bold text-gray-300">🤖 Gemini IA:</span>
                <span class="text-yellow-500 font-black text-[10px]">OFFLINE</span>
            `;
        }
    }

    if (statusFootballEl) {
        if (f) {
            statusFootballEl.innerHTML = `
                <span class="font-bold text-gray-300">⚽ Football-Data:</span>
                <span class="text-emerald-400 font-black text-[10px]">ONLINE</span>
            `;
        } else {
            statusFootballEl.innerHTML = `
                <span class="font-bold text-gray-300">⚽ Football-Data:</span>
                <span class="text-yellow-500 font-black text-[10px]">OFFLINE</span>
            `;
        }
    }
}


// ==========================
// ⚽ FOOTBALL-DATA.ORG
// ==========================

async function buscarPartidas() {
    const token = localStorage.getItem("goalstats_football_key");

    if (!token) {
        alert("Coloque o token da Football-data.org primeiro");
        return;
    }

    try {
        const resposta = await fetch(
            "https://api.football-data.org/v4/competitions/BSA/matches",
            {
                headers: {
                    "X-Auth-Token": token
                }
            }
        );

        const dados = await resposta.json();

        if (!dados.matches) {
            alert("Erro na Football-data.org. Verifique o token.");
            console.log(dados);
            return;
        }

        mostrarPartidas(dados.matches);

    } catch (e) {
        console.log(e);
        alert("Erro ao buscar partidas.");
    }
}


function mostrarPartidas(partidas) {
    const container = document.getElementById("container-jogos");

    if (!container) return;

    container.innerHTML = "";

    partidas.slice(0, 10).forEach(jogo => {
        container.innerHTML += `
            <div class="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <div class="text-xs text-emerald-400 font-bold">
                    ${jogo.competition.name}
                </div>
                <div class="flex justify-between mt-3 font-black">
                    <span>${jogo.homeTeam.name}</span>
                    <span>${jogo.score.fullTime.home ?? "-"} x ${jogo.score.fullTime.away ?? "-"}</span>
                    <span>${jogo.awayTeam.name}</span>
                </div>
            </div>
        `;
    });
}


// ==========================
// 🛡️ THESPORTSDB (BUSCA DE TIMES E ESCUDOS)
// ==========================

async function buscarTime(nome) {
    try {
        const resposta = await fetch(
            `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(nome)}`
        );

        const dados = await resposta.json();

        if (dados.teams && dados.teams.length) {
            return dados.teams[0];
        }

        return null;

    } catch (e) {
        console.log("Erro TheSportsDB", e);
        return null;
    }
}


async function pegarEscudo(nome) {
    const time = await buscarTime(nome);

    if (time) {
        return time.strBadge;
    }

    return "";
}


// ==========================
// 👤 FOTO DE JOGADOR
// ==========================

async function pesquisarJogador(nome) {
    try {
        const resposta = await fetch(
            `https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(nome)}`
        );

        const dados = await resposta.json();
        return dados.player?.[0] || null;

    } catch (e) {
        console.log(e);
        return null;
    }
}


// ==========================
// 🤖 GEMINI IA
// ==========================

async function chamarGemini(prompt, caixa) {
    const chave = localStorage.getItem("goalstats_gemini_key");

    if (!chave) {
        if (caixa) {
            caixa.innerHTML = `
                <span class="text-yellow-400">
                ⚠️ Coloque a chave do Gemini no Admin
                </span>
            `;
        }
        return;
    }

    try {
        const resposta = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${chave}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const dados = await resposta.json();
        const texto = dados.candidates?.[0]?.content?.parts?.[0]?.text;

        if (caixa) {
            caixa.innerHTML = `
                <div class="text-emerald-400 font-bold">
                🤖 Goalstats IA:
                </div>
                <div class="text-gray-200 mt-2">
                ${texto?.replace(/\n/g, "<br>") || "Sem resposta"}
                </div>
            `;
        }

    } catch (e) {
        console.log(e);
        if (caixa) {
            caixa.innerHTML = `
                <span class="text-red-400">
                Erro ao conectar com Gemini
                </span>
            `;
        }
    }
}


// ==========================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ==========================

document.addEventListener("DOMContentLoaded", () => {
    carregarChavesSalvas();

    const token = localStorage.getItem("goalstats_football_key");

    if (token) {
        buscarPartidas();
    }
});

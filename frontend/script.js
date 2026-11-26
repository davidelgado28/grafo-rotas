const API = "http://localhost:8000";
const canvas   = document.getElementById("canvas");
const ctx      = canvas.getContext("2d");
const selOrig  = document.getElementById("select-origem");
const selDest  = document.getElementById("select-destino");
const btnRota  = document.getElementById("btn-rota");
const btnLimpar= document.getElementById("btn-limpar");
const resultado= document.getElementById("resultado");

let vertices = [];  
let arestas  = [];  
let caminhoAtual = [];
let custoAtual   = null;    
let modoBloqueio = null;     
const verticeById = id => vertices.find(v => v.id === id);
const API_URL = (path) => `API{API}API{path}`;

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

async function carregarGrafo() {
  const data = await fetchJSON(API_URL("/grafo"));
  vertices = data.vertices;
  arestas  = data.arestas;
  preencherSelects();
  desenhar();
}
function preencherSelects() {
  selOrig.innerHTML = "";
  selDest.innerHTML = "";
  vertices.forEach(v => {
    selOrig.add(new Option(`v.id−{v.id} -v.id−{v.nome}`, v.id));
    selDest.add(new Option(`v.id−{v.id} -v.id−{v.nome}`, v.id));
  });
  if (vertices.length > 1) {
    selOrig.value = vertices[0].id;
    selDest.value = vertices[1].id;
  }
}

function desenharSeta(x1, y1, x2, y2, cor, tracejado) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  ctx.setLineDash(tracejado ? [6, 5] : []);
  ctx.stroke();
  ctx.setLineDash([]);

  const ang = Math.atan2(y2 - y1, x2 - x1);
  const tamanho = 10;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - tamanho * Math.cos(ang - Math.PI / 6), y2 - tamanho * Math.sin(ang - Math.PI / 6));
  ctx.lineTo(x2 - tamanho * Math.cos(ang + Math.PI / 6), y2 - tamanho * Math.sin(ang + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
}

function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  arestas.forEach(a => {
    const o = verticeById(a.origem_id);
    const d = verticeById(a.destino_id);
    if (!o || !d) return;

    const noCaminho = caminhoAtual.includes(a.origem_id) &&
                      caminhoAtual.includes(a.destino_id) &&
                      caminhoAtual.indexOf(a.origem_id) === caminhoAtual.indexOf(a.destino_id) - 1;

    let cor = "#7f8db0";
    if (a.bloqueada) cor = "#e05252";       
    else if (noCaminho) cor = "#2ecc71";     

    desenharSeta(o.pos_x, o.pos_y, d.pos_x, d.pos_y, cor, a.bloqueada);

    const mx = (o.pos_x + d.pos_x) / 2;
    const my = (o.pos_y + d.pos_y) / 2;
    ctx.font = "bold 12px sans-serif";
    const largura = ctx.measureText(a.peso).width + 8;
    ctx.fillStyle = "#161c2b";
    ctx.fillRect(mx - largura / 2, my - 9, largura, 16);
    ctx.fillStyle = cor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(a.peso, mx, my);
  });

  vertices.forEach(v => {
    const RAIO = 20;
    let cor = "#33405e";
    let borda = "#5c6f9e";
    if (caminhoAtual.includes(v.id)) { cor = "#2ecc71"; borda = "#a5f3c5"; }

    ctx.beginPath();
    ctx.arc(v.pos_x, v.pos_y, RAIO, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borda;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(v.id, v.pos_x, v.pos_y);
    ctx.fillStyle = "#c3cbe0";
    ctx.font = "11px sans-serif";
    ctx.fillText(v.nome, v.pos_x, v.pos_y + RAIO + 12);
  });
}

function animarRota(visitados, caminho, custo) {
  let i = 0;
  const timer = setInterval(() => {
    if (i >= visitados.length) {
      clearInterval(timer);
      caminhoAtual = caminho;
      custoAtual = custo;
      desenhar();
      resultado.textContent = `✅ Rota: caminho.join("→")∣Custototal:{caminho.join(" → ")} | Custo total:caminho.join("→")∣Custototal:{custo}`;
      return;
    }
    const vid = visitados[i++];
    const v = verticeById(vid);
    if (!v) continue;

    ctx.beginPath();
    ctx.arc(v.pos_x, v.pos_y, 24, 0, Math.PI * 2);
    ctx.fillStyle = "#f1c40f";
    ctx.fill();
    ctx.fillStyle = "#10141f";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(v.id, v.pos_x, v.pos_y);

    setTimeout(desenhar, 180); 
  }, 300);
}

btnRota.addEventListener("click", async () => {
  resultado.textContent = "Calculando...";
  try {
    const rota = await fetchJSON(
      API_URL(`/rota?origem={selOrig.value}&destino={selDest.value}`)
    );
    if (rota.caminho === null) {
      caminhoAtual = [];
      custoAtual = null;
      resultado.textContent = "❌ Não existe caminho válido (arestas bloqueadas?)";
      desenhar();
      return;
    }
    animarRota(rota.visitados, rota.caminho, rota.custo_total);
  } catch (e) {
    resultado.textContent = `Erro: ${e.message}`;
  }
});

btnLimpar.addEventListener("click", () => {
  caminhoAtual = [];
  custoAtual = null;
  resultado.textContent = "";
  desenhar();
});

function distancia(px, py, x, y) {
  return Math.hypot(px - x, py - y);
}

function pontoSobreAresta(mx, my, a) {
  const o = verticeById(a.origem_id);
  const d = verticeById(a.destino_id);
  if (!o || !d) return false;
  const dx = d.pos_x - o.pos_x, dy = d.pos_y - o.pos_y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return false;
  let t = ((mx - o.pos_x) * dx + (my - o.pos_y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return distancia(mx, my, o.pos_x + t * dx, o.pos_y + t * dy) < 8;
}

canvas.addEventListener("click", async (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const aresta = arestas.find(a => pontoSobreAresta(mx, my, a));
  if (aresta) {
    try {
      await fetchJSON(API_URL(`/arestas/${aresta.id}/bloquear`), { method: "PATCH" });
      await carregarGrafo();
    } catch (err) { alert(err.message); }
    return;
  }

  if (vertices.some(v => distancia(mx, my, v.pos_x, v.pos_y) < 25)) return;

  const nome = prompt("Nome do novo ponto:", `Ponto ${vertices.length + 1}`);
  if (!nome) return;
  try {
    await fetchJSON(API_URL("/vertices"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, pos_x: Math.round(mx), pos_y: Math.round(my) }),
    });
    await carregarGrafo();
  } catch (err) { alert(err.message); }
});

carregarGrafo();

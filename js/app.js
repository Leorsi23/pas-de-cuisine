// =====================================================================
//  Pas de Cuisine · telas
// =====================================================================
import { CONFIG, ATOS, MENUS, RECOMPENSAS, CATEGORIAS } from "./config.js";
import * as store from "./store.js";
import { escalar, temForno, normalizar } from "./receita.js";

// ---------------------------------------------------------------- utilidades
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const st = () => store.getState();
const ROMANOS = { brasil: "I", italia: "II", mundo: "III", final: "Fin" };
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dLabel = (iso) => { if (!iso) return ""; const [y, m, d] = iso.slice(0, 10).split("-"); return `${+d} ${MES[+m - 1]}`; };
const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
const view = () => $("#view");

function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 3000);
}
function busy(btn, on, txt) {
  if (!btn) return;
  if (on) { btn.dataset.txt = btn.innerHTML; btn.disabled = true; btn.innerHTML = esc(txt || "Salvando…"); }
  else { btn.disabled = false; if (btn.dataset.txt) btn.innerHTML = btn.dataset.txt; }
}
async function tentar(btn, fn, txt) {
  busy(btn, true, txt);
  try { await fn(); } catch (e) { toast(e.message || "Algo deu errado."); console.error(e); } finally { busy(btn, false); }
}

const I = {
  trilha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 20c2-6 5-9 7-9s3 2 2 4-4 2-4 0 3-7 9-11"/></svg>',
  caderno: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 3h11a2 2 0 012 2v16H8a2 2 0 01-2-2z"/><path d="M6 17a2 2 0 012-2h11M10 7h6M10 10h4"/></svg>',
  importar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  premios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 21c-4 0-6-3-6-6 3 0 5 1 6 3 1-2 3-3 6-3 0 3-2 6-6 6z"/><path d="M12 18V9M9 6a3 3 0 106 0c0-2-3-4-3-4s-3 2-3 4z"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>',
  heartOn: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M5 12v8h14v-8"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  timer: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// ---------------------------------------------------------------- regras da trilha
const avaliacoesDe = (preparoId) => st().avaliacoes.filter((a) => a.preparo_id === preparoId);
function media(preparoId) {
  const a = avaliacoesDe(preparoId);
  if (!a.length) return null;
  return a.reduce((s, x) => s + x.nota, 0) / a.length;
}
const fmtMedia = (m) => m == null ? "" : m.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ordemPreparo = (a, b) => (a.feito_em || "").localeCompare(b.feito_em || "") || (a.criado_em || "").localeCompare(b.criado_em || "");
const preparosDoMenu = (n) => Object.values(st().preparos).filter((p) => p.menu_id === n).sort(ordemPreparo);
const preparosDaReceita = (id) => Object.values(st().preparos).filter((p) => p.receita_id === id && !p.menu_id).sort(ordemPreparo);

// Um preparo da 3ª vez em diante "vale" quando tem avaliações suficientes e média >= nota mínima
function preparoAprovado(p) {
  const a = avaliacoesDe(p.id);
  return a.length >= CONFIG.minAvaliacoes && media(p.id) >= CONFIG.notaMinima;
}
function estadoMenu(n) {
  const ps = preparosDoMenu(n);
  const concluido = ps.length >= CONFIG.ensaios && ps.slice(CONFIG.ensaios - 1).some(preparoAprovado);
  return { ps, concluido };
}
function liberado(n) {
  if (n === 1) return true;
  return preparosDoMenu(n - 1).length > 0;
}
const totalMenus = () => Object.keys(MENUS).length;
const concluidos = () => Object.keys(MENUS).filter((n) => estadoMenu(+n).concluido).length;
const receitasDoPrato = (chave) => Object.values(st().receitas).filter((r) => (r.pratos || []).includes(chave));
function pratosDoMenu(n) {
  const m = MENUS[n];
  if (!m.livre) return m.pratos;
  return Object.values(st().receitas).filter((r) => (r.pratos || []).some((k) => k.startsWith(`${n}-`))).map((r) => [(r.pratos.find((k) => k.startsWith(`${n}-`))), r.titulo]);
}
const proximoMenu = () => Object.keys(MENUS).map(Number).find((n) => liberado(n) && !estadoMenu(n).concluido);

// ---------------------------------------------------------------- fotos assíncronas
async function hidratarFotos(root = document) {
  for (const img of $$("img[data-foto]", root)) {
    const url = await store.fotoUrl(img.dataset.foto);
    if (url) img.src = url;
  }
}
const fotoTag = (path, alt, cls = "") => path ? `<img class="${cls}" data-foto="${esc(path)}" alt="${esc(alt)}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">` : `<div class="${cls} semfoto" aria-label="Sem foto">${I.camera}</div>`;

// ---------------------------------------------------------------- navegação
const ROTAS = [
  [/^#\/trilha$/, telaTrilha, "trilha"],
  [/^#\/menu\/(\d+)$/, telaMenu, "trilha"],
  [/^#\/caderno$/, telaCaderno, "caderno"],
  [/^#\/receita\/([\w-]+)$/, telaReceita, "caderno"],
  [/^#\/cozinha\/([\w-]+)$/, telaCozinha, "caderno"],
  [/^#\/editar\/([\w-]+)$/, telaEditar, "caderno"],
  [/^#\/nova$/, telaEditar, "importar"],
  [/^#\/importar$/, telaImportar, "importar"],
  [/^#\/premios$/, telaPremios, "premios"],
];
const params = () => new URLSearchParams((location.hash.split("?")[1] || ""));
let wakeLock = null;

function nav(ativo) {
  const it = [["trilha", "Trilha"], ["caderno", "Caderno"], ["importar", "Importar"], ["premios", "Prêmios"]];
  $("#nav").innerHTML = it.map(([k, t]) => `<a href="#/${k}" class="${k === ativo ? "on" : ""}" ${k === ativo ? 'aria-current="page"' : ""}>${I[k]}<span>${t}</span></a>`).join("");
}

async function route() {
  if (wakeLock) { try { await wakeLock.release(); } catch (e) { /* ok */ } wakeLock = null; }
  clearInterval(window._tick);
  const h = location.hash.split("?")[0] || "#/trilha";
  const r = ROTAS.find(([re]) => re.test(h));
  if (!r) { location.hash = "#/trilha"; return; }
  const m = h.match(r[0]);
  document.body.classList.toggle("modo-cozinha", r[1] === telaCozinha);
  nav(r[2]);
  await r[1](m[1]);
  view().focus({ preventScroll: true });
  window.scrollTo(0, 0);
  hidratarFotos();
}

// ---------------------------------------------------------------- trilha
function pontos(n) {
  const { ps } = estadoMenu(n);
  return Array.from({ length: CONFIG.ensaios }, (_, i) => {
    const p = ps[i];
    const cls = !p ? "" : i === CONFIG.ensaios - 1 ? (ps.slice(i).some(preparoAprovado) ? "ok" : "feito") : "feito";
    return `<i class="pt ${cls}" aria-hidden="true"></i>`;
  }).join("");
}
function statusMenu(n) {
  if (!liberado(n)) return `${I.lock}<span>Abre depois do menu ${n - 1}</span>`;
  const { ps, concluido } = estadoMenu(n);
  if (concluido) return "Concluído";
  if (!ps.length) return "Para começar";
  if (ps.length < CONFIG.ensaios) return `${ps.length} de ${CONFIG.ensaios} vezes`;
  const ult = ps[ps.length - 1];
  const a = avaliacoesDe(ult.id);
  if (a.length < CONFIG.minAvaliacoes) return "Esperando as notas";
  return `Média ${fmtMedia(media(ult.id))}: falta ${CONFIG.notaMinima}`;
}

async function telaTrilha() {
  const c = concluidos();
  const prox = RECOMPENSAS.find((r) => c < r.alvo);
  const pm = proximoMenu();
  view().innerHTML = `
    <header class="capa">
      <p class="ola">Oi, ${esc(store.getNome() || "Alice")}</p>
      <h1>Pas de Cuisine</h1>
      <p class="sub">${c} de ${totalMenus()} menus concluídos${prox ? `. ${prox.alvo - c === 1 ? "Falta 1 menu" : `Faltam ${prox.alvo - c} menus`} para: ${esc(prox.titulo.toLowerCase())}.` : ". Trilha completa."}</p>
      ${pm ? `<a class="btn grande" href="#/menu/${pm}">Continuar: ${esc(MENUS[pm].nome)}</a>` : ""}
    </header>
    ${ATOS.map((ato) => `
      <section class="ato">
        <h2><span class="num">${ROMANOS[ato.id]}</span><span class="nome">${esc(ato.sub)}</span></h2>
        <ol class="programa">
          ${ato.menus.map((n) => {
            const lib = liberado(n), { concluido } = estadoMenu(n);
            return `<li class="${lib ? "" : "fechado"} ${concluido ? "concluido" : ""}">
              <a ${lib ? `href="#/menu/${n}"` : 'aria-disabled="true"'}>
                <span class="n">${n}</span>
                <span class="t"><strong>${esc(MENUS[n].nome)}</strong><small>${statusMenu(n)}</small></span>
                <span class="pts" title="${CONFIG.ensaios} vezes">${pontos(n)}</span>
              </a>
            </li>`;
          }).join("")}
        </ol>
      </section>`).join("")}
    <p class="rodape">${store.isDemo() ? 'Modo demonstração: nada aqui é salvo na nuvem. <button class="link" id="reset">Recomeçar a demonstração</button>' : `<button class="link" id="sair">Sair (${esc(store.getNome())})</button>`}</p>
  `;
  $("#reset")?.addEventListener("click", () => { localStorage.removeItem(store.DEMO_KEY); location.reload(); });
  $("#sair")?.addEventListener("click", async () => { await store.logout(); location.reload(); });
}

// ---------------------------------------------------------------- menu
function blocoPreparo(p, i, n) {
  const a = avaliacoesDe(p.id);
  const m = media(p.id);
  const nome = i < CONFIG.ensaios ? `${i + 1}ª vez` : `${i + 1}ª vez (extra)`;
  const conta = i >= CONFIG.ensaios - 1;
  return `<article class="preparo" id="p-${p.id}">
    ${fotoTag(p.foto, `Foto da ${nome}`, "foto")}
    <div class="info">
      <h4>${nome} <span class="data">${dLabel(p.feito_em)}</span></h4>
      ${m != null ? `<p class="nota">${I.star} <strong>${fmtMedia(m)}</strong> de 5, ${a.length} ${a.length === 1 ? "nota" : "notas"}${conta ? (preparoAprovado(p) ? ' <span class="tag ok">valeu</span>' : "") : ""}</p>` : `<p class="nota vazia">Sem notas ainda</p>`}
      ${conta && !preparoAprovado(p) && a.length < CONFIG.minAvaliacoes ? `<p class="dica">Para valer, precisa de ${CONFIG.minAvaliacoes} notas e média ${CONFIG.notaMinima} ou mais.</p>` : ""}
      ${p.anotacoes ? `<p class="anot">“${esc(p.anotacoes)}”</p>` : ""}
      <div class="acoes">
        <button class="btn sec" data-link="${p.id}">${I.share} Pedir notas</button>
        ${p.foto ? "" : `<label class="btn sec">${I.camera} Pôr foto<input type="file" accept="image/*" capture="environment" hidden data-foto-preparo="${p.id}"></label>`}
        ${store.isPai() ? `<button class="link perigo" data-apagar-preparo="${p.id}">Apagar</button>` : ""}
      </div>
      ${a.length ? `<details class="notas"><summary>O que melhorar</summary><ul>${a.map((x) => `<li><span class="estrelas" aria-label="${x.nota} de 5">${"★".repeat(x.nota)}<span>${"★".repeat(5 - x.nota)}</span></span> <strong>${esc(x.nome)}</strong>: ${esc(x.melhorar)}${store.isPai() ? ` <button class="link perigo" data-apagar-aval="${x.id}" aria-label="Apagar a nota de ${esc(x.nome)}">${I.x}</button>` : ""}</li>`).join("")}</ul></details>` : ""}
    </div>
  </article>`;
}

function formPreparo(n, ps, receitaId) {
  const prox = ps.length + 1;
  const ult = ps[ps.length - 1];
  const hoje = store.todayISO();
  const perto = ult && diasEntre(ult.feito_em, hoje) < 5;
  return `<form class="novo-preparo" id="form-preparo">
    <h3>${n ? `Registrar a ${prox}ª vez` : "Registrar um preparo"}</h3>
    ${perto ? `<p class="aviso">A última vez foi há ${diasEntre(ult.feito_em, hoje) || "menos de 1"} ${diasEntre(ult.feito_em, hoje) === 1 ? "dia" : "dias"}. Repetir com uns dias de intervalo ajuda a fixar a técnica.</p>` : ""}
    <label class="foto-campo"><input type="file" accept="image/*" capture="environment" name="foto" required><span class="ph">${I.camera}<span>Tirar a foto do prato</span></span><img alt="" hidden></label>
    <label>Quando<input type="date" name="data" value="${hoje}" max="${hoje}" required></label>
    <label>O que eu achei <span class="opc">(opcional)</span><textarea name="anot" rows="2" placeholder="O que deu certo, o que faria diferente"></textarea></label>
    <button class="btn grande" type="submit">Salvar e pedir notas</button>
    <input type="hidden" name="menu" value="${n || ""}"><input type="hidden" name="receita" value="${receitaId || ""}">
  </form>`;
}

function ligarFormPreparo(titulo) {
  const f = $("#form-preparo"); if (!f) return;
  const inp = f.foto, img = $("img", $(".foto-campo", f));
  inp.addEventListener("change", () => {
    const file = inp.files[0]; if (!file) return;
    img.src = URL.createObjectURL(file); img.hidden = false; $(".ph", f).hidden = true;
  });
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", f);
    tentar(btn, async () => {
      const id = await store.addPreparo({ menu_id: +f.menu.value || null, receita_id: f.receita.value || null, feito_em: f.data.value, anotacoes: f.anot.value.trim() }, inp.files[0]);
      await compartilhar(id, titulo);
      await route();
      document.getElementById(`p-${id}`)?.scrollIntoView({ block: "center" });
    }, "Enviando a foto…");
  });
}

async function compartilhar(preparoId, titulo) {
  const url = await store.linkAvaliacao(preparoId, titulo);
  const texto = `Fiz ${titulo}! Me dá uma nota e conta o que eu posso melhorar?`;
  if (navigator.share) {
    try { await navigator.share({ title: "Pas de Cuisine", text: texto, url }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(`${texto} ${url}`); toast("Link copiado. Cole no WhatsApp da família."); }
  catch (e) { prompt("Copie o link e mande para quem comeu:", url); }
}

function ligarPreparos(tituloDe) {
  $$("[data-link]").forEach((b) => b.addEventListener("click", () => tentar(b, () => compartilhar(b.dataset.link, tituloDe(b.dataset.link)), "Gerando o link…")));
  $$("[data-foto-preparo]").forEach((inp) => inp.addEventListener("change", () => {
    const f = inp.files[0]; if (!f) return;
    tentar(inp.closest("label"), async () => { await store.updatePreparo(inp.dataset.fotoPreparo, {}, f); await route(); }, "Enviando…");
  }));
  $$("[data-apagar-preparo]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Apagar este preparo, a foto e as notas dele?")) return;
    tentar(b, async () => { await store.deletePreparo(b.dataset.apagarPreparo); await route(); });
  }));
  $$("[data-apagar-aval]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Apagar esta nota?")) return;
    tentar(b, async () => { await store.apagarAvaliacao(b.dataset.apagarAval); await route(); });
  }));
}

async function telaMenu(nStr) {
  const n = +nStr, m = MENUS[n];
  if (!m) { location.hash = "#/trilha"; return; }
  if (!liberado(n)) { view().innerHTML = `<p class="vazio">Esse menu abre depois que você fizer o menu ${n - 1} pela primeira vez.</p><a class="btn" href="#/trilha">Voltar à trilha</a>`; return; }
  const { ps, concluido } = estadoMenu(n);
  const pratos = pratosDoMenu(n);
  const ato = ATOS.find((a) => a.menus.includes(n));
  const faltam = pratos.filter(([k]) => !receitasDoPrato(k).length).length;
  view().innerHTML = `
    <a class="voltar" href="#/trilha">${I.back} Trilha</a>
    <header class="cab-menu">
      <p class="ato-mini">${esc(ato.nome)}, ${esc(ato.sub)}</p>
      <h1>${n}. ${esc(m.nome)}</h1>
      ${concluido ? '<p class="selo">Menu concluído</p>' : ""}
      <ul class="tecnicas" aria-label="Técnicas">${m.tecnicas.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </header>

    <section class="bloco">
      <h2>Os pratos</h2>
      ${m.livre ? '<p class="dica">Este é o seu menu: escolha os pratos, planeje as compras e o horário de cada coisa.</p>' : ""}
      <ul class="pratos">
        ${pratos.map(([k, nome]) => {
          const rs = receitasDoPrato(k);
          return `<li>
            <span class="pn">${esc(nome)}</span>
            ${rs.length ? rs.map((r) => `<a class="rec" href="#/receita/${r.id}">${esc(r.titulo)}</a>`).join("") : `<span class="acoes-prato"><a class="btn mini" href="#/importar?prato=${encodeURIComponent(k)}">Importar receita</a><button class="btn mini sec" data-escolher="${esc(k)}">Do caderno</button></span>`}
          </li>`;
        }).join("") || '<li class="vazio">Nenhum prato ainda.</li>'}
      </ul>
      ${m.livre ? `<div class="linha"><a class="btn mini" href="#/importar?prato=${n}-novo">Importar um prato</a><button class="btn mini sec" data-escolher="${n}-novo">Do caderno</button></div>` : ""}
      ${faltam && !m.livre ? `<p class="dica">Pesquise na internet a receita de cada prato e importe aqui. ${faltam === 1 ? "Falta 1 prato." : `Faltam ${faltam} pratos.`}</p>` : ""}
    </section>

    <section class="bloco">
      <h2>As ${CONFIG.ensaios} vezes</h2>
      <p class="dica">Faça o menu completo ${CONFIG.ensaios} vezes, em semanas diferentes. Na ${CONFIG.ensaios}ª, se a média das notas for ${CONFIG.notaMinima} ou mais, o menu está concluído.</p>
      ${ps.length > 1 ? `<div class="evolucao" aria-label="Evolução do prato">${ps.map((p, i) => `<figure>${fotoTag(p.foto, `${i + 1}ª vez`, "foto")}<figcaption>${i + 1}ª ${media(p.id) != null ? `${I.star}${fmtMedia(media(p.id))}` : ""}</figcaption></figure>`).join("")}</div>` : ""}
      ${ps.map((p, i) => blocoPreparo(p, i, n)).join("")}
      ${concluido ? "" : formPreparo(n, ps)}
    </section>
    <dialog id="escolher"></dialog>
  `;
  const titulo = `o menu ${m.nome}`;
  ligarFormPreparo(titulo);
  ligarPreparos(() => titulo);
  $$("[data-escolher]").forEach((b) => b.addEventListener("click", () => escolherDoCaderno(b.dataset.escolher, n)));
}

function escolherDoCaderno(chave, n) {
  const d = $("#escolher");
  const lista = Object.values(st().receitas).sort((a, b) => a.titulo.localeCompare(b.titulo, "pt"));
  d.innerHTML = `<form method="dialog" class="dlg">
    <h3>Escolher do caderno</h3>
    <input type="search" placeholder="Buscar" aria-label="Buscar receita" class="busca">
    <ul class="lista-esc">${lista.map((r) => `<li><button value="${r.id}" class="item-esc">${esc(r.titulo)}<small>${esc(r.categoria)}</small></button></li>`).join("") || '<li class="vazio">O caderno está vazio.</li>'}</ul>
    <button value="" class="btn sec">Cancelar</button>
  </form>`;
  const busca = $(".busca", d);
  busca.addEventListener("input", () => { const q = norm(busca.value); $$(".lista-esc li", d).forEach((li) => { li.hidden = !norm(li.textContent).includes(q); }); });
  d.addEventListener("close", async () => {
    const id = d.returnValue; if (!id) return;
    const r = st().receitas[id];
    const k = chave.endsWith("-novo") ? `${n}-${id.slice(0, 8)}` : chave;
    await tentar(null, async () => { await store.saveReceita({ ...r, pratos: [...new Set([...(r.pratos || []), k])] }); await route(); });
  }, { once: true });
  d.showModal();
}
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ---------------------------------------------------------------- caderno
let filtro = { q: "", cat: "", fav: false };
async function telaCaderno() {
  const todas = Object.values(st().receitas);
  const cats = CATEGORIAS.filter((c) => todas.some((r) => r.categoria === c));
  view().innerHTML = `
    <header class="cab"><h1>Caderno</h1><p class="sub">${todas.length} ${todas.length === 1 ? "receita" : "receitas"}</p></header>
    <div class="filtros">
      <input type="search" id="q" placeholder="Buscar por nome ou ingrediente" value="${esc(filtro.q)}" aria-label="Buscar">
      <div class="chips" role="group" aria-label="Filtrar">
        <button class="chip ${filtro.fav ? "on" : ""}" data-fav aria-pressed="${filtro.fav}">${I.heart} Favoritas</button>
        ${cats.map((c) => `<button class="chip ${filtro.cat === c ? "on" : ""}" data-cat="${esc(c)}" aria-pressed="${filtro.cat === c}">${esc(c)}</button>`).join("")}
      </div>
    </div>
    <ul class="receitas" id="lista"></ul>
  `;
  const desenhar = () => {
    const q = norm(filtro.q);
    const rs = todas.filter((r) => (!filtro.cat || r.categoria === filtro.cat) && (!filtro.fav || r.favorita)
      && (!q || norm(r.titulo + " " + r.ingredientes.map((i) => i.item).join(" ")).includes(q)))
      .sort((a, b) => (b.favorita - a.favorita) || a.titulo.localeCompare(b.titulo, "pt"));
    $("#lista").innerHTML = rs.map((r) => {
      const ult = preparosDaReceita(r.id).concat(Object.values(st().preparos).filter((p) => p.menu_id && (r.pratos || []).some((k) => k.startsWith(p.menu_id + "-")))).sort(ordemPreparo).pop();
      return `<li><a href="#/receita/${r.id}">
        ${ult?.foto ? fotoTag(ult.foto, "", "mini-foto") : `<span class="mini-foto letra" aria-hidden="true">${esc(r.titulo[0] || "?")}</span>`}
        <span class="t"><strong>${esc(r.titulo)}</strong><small>${[r.categoria, r.tempo, (r.pratos || []).length ? "da trilha" : ""].filter(Boolean).map(esc).join(", ")}</small></span>
        ${r.favorita ? `<span class="fav" aria-label="Favorita">${I.heartOn}</span>` : ""}
      </a></li>`;
    }).join("") || `<li class="vazio">${todas.length ? "Nada encontrado com esse filtro." : 'O caderno está vazio. <a href="#/importar">Importe a primeira receita</a>.'}</li>`;
    hidratarFotos($("#lista"));
  };
  desenhar();
  $("#q").addEventListener("input", (e) => { filtro.q = e.target.value; desenhar(); });
  $("[data-fav]").addEventListener("click", (e) => { filtro.fav = !filtro.fav; telaCaderno().then(() => hidratarFotos()); });
  $$("[data-cat]").forEach((b) => b.addEventListener("click", () => { filtro.cat = filtro.cat === b.dataset.cat ? "" : b.dataset.cat; telaCaderno().then(() => hidratarFotos()); }));
}

// ---------------------------------------------------------------- receita
function listaIngredientes(r, fator, marcavel = false) {
  return `<ul class="ingredientes ${marcavel ? "marcavel" : ""}">${r.ingredientes.map((ing, i) => {
    const { texto, aviso } = escalar(ing, fator);
    const conteudo = `<span class="q">${esc(texto)}</span> <span class="it">${esc(ing.item)}</span>${aviso === "gosto" ? ' <span class="tag gosto">ajustar a gosto</span>' : aviso === "arredondado" ? ' <span class="tag">arredondado</span>' : ""}`;
    return marcavel ? `<li><label><input type="checkbox"> <span>${conteudo}</span></label></li>` : `<li>${conteudo}</li>`;
  }).join("")}</ul>`;
}
const porcoesKey = (id) => `pdc-porcoes-${id}`;
const getPorcoes = (r) => { try { return +sessionStorage.getItem(porcoesKey(r.id)) || r.porcoes; } catch (e) { return r.porcoes; } };
const setPorcoes = (r, v) => { try { sessionStorage.setItem(porcoesKey(r.id), v); } catch (e) { /* ok */ } };

async function telaReceita(id) {
  const r = st().receitas[id];
  if (!r) { view().innerHTML = '<p class="vazio">Receita não encontrada.</p><a class="btn" href="#/caderno">Voltar ao caderno</a>'; return; }
  let porcoes = getPorcoes(r);
  const ps = preparosDaReceita(id);
  const menus = [...new Set((r.pratos || []).map((k) => +k.split("-")[0]))].filter((n) => MENUS[n]);
  const titulo = r.titulo;
  view().innerHTML = `
    <a class="voltar" href="javascript:history.back()">${I.back} Voltar</a>
    <header class="cab-receita">
      <h1>${esc(r.titulo)}</h1>
      <p class="meta">${[r.categoria, r.tempo].filter(Boolean).map(esc).join(", ")}</p>
      ${menus.length ? `<p class="meta">Na trilha: ${menus.map((n) => `<a href="#/menu/${n}">menu ${n}, ${esc(MENUS[n].nome)}</a>`).join("; ")}</p>` : ""}
      <div class="linha">
        <a class="btn grande" href="#/cozinha/${id}">Cozinhar agora</a>
        <button class="icone ${r.favorita ? "on" : ""}" id="fav" aria-pressed="${r.favorita}" aria-label="Favorita">${r.favorita ? I.heartOn : I.heart}</button>
      </div>
    </header>

    <section class="bloco">
      <div class="porcoes" role="group" aria-label="Porções">
        <span>Para</span>
        <button class="pm" data-d="-1" aria-label="Menos uma pessoa">−</button>
        <output id="np">${porcoes}</output>
        <button class="pm" data-d="1" aria-label="Mais uma pessoa">+</button>
        <span>${porcoes === 1 ? "pessoa" : "pessoas"}</span>
      </div>
      <div id="avisos"></div>
      <h2>Ingredientes</h2>
      <div id="ings"></div>
    </section>

    <section class="bloco">
      <h2>Modo de preparo</h2>
      <ol class="passos">${r.passos.map((p) => `<li>${esc(p.texto)}${p.timer_min ? ` <span class="tag">${I.timer} ${p.timer_min} min</span>` : ""}</li>`).join("")}</ol>
      ${r.observacoes ? `<aside class="obs"><h3>Dicas</h3><p>${esc(r.observacoes)}</p></aside>` : ""}
      ${r.fonte ? `<p class="fonte">Fonte: ${/^https?:/.test(r.fonte) ? `<a href="${esc(r.fonte)}" target="_blank" rel="noopener">${esc(new URL(r.fonte).hostname.replace(/^www\./, ""))}</a>` : esc(r.fonte)}</p>` : ""}
    </section>

    ${menus.length ? "" : `<section class="bloco">
      <h2>Quando eu fiz</h2>
      ${ps.map((p, i) => blocoPreparo(p, i, null)).join("") || ""}
      ${formPreparo(null, ps, id)}
    </section>`}

    <p class="rodape"><a href="#/editar/${id}" class="link">Editar receita</a> <button class="link perigo" id="apagar">Apagar receita</button></p>
  `;
  const desenhar = () => {
    const fator = porcoes / r.porcoes;
    $("#np").textContent = porcoes;
    $(".porcoes span:last-child").textContent = porcoes === 1 ? "pessoa" : "pessoas";
    $("#ings").innerHTML = listaIngredientes(r, fator);
    const av = [];
    if (fator !== 1) {
      av.push(`Receita original para ${r.porcoes}. As quantidades foram recalculadas.`);
      if (r.ingredientes.some((i) => i.ajustar)) av.push("Sal, temperos e fermento não crescem na mesma proporção: comece com menos e prove.");
      if (temForno(r.passos)) av.push("Com outra quantidade, o tempo de forno muda. Confira pelo ponto, não só pelo relógio.");
      if (fator > 1.6) av.push("Veja se a panela comporta. Às vezes é melhor fazer em duas levas.");
    }
    $("#avisos").innerHTML = av.length ? `<ul class="avisos">${av.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
  };
  desenhar();
  $$(".pm").forEach((b) => b.addEventListener("click", () => { porcoes = Math.min(60, Math.max(1, porcoes + +b.dataset.d)); setPorcoes(r, porcoes); desenhar(); }));
  $("#fav").addEventListener("click", (e) => tentar(e.currentTarget, async () => { await store.toggleFavorita(id); await route(); }, "…"));
  $("#apagar").addEventListener("click", () => {
    if (!confirm(`Apagar "${r.titulo}" do caderno?`)) return;
    tentar(null, async () => { await store.deleteReceita(id); location.hash = "#/caderno"; });
  });
  ligarFormPreparo(titulo);
  ligarPreparos(() => titulo);
}

// ---------------------------------------------------------------- modo cozinha
async function telaCozinha(id) {
  const r = st().receitas[id];
  if (!r) { location.hash = "#/caderno"; return; }
  const fator = getPorcoes(r) / r.porcoes;
  let passo = 0;
  const timers = {}; // passo -> { fim, total }
  view().innerHTML = `
    <div class="cozinha">
      <header class="barra-cozinha">
        <a href="#/receita/${id}" class="icone" aria-label="Sair do modo cozinha">${I.x}</a>
        <strong>${esc(r.titulo)}</strong>
        <button class="btn mini sec" id="ver-ing" aria-expanded="false">Ingredientes</button>
      </header>
      <section class="painel-ing" id="painel-ing" hidden>
        <p class="dica">Para ${getPorcoes(r)} ${getPorcoes(r) === 1 ? "pessoa" : "pessoas"}. Marque o que já separou.</p>
        ${listaIngredientes(r, fator, true)}
      </section>
      <div class="palco" id="palco" aria-live="polite"></div>
      <div class="rodape-cozinha">
        <div id="timers" class="timers"></div>
        <nav class="passa">
          <button class="btn sec" id="ant">Anterior</button>
          <button class="btn" id="prox">Próximo</button>
        </nav>
      </div>
    </div>`;
  try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch (e) { /* sem wake lock */ }
  const total = r.passos.length;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const desenhar = () => {
    if (!total) { $("#palco").innerHTML = '<p class="vazio">Esta receita não tem passos. Edite para incluir.</p>'; return; }
    const p = r.passos[passo];
    $("#palco").innerHTML = `
      <p class="contador">Passo ${passo + 1} de ${total}</p>
      <p class="passo-txt">${esc(p.texto)}</p>
      ${p.timer_min && !timers[passo] ? `<button class="btn timer" id="iniciar">${I.timer} Marcar ${p.timer_min} min</button>` : ""}`;
    $("#iniciar")?.addEventListener("click", () => { timers[passo] = { fim: Date.now() + p.timer_min * 60000, rotulo: `Passo ${passo + 1}` }; desenhar(); tick(); });
    $("#ant").disabled = passo === 0;
    $("#prox").textContent = passo === total - 1 ? "Terminei" : "Próximo";
  };
  const tick = () => {
    const ativos = Object.entries(timers);
    $("#timers").innerHTML = ativos.map(([k, t]) => {
      const s = Math.max(0, Math.round((t.fim - Date.now()) / 1000));
      if (s === 0 && !t.tocou) { t.tocou = true; alarme(); }
      return `<div class="timer-on ${s === 0 ? "fim" : ""}"><span>${t.rotulo}</span><strong>${s === 0 ? "Pronto!" : fmt(s)}</strong><button class="icone" data-parar="${k}" aria-label="Parar">${I.x}</button></div>`;
    }).join("");
    $$("[data-parar]").forEach((b) => b.addEventListener("click", () => { delete timers[b.dataset.parar]; tick(); desenhar(); }));
  };
  clearInterval(window._tick);
  window._tick = setInterval(tick, 1000);
  $("#ant").addEventListener("click", () => { passo = Math.max(0, passo - 1); desenhar(); });
  $("#prox").addEventListener("click", () => {
    if (passo < total - 1) { passo++; desenhar(); return; }
    location.hash = `#/receita/${id}`;
    toast("Agora tire a foto do prato e peça as notas.");
  });
  $("#ver-ing").addEventListener("click", (e) => { const p = $("#painel-ing"); p.hidden = !p.hidden; e.currentTarget.setAttribute("aria-expanded", String(!p.hidden)); });
  desenhar();
}
let audioCtx = null;
function alarme() {
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch (e) { /* ok */ }
  try {
    audioCtx ||= new AudioContext();
    [0, 0.35, 0.7].forEach((t) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch (e) { /* sem som */ }
}

// ---------------------------------------------------------------- editar / nova
let rascunho = null; // receita vinda da importação
async function telaEditar(id) {
  const existente = id ? st().receitas[id] : null;
  if (id && !existente) { location.hash = "#/caderno"; return; }
  const base = existente || rascunho;
  if (!base) { location.hash = "#/importar"; return; }
  const r = { ...normalizar(base), ...(existente ? { id: existente.id, favorita: existente.favorita } : {}), pratos: base.pratos || [] };
  if (!r.ingredientes.length) r.ingredientes.push({ qtd: null, unidade: "", item: "", ajustar: false });
  if (!r.passos.length) r.passos.push({ texto: "", timer_min: null });
  const pratoDoRascunho = !existente && rascunho?.pratos?.[0];
  view().innerHTML = `
    <a class="voltar" href="javascript:history.back()">${I.back} Voltar</a>
    <header class="cab"><h1>${existente ? "Editar receita" : "Confira a receita"}</h1>${existente ? "" : '<p class="sub">A IA leu assim. Corrija o que estiver errado antes de salvar.</p>'}</header>
    <form id="ed" class="editor">
      <label>Nome<input name="titulo" value="${esc(r.titulo)}" required></label>
      <div class="duas">
        <label>Categoria<select name="categoria">${["", ...CATEGORIAS].map((c) => `<option ${c === r.categoria ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
        <label>Serve<input name="porcoes" type="number" min="1" max="100" inputmode="numeric" value="${r.porcoes}" required></label>
      </div>
      <label>Tempo<input name="tempo" value="${esc(r.tempo)}" placeholder="ex.: 1h20"></label>

      <fieldset><legend>Ingredientes</legend>
        <p class="dica">Marque "a gosto" no que não deve crescer na mesma proporção, como sal e temperos.</p>
        <div id="ings-ed">${r.ingredientes.map(linhaIng).join("")}</div>
        <button type="button" class="btn mini sec" id="add-ing">Mais um ingrediente</button>
      </fieldset>

      <fieldset><legend>Modo de preparo</legend>
        <div id="passos-ed">${r.passos.map(linhaPasso).join("")}</div>
        <button type="button" class="btn mini sec" id="add-passo">Mais um passo</button>
      </fieldset>

      <label>Dicas<textarea name="observacoes" rows="3">${esc(r.observacoes)}</textarea></label>
      <label>Fonte<input name="fonte" value="${esc(r.fonte)}" placeholder="Site, livro ou quem ensinou"></label>
      ${pratoDoRascunho ? `<p class="dica">Vai entrar no menu ${esc(pratoDoRascunho.split("-")[0])} da trilha.</p>` : ""}
      <button class="btn grande" type="submit">Salvar no caderno</button>
    </form>`;
  const add = (sel, html) => { $(sel).insertAdjacentHTML("beforeend", html); ligarRemover(); };
  const ligarRemover = () => $$("[data-rem]").forEach((b) => { b.onclick = () => { const p = b.closest(".lin"); if (p.parentElement.children.length > 1) p.remove(); }; });
  ligarRemover();
  $("#add-ing").addEventListener("click", () => add("#ings-ed", linhaIng({ qtd: null, unidade: "", item: "", ajustar: false })));
  $("#add-passo").addEventListener("click", () => add("#passos-ed", linhaPasso({ texto: "", timer_min: null })));
  $("#ed").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const ingredientes = $$("#ings-ed .lin").map((l) => ({ qtd: l.querySelector("[name=qtd]").value.replace(",", "."), unidade: l.querySelector("[name=un]").value, item: l.querySelector("[name=item]").value, ajustar: l.querySelector("[name=aj]").checked }));
    const passos = $$("#passos-ed .lin").map((l) => ({ texto: l.querySelector("[name=txt]").value, timer_min: l.querySelector("[name=min]").value.replace(",", ".") }));
    const dados = normalizar({ titulo: f.titulo.value, categoria: f.categoria.value, porcoes: f.porcoes.value, tempo: f.tempo.value, ingredientes, passos, observacoes: f.observacoes.value, fonte: f.fonte.value });
    tentar($("button[type=submit]", f), async () => {
      let pratos = r.pratos || [];
      const novoId = await store.saveReceita({ ...dados, id: r.id, favorita: r.favorita, pratos });
      // prato "livre" do menu final ganha uma chave própria
      if (pratos.some((k) => k.endsWith("-novo"))) {
        pratos = pratos.map((k) => k.endsWith("-novo") ? `${k.split("-")[0]}-${novoId.slice(0, 8)}` : k);
        await store.saveReceita({ ...dados, id: novoId, pratos });
      }
      rascunho = null;
      toast("Receita salva.");
      const menu = pratos[0] && !existente ? pratos[0].split("-")[0] : null;
      location.hash = menu ? `#/menu/${menu}` : `#/receita/${novoId}`;
    });
  });
}
const linhaIng = (i) => `<div class="lin ing">
  <input name="qtd" inputmode="decimal" value="${i.qtd ?? ""}" placeholder="Qtd" aria-label="Quantidade">
  <input name="un" value="${esc(i.unidade)}" placeholder="Unidade" aria-label="Unidade" list="unidades">
  <input name="item" value="${esc(i.item)}" placeholder="Ingrediente" aria-label="Ingrediente">
  <label class="aj"><input type="checkbox" name="aj" ${i.ajustar ? "checked" : ""}> a gosto</label>
  <button type="button" class="icone" data-rem aria-label="Tirar ingrediente">${I.x}</button>
</div>`;
const linhaPasso = (p) => `<div class="lin passo">
  <textarea name="txt" rows="3" aria-label="Passo">${esc(p.texto)}</textarea>
  <label class="min">Timer (min)<input name="min" inputmode="decimal" value="${p.timer_min ?? ""}" aria-label="Minutos do timer"></label>
  <button type="button" class="icone" data-rem aria-label="Tirar passo">${I.x}</button>
</div>`;

// ---------------------------------------------------------------- importar
async function telaImportar() {
  const prato = params().get("prato") || "";
  const n = prato ? +prato.split("-")[0] : null;
  const nomePrato = prato && MENUS[n] ? (MENUS[n].pratos.find(([k]) => k === prato)?.[1] || "") : "";
  view().innerHTML = `
    ${prato ? `<a class="voltar" href="#/menu/${n}">${I.back} Menu ${n}</a>` : ""}
    <header class="cab"><h1>Importar receita</h1>
      <p class="sub">${nomePrato ? `Para o prato ${esc(nomePrato.toLowerCase())}, do menu ${n}.` : prato ? `Para o menu ${n}.` : "Ache uma receita que você queira fazer e traga para o caderno."}</p></header>
    <div class="abas" role="tablist">
      ${[["foto", "Foto"], ["link", "Link"], ["arquivo", "Arquivo"], ["texto", "Texto"]].map(([k, t], i) => `<button role="tab" aria-selected="${i === 0}" data-aba="${k}">${t}</button>`).join("")}
    </div>
    <form id="imp" class="importar">
      <div data-p="foto">
        <p class="dica">Fotografe a receita de um livro ou tire print da tela. Pode ser mais de uma imagem, na ordem.</p>
        <label class="foto-campo"><input type="file" accept="image/*" multiple name="fotos"><span class="ph">${I.camera}<span>Escolher ou tirar fotos</span></span></label>
        <div class="previas" id="previas"></div>
      </div>
      <div data-p="link" hidden>
        <p class="dica">Copie o endereço da página da receita e cole aqui.</p>
        <input type="url" name="url" placeholder="https://" inputmode="url" aria-label="Link da receita">
      </div>
      <div data-p="arquivo" hidden>
        <p class="dica">Um PDF ou uma imagem que está no celular.</p>
        <input type="file" name="arquivo" accept="application/pdf,image/*" aria-label="Arquivo da receita">
      </div>
      <div data-p="texto" hidden>
        <textarea name="texto" rows="8" placeholder="Cole aqui o texto da receita" aria-label="Texto da receita"></textarea>
      </div>
      <button class="btn grande" type="submit">Ler a receita</button>
      <p class="dica fina">A leitura é feita por IA e leva uns 20 segundos. Depois você confere tudo antes de salvar.</p>
    </form>`;
  let aba = "foto";
  $$("[data-aba]").forEach((b) => b.addEventListener("click", () => {
    aba = b.dataset.aba;
    $$("[data-aba]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$("[data-p]").forEach((p) => { p.hidden = p.dataset.p !== aba; });
  }));
  const f = $("#imp");
  f.fotos.addEventListener("change", () => {
    $("#previas").innerHTML = [...f.fotos.files].slice(0, 5).map((x) => `<img src="${URL.createObjectURL(x)}" alt="">`).join("");
  });
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    let tipo, dados;
    if (aba === "foto") { if (!f.fotos.files.length) return toast("Escolha pelo menos uma foto."); tipo = "imagem"; dados = { files: [...f.fotos.files] }; }
    else if (aba === "link") { if (!/^https?:\/\/\S+\.\S+/.test(f.url.value.trim())) return toast("Cole um link que comece com https://"); tipo = "link"; dados = { url: f.url.value }; }
    else if (aba === "arquivo") { const a = f.arquivo.files[0]; if (!a) return toast("Escolha um arquivo."); tipo = a.type === "application/pdf" ? "pdf" : "imagem"; dados = { files: [a] }; }
    else { if (f.texto.value.trim().length < 30) return toast("Cole o texto completo da receita."); tipo = "texto"; dados = { texto: f.texto.value }; }
    tentar($("button[type=submit]", f), async () => {
      const r = await store.importar(tipo, dados);
      rascunho = { ...r, pratos: prato ? [prato] : [] };
      location.hash = "#/nova";
    }, "Lendo a receita…");
  });
}

// ---------------------------------------------------------------- prêmios
async function telaPremios() {
  const c = concluidos();
  const prox = RECOMPENSAS.find((r) => c < r.alvo);
  view().innerHTML = `
    <header class="cab"><h1>Prêmios</h1>
      <p class="sub">Um utensílio a cada 3 menus concluídos. ${prox ? `Você está em ${c} de ${prox.alvo} para o próximo.` : "Você ganhou todos."}</p></header>
    <ol class="premios">
      ${RECOMPENSAS.map((r) => {
        const ganho = c >= r.alvo, ent = st().recompensas[r.id];
        const pct = Math.min(100, Math.round((c / r.alvo) * 100));
        return `<li class="${ganho ? "ganho" : ""} ${ent ? "entregue" : ""}">
          <div class="pr-t"><strong>${esc(r.titulo)}</strong><small>${esc(r.desc)}</small></div>
          <div class="pr-s">
            ${ent ? `<span class="tag ok">Entregue em ${dLabel(ent.entregueEm)}</span>` : ganho ? '<span class="tag ok">Conquistado</span>' : `<span class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="${r.alvo}" aria-valuenow="${c}" aria-label="${c} de ${r.alvo} menus"><i style="width:${pct}%"></i></span><small>${r.alvo === totalMenus() ? "Trilha completa" : `${r.alvo} menus`}</small>`}
            ${store.isPai() && ganho && !ent ? `<button class="btn mini" data-entregar="${r.id}">Marcar como entregue</button>` : ""}
            ${store.isPai() && ent ? `<button class="link" data-desfazer="${r.id}">Desfazer</button>` : ""}
          </div>
        </li>`;
      }).join("")}
    </ol>
    <p class="dica">Um menu é concluído quando ele foi feito ${CONFIG.ensaios} vezes e a ${CONFIG.ensaios}ª recebeu pelo menos ${CONFIG.minAvaliacoes} notas com média ${CONFIG.notaMinima} ou mais. Se não der, faça mais uma vez: vale a melhor a partir da ${CONFIG.ensaios}ª.</p>
  `;
  $$("[data-entregar]").forEach((b) => b.addEventListener("click", () => tentar(b, async () => { await store.entregar(b.dataset.entregar); await route(); })));
  $$("[data-desfazer]").forEach((b) => b.addEventListener("click", () => tentar(b, async () => { await store.desfazerEntrega(b.dataset.desfazer); await route(); })));
}

// ---------------------------------------------------------------- login
function telaLogin(msg = "") {
  nav("");
  $("#nav").innerHTML = "";
  view().innerHTML = `
    <form class="login" id="login">
      <h1>Pas de Cuisine</h1>
      <p class="sub">O caderno de cozinha da Alice.</p>
      <label>E-mail<input type="email" name="email" autocomplete="username" required></label>
      <label>Senha<input type="password" name="senha" autocomplete="current-password" required></label>
      ${msg ? `<p class="erro" role="alert">${esc(msg)}</p>` : ""}
      <button class="btn grande" type="submit">Entrar</button>
    </form>`;
  $("#login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget, btn = $("button", f);
    busy(btn, true, "Entrando…");
    try { await store.login(f.email.value.trim(), f.senha.value); start(); }
    catch (err) { telaLogin(err.message); }
  });
}

// ---------------------------------------------------------------- partida
async function start() {
  window.removeEventListener("hashchange", route);
  window.addEventListener("hashchange", route);
  await route();
}

(async () => {
  try {
    const r = await store.init();
    if ("serviceWorker" in navigator && !store.isDemo()) navigator.serviceWorker.register("sw.js").catch(() => {});
    if (store.isDemo()) document.body.classList.add("demo");
    if (r === "login") return telaLogin();
    await start();
  } catch (e) {
    console.error(e);
    telaLogin(e.message);
  }
  // Quando ela volta ao app, busca as notas novas
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible" || store.isDemo()) return;
    if (document.body.classList.contains("modo-cozinha") || $("form:focus-within")) return;
    if (await store.refresh()) route();
  });
})();

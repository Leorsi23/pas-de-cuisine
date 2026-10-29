// =====================================================================
//  Pas de Cuisine · dados
//  Com o Supabase configurado, tudo fica na nuvem (login obrigatório).
//  Abrindo o app com ?demo no endereço, roda só no navegador, com dados
//  de mentira, para testar sem mexer em nada.
// =====================================================================
import { CONFIG } from "./config.js";

const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm";
export const DEMO_KEY = "pas-de-cuisine-demo-v1";

const empty = () => ({ receitas: {}, preparos: {}, avaliacoes: [], recompensas: {}, convites: {} });

let sb = null, user = null, role = "cozinheira", nome = "", demo = false;
let state = empty();

export const getState = () => state;
export const getRole = () => role;
export const getNome = () => nome;
export const isDemo = () => demo;
export const isPai = () => role === "pai";

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now() + Math.random().toString(16).slice(2));
const nowISO = () => new Date().toISOString();
export const todayISO = () => new Date().toLocaleDateString("sv-SE");

// ---------------------------------------------------------------- início
export async function init() {
  demo = new URLSearchParams(location.search).has("demo") || !CONFIG.supabaseUrl;
  if (demo) {
    role = new URLSearchParams(location.search).get("demo") === "pai" ? "pai" : "cozinheira";
    nome = role === "pai" ? "Leo" : "Alice";
    loadDemo();
    return "ok";
  }
  const { createClient } = await import(SUPABASE_ESM);
  sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  const { data } = await sb.auth.getSession();
  if (!data.session) return "login";
  user = data.session.user;
  await loadCloud();
  return "ok";
}

export async function login(email, senha) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error("E-mail ou senha não conferem.");
  user = data.user;
  await loadCloud();
}
export async function logout() { if (sb) await sb.auth.signOut(); user = null; }

// ---------------------------------------------------------------- nuvem
function fromRow(t, r) {
  if (t === "receitas") return { id: r.id, titulo: r.titulo, categoria: r.categoria || "", porcoes: r.porcoes, tempo: r.tempo || "", ingredientes: r.ingredientes || [], passos: r.passos || [], observacoes: r.observacoes || "", fonte: r.fonte || "", pratos: r.pratos || [], favorita: r.favorita, criada_em: r.criada_em, atualizada_em: r.atualizada_em };
  if (t === "preparos") return { id: r.id, menu_id: r.menu_id, receita_id: r.receita_id, feito_em: r.feito_em, foto: r.foto, anotacoes: r.anotacoes || "", criado_em: r.criado_em };
  return r;
}
async function loadCloud() {
  const [m, rc, pr, av, re, cv] = await Promise.all([
    sb.from("members").select("role, nome").eq("user_id", user.id).maybeSingle(),
    sb.from("receitas").select("*"),
    sb.from("preparos").select("*"),
    sb.from("avaliacoes").select("*").order("criada_em"),
    sb.from("recompensas").select("*"),
    sb.from("convites").select("token, preparo_id, expira_em"),
  ]);
  if (m.error || !m.data) throw new Error("Este usuário ainda não foi liberado no app. Peça ao pai para cadastrar.");
  role = m.data.role; nome = m.data.nome || "";
  const err = [rc, pr, av, re, cv].find((x) => x.error);
  if (err) throw new Error("Não consegui ler os dados: " + err.error.message);
  const next = empty();
  rc.data.forEach((r) => { next.receitas[r.id] = fromRow("receitas", r); });
  pr.data.forEach((r) => { next.preparos[r.id] = fromRow("preparos", r); });
  next.avaliacoes = av.data;
  re.data.forEach((r) => { next.recompensas[r.id] = { entregueEm: r.entregue_em }; });
  cv.data.forEach((r) => { next.convites[r.token] = r; });
  state = next;
}

export async function refresh() {
  if (demo) { loadDemo(); return true; }
  if (!user) return false;
  const before = JSON.stringify(state);
  try { await loadCloud(); } catch (e) { return false; }
  return JSON.stringify(state) !== before;
}

function check(res, msg) {
  if (res.error) { console.warn(res.error); throw new Error(msg || "Não consegui salvar. Confira a internet e tente de novo."); }
  return res.data;
}

// ---------------------------------------------------------------- demo
function loadDemo() {
  let v = null;
  try { v = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { /* sem armazenamento */ }
  state = v && typeof v === "object" ? Object.assign(empty(), v) : seedDemo();
  saveDemo();
}
function saveDemo() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ } }
function seedDemo() {
  const s = empty();
  const arroz = { id: uuid(), titulo: "Arroz branco soltinho", categoria: "Acompanhamento", porcoes: 4, tempo: "30 min",
    ingredientes: [
      { qtd: 2, unidade: "xícara", item: "arroz agulhinha", ajustar: false },
      { qtd: 4, unidade: "xícara", item: "água fervente", ajustar: false },
      { qtd: 2, unidade: "colher de sopa", item: "óleo", ajustar: false },
      { qtd: 0.5, unidade: "unidade", item: "cebola pequena picada", ajustar: false },
      { qtd: 2, unidade: "dente", item: "alho amassado", ajustar: false },
      { qtd: 1, unidade: "colher de chá", item: "sal", ajustar: true },
    ],
    passos: [
      { texto: "Lave o arroz em uma peneira até a água sair quase limpa. Deixe escorrer bem.", timer_min: null },
      { texto: "Aqueça o óleo em fogo médio e refogue a cebola até ficar transparente. Junte o alho e mexa por 30 segundos.", timer_min: 3 },
      { texto: "Junte o arroz e o sal e mexa até os grãos ficarem soltos e brilhantes.", timer_min: 2 },
      { texto: "Despeje a água fervente, tampe deixando uma fresta e cozinhe em fogo baixo até a água secar.", timer_min: 15 },
      { texto: "Desligue, tampe totalmente e deixe descansar antes de soltar com um garfo.", timer_min: 5 },
    ],
    observacoes: "A água tem que estar fervendo quando entra: é o que deixa o grão soltinho.", fonte: "", pratos: ["1-arroz"], favorita: true, criada_em: nowISO(), atualizada_em: nowISO() };
  const feijao = { id: uuid(), titulo: "Feijão carioca na pressão", categoria: "Acompanhamento", porcoes: 6, tempo: "1h (+ remolho)",
    ingredientes: [
      { qtd: 500, unidade: "g", item: "feijão carioca", ajustar: false },
      { qtd: 1.5, unidade: "l", item: "água", ajustar: false },
      { qtd: 2, unidade: "unidade", item: "folhas de louro", ajustar: true },
      { qtd: 1, unidade: "unidade", item: "cebola picada", ajustar: false },
      { qtd: 3, unidade: "dente", item: "alho picado", ajustar: false },
      { qtd: 2, unidade: "colher de sopa", item: "azeite", ajustar: false },
      { qtd: null, unidade: "", item: "sal a gosto", ajustar: true },
    ],
    passos: [
      { texto: "Deixe o feijão de molho na água por 8 horas. Descarte essa água.", timer_min: null },
      { texto: "Coloque o feijão, a água nova e o louro na panela de pressão. Conte o tempo depois que pegar pressão.", timer_min: 25 },
      { texto: "Desligue e espere a pressão sair sozinha. Nunca abra à força.", timer_min: 10 },
      { texto: "Refogue a cebola e o alho no azeite, junte duas conchas de feijão, amasse e devolva à panela.", timer_min: null },
      { texto: "Acerte o sal e deixe engrossar em fogo baixo, sem tampa.", timer_min: 10 },
    ],
    observacoes: "", fonte: "", pratos: ["1-feijao"], favorita: false, criada_em: nowISO(), atualizada_em: nowISO() };
  const bolo = { id: uuid(), titulo: "Bolo de fubá da vó", categoria: "Doce", porcoes: 10, tempo: "50 min",
    ingredientes: [
      { qtd: 3, unidade: "unidade", item: "ovos", ajustar: false },
      { qtd: 1, unidade: "xícara", item: "fubá", ajustar: false },
      { qtd: 1, unidade: "xícara", item: "farinha de trigo", ajustar: false },
      { qtd: 1.5, unidade: "xícara", item: "açúcar", ajustar: false },
      { qtd: 1, unidade: "colher de sopa", item: "fermento em pó", ajustar: true },
    ],
    passos: [{ texto: "Bata tudo, menos o fermento, no liquidificador. Misture o fermento à mão.", timer_min: null }, { texto: "Asse em forno a 180 °C.", timer_min: 40 }],
    observacoes: "", fonte: "", pratos: [], favorita: false, criada_em: nowISO(), atualizada_em: nowISO() };
  [arroz, feijao, bolo].forEach((r) => { s.receitas[r.id] = r; });
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toLocaleDateString("sv-SE"); };
  const p1 = { id: uuid(), menu_id: 1, receita_id: null, feito_em: d(14), foto: demoFoto("#e9c46a"), anotacoes: "O bife soltou água. Da próxima vez, frigideira mais quente.", criado_em: nowISO() };
  const p2 = { id: uuid(), menu_id: 1, receita_id: null, feito_em: d(5), foto: demoFoto("#d9a441"), anotacoes: "", criado_em: nowISO() };
  s.preparos[p1.id] = p1; s.preparos[p2.id] = p2;
  s.avaliacoes.push(
    { id: uuid(), preparo_id: p1.id, nome: "Leo", nota: 4, melhorar: "O bife podia estar mais selado.", criada_em: nowISO() },
    { id: uuid(), preparo_id: p1.id, nome: "Annelise", nota: 3, melhorar: "Feijão um pouco ralo.", criada_em: nowISO() },
    { id: uuid(), preparo_id: p2.id, nome: "Leo", nota: 4, melhorar: "Couve cortada mais fina ainda.", criada_em: nowISO() },
  );
  return s;
}
// Foto de mentira para o modo demonstração
function demoFoto(cor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3ead8"/><circle cx="200" cy="150" r="120" fill="#fff"/><circle cx="200" cy="150" r="96" fill="${cor}"/><circle cx="170" cy="130" r="22" fill="#5a3e2b" opacity=".7"/><circle cx="232" cy="168" r="28" fill="#3f7d3a" opacity=".7"/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// ---------------------------------------------------------------- receitas
const RECEITA_COLS = ["titulo", "categoria", "porcoes", "tempo", "ingredientes", "passos", "observacoes", "fonte", "pratos", "favorita"];
export async function saveReceita(r) {
  const row = {};
  RECEITA_COLS.forEach((k) => { row[k] = r[k] ?? null; });
  row.porcoes = Math.max(1, Math.round(+row.porcoes || 4));
  row.favorita = Boolean(row.favorita);
  row.pratos = Array.isArray(row.pratos) ? row.pratos : [];
  row.atualizada_em = nowISO();
  if (demo) {
    const id = r.id || uuid();
    state.receitas[id] = { ...(state.receitas[id] || { criada_em: nowISO() }), ...row, id };
    saveDemo();
    return id;
  }
  if (r.id) {
    const data = check(await sb.from("receitas").update(row).eq("id", r.id).select().single());
    state.receitas[data.id] = fromRow("receitas", data);
    return data.id;
  }
  const data = check(await sb.from("receitas").insert(row).select().single());
  state.receitas[data.id] = fromRow("receitas", data);
  return data.id;
}
export async function deleteReceita(id) {
  if (!demo) check(await sb.from("receitas").delete().eq("id", id), "Não consegui apagar.");
  delete state.receitas[id];
  if (demo) saveDemo();
}
export async function toggleFavorita(id) {
  const r = state.receitas[id]; if (!r) return;
  await saveReceita({ ...r, favorita: !r.favorita });
}

// ---------------------------------------------------------------- fotos
// Reduz a foto no próprio celular antes de enviar (máx. 1600 px, JPEG).
export async function shrink(file, max = 1600, q = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error("Não consegui abrir essa imagem.")); i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob(ok, "image/jpeg", q));
  } finally { URL.revokeObjectURL(url); }
}
const blobToDataUrl = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });

async function uploadFoto(file) {
  const blob = await shrink(file);
  if (demo) return await blobToDataUrl(blob);
  const path = `${todayISO()}-${uuid()}.jpg`;
  const { error } = await sb.storage.from("pratos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error("Não consegui enviar a foto. Confira a internet e tente de novo.");
  return path;
}

const urlCache = {};
export async function fotoUrl(path, segundos = 3600) {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  const hit = urlCache[path];
  if (hit && hit.exp > Date.now() && segundos <= 3600) return hit.url;
  if (!sb) return "";
  const { data, error } = await sb.storage.from("pratos").createSignedUrl(path, segundos);
  if (error || !data) return "";
  if (segundos <= 3600) urlCache[path] = { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 };
  return data.signedUrl;
}

// ---------------------------------------------------------------- preparos
export async function addPreparo({ menu_id = null, receita_id = null, feito_em, anotacoes = "" }, file) {
  const foto = file ? await uploadFoto(file) : null;
  const row = { menu_id, receita_id, feito_em: feito_em || todayISO(), foto, anotacoes };
  if (demo) {
    const id = uuid();
    state.preparos[id] = { ...row, id, criado_em: nowISO() };
    saveDemo();
    return id;
  }
  const data = check(await sb.from("preparos").insert(row).select().single());
  state.preparos[data.id] = fromRow("preparos", data);
  return data.id;
}
export async function updatePreparo(id, patch, file) {
  const cur = state.preparos[id]; if (!cur) return;
  const next = { ...patch };
  if (file) next.foto = await uploadFoto(file);
  if (demo) { state.preparos[id] = { ...cur, ...next }; saveDemo(); return; }
  const data = check(await sb.from("preparos").update(next).eq("id", id).select().single());
  state.preparos[id] = fromRow("preparos", data);
}
export async function deletePreparo(id) {
  if (!demo) check(await sb.from("preparos").delete().eq("id", id), "Não consegui apagar.");
  delete state.preparos[id];
  state.avaliacoes = state.avaliacoes.filter((a) => a.preparo_id !== id);
  if (demo) saveDemo();
}

// ---------------------------------------------------------------- avaliação
function token() {
  const b = new Uint8Array(18); crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
// Cria (ou reaproveita) o link de avaliação de um preparo. Devolve o endereço.
export async function linkAvaliacao(preparoId, titulo) {
  const p = state.preparos[preparoId];
  const base = location.href.split(/[?#]/)[0].replace(/[^/]*$/, "") + "avaliar.html";
  const vivo = Object.values(state.convites).find((c) => c.preparo_id === preparoId && new Date(c.expira_em) > new Date(Date.now() + 864e5));
  if (vivo) return `${base}${demo ? "?demo" : ""}#t=${vivo.token}`;
  const t = token();
  const expira = new Date(Date.now() + CONFIG.diasDoLink * 864e5).toISOString();
  const foto_url = await fotoUrl(p.foto, CONFIG.diasDoLink * 86400);
  const row = { token: t, preparo_id: preparoId, titulo, foto_url, expira_em: expira };
  if (demo) { state.convites[t] = row; saveDemo(); }
  else { check(await sb.from("convites").insert(row)); state.convites[t] = { token: t, preparo_id: preparoId, expira_em: expira }; }
  return `${base}${demo ? "?demo" : ""}#t=${t}`;
}
export async function apagarAvaliacao(id) {
  if (!demo) check(await sb.from("avaliacoes").delete().eq("id", id), "Não consegui apagar.");
  state.avaliacoes = state.avaliacoes.filter((a) => a.id !== id);
  if (demo) saveDemo();
}

// ---------------------------------------------------------------- recompensas
export async function entregar(id) {
  const entregueEm = nowISO();
  if (!demo) check(await sb.from("recompensas").insert({ id, entregue_em: entregueEm }));
  state.recompensas[id] = { entregueEm };
  if (demo) saveDemo();
}
export async function desfazerEntrega(id) {
  if (!demo) check(await sb.from("recompensas").delete().eq("id", id));
  delete state.recompensas[id];
  if (demo) saveDemo();
}

// ---------------------------------------------------------------- importação com IA
const fileToBase64 = async (blob) => (await blobToDataUrl(blob)).split(",")[1];

// tipo: "imagem" (files[]), "pdf" (file), "link" (url), "texto" (texto)
export async function importar(tipo, { files = [], url = "", texto = "" } = {}) {
  const body = { tipo };
  if (tipo === "imagem") {
    body.imagens = [];
    for (const f of files.slice(0, 5)) body.imagens.push({ tipo: "image/jpeg", dados: await fileToBase64(await shrink(f, 1800, 0.85)) });
  } else if (tipo === "pdf") {
    const f = files[0];
    if (!f) throw new Error("Escolha um arquivo.");
    if (f.size > 8 * 1024 * 1024) throw new Error("O PDF passa de 8 MB. Mande só as páginas da receita.");
    body.pdf = await fileToBase64(f);
  } else if (tipo === "link") body.url = url.trim();
  else body.texto = texto;

  if (demo) {
    await new Promise((ok) => setTimeout(ok, 900));
    return { titulo: "Bruschetta de tomate (exemplo)", categoria: "Entrada", porcoes: 4, tempo: "20 min", fonte: url || "",
      ingredientes: [
        { qtd: 8, unidade: "fatia", item: "pão italiano", ajustar: false },
        { qtd: 4, unidade: "unidade", item: "tomates maduros sem sementes, em cubinhos", ajustar: false },
        { qtd: 1, unidade: "dente", item: "alho", ajustar: false },
        { qtd: 3, unidade: "colher de sopa", item: "azeite", ajustar: false },
        { qtd: null, unidade: "", item: "manjericão fresco", ajustar: true },
        { qtd: null, unidade: "", item: "sal e pimenta a gosto", ajustar: true },
      ],
      passos: [
        { texto: "Misture o tomate, o azeite, o manjericão rasgado, sal e pimenta. Deixe descansar.", timer_min: 10 },
        { texto: "Toste as fatias de pão no forno ou na frigideira até dourar.", timer_min: 5 },
        { texto: "Esfregue o alho cortado ao meio no pão ainda quente e cubra com o tomate.", timer_min: null },
      ],
      observacoes: "Modo demonstração: esta receita é de exemplo, a IA não foi chamada." };
  }
  const { data: s } = await sb.auth.getSession();
  if (!s.session) throw new Error("Entre no app de novo.");
  let r;
  try {
    r = await fetch(`${CONFIG.supabaseUrl}/functions/v1/importar-receita`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session.access_token}`, apikey: CONFIG.supabaseAnonKey },
      body: JSON.stringify(body),
    });
  } catch (e) { throw new Error("Sem conexão com a internet."); }
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.receita) throw new Error(out.erro || "A importação falhou. Tente de novo.");
  return out.receita;
}

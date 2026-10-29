// =====================================================================
//  Pas de Cuisine · contas da receita: porções, frações, avisos
// =====================================================================

// Unidades que se contam (não dá para usar 1,3 ovo)
const CONTAVEIS = /^(|un|und|unid|unidade|unidades|dente|dentes|folha|folhas|fatia|fatias|ovo|ovos|maço|maços|ramo|ramos|lata|latas|pacote|pacotes|vidro|vidros|caixa|caixinha|tablete|envelope|sachê|pé|pés|talo|talos|cabeça|cabeças)$/i;
const MASSA_VOLUME = /^(g|kg|ml|l|gramas?|quilos?|litros?|mililitros?)$/i;

const FRACOES = [[0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.667, "⅔"], [0.75, "¾"]];

function fracao(n) {
  const inteiro = Math.floor(n + 1e-9);
  const resto = n - inteiro;
  if (resto < 0.06) return String(inteiro);
  if (resto > 0.94) return String(inteiro + 1);
  let melhor = null, dist = 1;
  FRACOES.forEach(([v, s]) => { if (Math.abs(resto - v) < dist) { dist = Math.abs(resto - v); melhor = s; } });
  if (dist <= 0.06) return (inteiro ? inteiro + " " : "") + melhor;
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

// Escala um ingrediente. Devolve { texto, aviso } onde aviso pode ser
// "gosto" (não cresce na mesma proporção) ou "arredondado".
export function escalar(ing, fator) {
  if (ing.qtd == null || ing.qtd === "" || isNaN(+ing.qtd)) return { texto: "", aviso: fator !== 1 && ing.ajustar ? "gosto" : "" };
  const base = +ing.qtd;
  let q = base * fator;
  let aviso = "";
  const un = (ing.unidade || "").trim();
  if (fator !== 1 && ing.ajustar) aviso = "gosto";
  if (CONTAVEIS.test(un) && fator !== 1) {
    const inteiro = /\bovos?\b|\bgemas?\b|\bclaras?\b/i.test(ing.item) || /^(ovo|ovos|dente|dentes|lata|latas|pacote|pacotes|vidro|vidros|caixa|caixinha|envelope|sachê|tablete)$/i.test(un);
    const arred = inteiro ? Math.max(1, Math.round(q)) : q < 3 ? Math.max(0.5, Math.round(q * 2) / 2) : Math.round(q);
    if (Math.abs(arred - q) > 0.05) { aviso = aviso || "arredondado"; }
    q = arred;
  }
  let texto;
  if (MASSA_VOLUME.test(un)) {
    if (/^g|gramas?$/i.test(un) && q >= 1000) texto = (q / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " kg";
    else if (/^ml|mililitros?$/i.test(un) && q >= 1000) texto = (q / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " l";
    else {
      const r = q >= 100 ? Math.round(q / 5) * 5 : q >= 10 ? Math.round(q) : Math.round(q * 10) / 10;
      texto = r.toLocaleString("pt-BR") + " " + un;
    }
  } else {
    const mostra = un && !/^(un|und|unid|unidades?)$/i.test(un);
    texto = fracao(q) + (mostra ? " " + plural(un, q) : "");
  }
  return { texto, aviso };
}

function plural(un, q) {
  if (q <= 1) return un;
  const p = { "xícara": "xícaras", "colher de sopa": "colheres de sopa", "colher de chá": "colheres de chá", "colher de café": "colheres de café", "dente": "dentes", "unidade": "unidades", "folha": "folhas", "fatia": "fatias", "lata": "latas", "pitada": "pitadas", "maço": "maços", "copo": "copos", "concha": "conchas", "ramo": "ramos", "pacote": "pacotes" };
  return p[un.toLowerCase()] || un;
}

// O passo fala de forno?
export const temForno = (passos) => passos.some((p) => /forno|assar|asse |assad/i.test(p.texto || ""));

// Normaliza o que vem da IA ou do formulário
export function normalizar(r) {
  const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
  return {
    titulo: String(r.titulo || "").trim() || "Receita sem nome",
    categoria: r.categoria || "",
    porcoes: Math.max(1, Math.round(+r.porcoes || 4)),
    tempo: r.tempo || "",
    ingredientes: (r.ingredientes || []).filter((i) => String(i.item || "").trim()).map((i) => ({ qtd: num(i.qtd), unidade: String(i.unidade || "").trim(), item: String(i.item).trim(), ajustar: Boolean(i.ajustar) })),
    passos: (r.passos || []).filter((p) => String(p.texto || "").trim()).map((p) => ({ texto: String(p.texto).trim(), timer_min: num(p.timer_min) })),
    observacoes: r.observacoes || "",
    fonte: r.fonte || "",
  };
}

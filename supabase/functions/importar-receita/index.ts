// =====================================================================
//  Pas de Cuisine · importar-receita
//  Recebe uma foto, um PDF, um link ou um texto e devolve a receita
//  num formato padrão. A chave da Anthropic fica SÓ aqui, como segredo
//  do Supabase (ANTHROPIC_API_KEY). O site nunca a vê.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const MODELO = "claude-sonnet-5-5";   // troque aqui se quiser outro modelo
const LIMITE_DIARIO = 25;             // importações por pessoa por dia

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function chaveSecreta(): string {
  const legado = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legado) return legado;
  try {
    const todas = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return todas.default || Object.values(todas)[0] as string || "";
  } catch { return ""; }
}

const FERRAMENTA = {
  name: "salvar_receita",
  description: "Registra a receita extraída, no formato padrão do caderno.",
  input_schema: {
    type: "object",
    properties: {
      encontrou: { type: "boolean", description: "false se o material não contém uma receita" },
      titulo: { type: "string" },
      categoria: { type: "string", description: "Uma de: Entrada, Prato principal, Acompanhamento, Massa, Sopa, Salada, Pão, Molho, Doce, Bebida, Outro" },
      porcoes: { type: "integer", description: "Quantas pessoas serve. Se não disser, estime." },
      tempo: { type: "string", description: "Tempo total aproximado, ex.: '1h20'" },
      ingredientes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            qtd: { type: "number", description: "Número decimal (0.5 para meia). Omita quando não há quantidade (a gosto)." },
            unidade: { type: "string", description: "g, kg, ml, l, xícara, colher de sopa, colher de chá, unidade, dente, maço, pitada, lata... vazio se for só contagem" },
            item: { type: "string", description: "O ingrediente, com o preparo se houver: 'cebola média picada'" },
            ajustar: { type: "boolean", description: "true para sal, pimenta, temperos, ervas, fermento, bicarbonato, açúcar de tempero e tudo 'a gosto': não escalam na mesma proporção" },
          },
          required: ["unidade", "item", "ajustar"],
        },
      },
      passos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            texto: { type: "string", description: "Um passo, claro e completo" },
            timer_min: { type: "number", description: "Minutos de espera/cozimento deste passo. Omita se não houver." },
          },
          required: ["texto"],
        },
      },
      observacoes: { type: "string", description: "Dicas importantes da receita original. Vazio se não houver." },
    },
    required: ["encontrou", "titulo", "categoria", "porcoes", "tempo", "ingredientes", "passos", "observacoes"],
  },
};

const INSTRUCOES = `Você extrai receitas para o caderno de uma estudante brasileira que está aprendendo a cozinhar.
- Escreva tudo em português do Brasil, mesmo que a receita esteja em outra língua. Converta medidas americanas (cups, oz, °F) para as brasileiras (xícara, g, ml, °C).
- Separe cada ingrediente com quantidade numérica (1/2 vira 0.5), unidade e item.
- Divida o modo de preparo em passos curtos e numeráveis, na ordem. Não invente passos nem ingredientes que não estão no material.
- Se um passo tem tempo de forno ou de cozimento, coloque os minutos em timer_min.
- Ignore propaganda, comentários de leitores e histórias pessoais do blog.
- Se o material não tiver receita, use encontrou=false e deixe o resto vazio.
- Responda SEMPRE chamando a ferramenta salvar_receita, uma única vez, sem escrever mais nada.`;

function htmlParaTexto(html: string): string {
  // Primeiro tenta os dados estruturados que quase todo site de receita tem (JSON-LD "Recipe").
  const ld: string[] = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/recipe/i.test(m[1])) ld.push(m[1].trim());
  }
  const texto = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  return (ld.length ? "DADOS ESTRUTURADOS DA PÁGINA:\n" + ld.join("\n").slice(0, 30000) + "\n\nTEXTO DA PÁGINA:\n" : "") + texto.slice(0, 40000);
}

async function baixarPagina(url: string): Promise<string> {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error("Esse link não parece válido."); }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Use um link que comece com http.");
  const r = await fetch(u, {
    headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`O site não abriu (erro ${r.status}). Tente tirar print da receita e importar como foto.`);
  return htmlParaTexto(await r.text());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Use POST." }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ erro: "A chave da Anthropic ainda não foi cadastrada no Supabase." }, 500);

  // 1. Quem está pedindo? Precisa estar logado e cadastrado no app.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, chaveSecreta(), { auth: { persistSession: false } });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u, error: eu } = await admin.auth.getUser(jwt);
  if (eu || !u?.user) return json({ erro: "Entre no app de novo." }, 401);
  const { data: m } = await admin.from("members").select("role").eq("user_id", u.user.id).maybeSingle();
  if (!m) return json({ erro: "Usuário não liberado no app." }, 403);

  // 2. Limite diário
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin.from("importacoes").select("id", { count: "exact", head: true })
    .eq("user_id", u.user.id).gte("criada_em", desde);
  if ((count || 0) >= LIMITE_DIARIO) return json({ erro: `Limite de ${LIMITE_DIARIO} importações em 24 horas. Amanhã libera de novo.` }, 429);

  // 3. Monta o pedido para a IA
  let corpo: { tipo?: string; imagens?: { tipo: string; dados: string }[]; pdf?: string; texto?: string; url?: string };
  try { corpo = await req.json(); } catch { return json({ erro: "Pedido inválido." }, 400); }

  const conteudo: unknown[] = [];
  try {
    if (corpo.tipo === "imagem" && corpo.imagens?.length) {
      for (const im of corpo.imagens.slice(0, 5)) {
        if (!/^image\/(jpeg|png|webp|gif)$/.test(im.tipo)) return json({ erro: "Formato de imagem não aceito." }, 400);
        conteudo.push({ type: "image", source: { type: "base64", media_type: im.tipo, data: im.dados } });
      }
      conteudo.push({ type: "text", text: corpo.imagens.length > 1 ? "As imagens são partes da mesma receita, em ordem." : "Extraia a receita desta imagem." });
    } else if (corpo.tipo === "pdf" && corpo.pdf) {
      conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: corpo.pdf } });
      conteudo.push({ type: "text", text: "Extraia a receita deste arquivo. Se houver várias, pegue a principal." });
    } else if (corpo.tipo === "link" && corpo.url) {
      const pagina = await baixarPagina(corpo.url);
      conteudo.push({ type: "text", text: `Página ${corpo.url}:\n\n${pagina}` });
    } else if (corpo.tipo === "texto" && corpo.texto) {
      conteudo.push({ type: "text", text: corpo.texto.slice(0, 40000) });
    } else {
      return json({ erro: "Mande uma foto, um PDF, um link ou um texto." }, 400);
    }
  } catch (e) {
    return json({ erro: (e as Error).message }, 400);
  }

  await admin.from("importacoes").insert({ user_id: u.user.id });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 4096,
      system: INSTRUCOES,
      tools: [FERRAMENTA],
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: conteudo }],
    }),
  });
  if (!r.ok) {
    const detalhe = await r.text();
    console.error("Anthropic", r.status, detalhe);
    let msg = "";
    try { msg = JSON.parse(detalhe).error?.message || ""; } catch { /* ok */ }
    if (r.status === 429 || r.status === 529) return json({ erro: "A IA está ocupada. Tente de novo em 1 minuto." }, 502);
    if (r.status === 401) return json({ erro: "A chave da Anthropic cadastrada no Supabase não foi aceita." }, 502);
    if (/credit|balance|spend|limit/i.test(msg)) return json({ erro: "O crédito ou o limite de gasto da Anthropic acabou." }, 502);
    return json({ erro: `A IA recusou o pedido (${r.status}): ${msg.slice(0, 160)}` }, 502);
  }
  const resp = await r.json();
  let uso = resp.content?.find((c: { type: string }) => c.type === "tool_use");
  if (!uso?.input) {
    // Plano B: a IA respondeu em texto com um JSON
    const texto = (resp.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n");
    const m = texto.match(/\{[\s\S]*\}/);
    try { if (m) uso = { input: JSON.parse(m[0]) }; } catch { /* sem JSON */ }
  }
  if (!uso?.input) return json({ erro: "Não consegui ler a receita. Tente outra foto." }, 422);
  if (uso.input.encontrou === false) return json({ erro: "Não achei uma receita nesse material." }, 422);
  if (corpo.tipo === "link") uso.input.fonte = corpo.url;
  return json({ receita: uso.input });
});

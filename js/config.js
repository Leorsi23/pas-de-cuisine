// =====================================================================
//  Pas de Cuisine · configuração
//  Tudo o que muda de vez em quando fica aqui. Edite e faça commit.
// =====================================================================

export const CONFIG = {
  supabaseUrl: "https://oocnpnvrbdnpvvtablsc.supabase.co",
  supabaseAnonKey: "sb_publishable_s6UL-5ByxBuAS149akb87Q_890P4A43",

  ensaios: 3,          // quantas vezes cada menu é feito
  notaMinima: 4,       // média (de 1 a 5) da 3ª vez para o menu valer
  minAvaliacoes: 2,    // quantas pessoas precisam avaliar a 3ª vez
  diasDoLink: 7,       // quantos dias o link de avaliação fica aberto
};

// Os atos da trilha
export const ATOS = [
  { id: "brasil", nome: "Ato I", sub: "Brasil", menus: [1, 2, 3, 4, 5] },
  { id: "italia", nome: "Ato II", sub: "Itália", menus: [6, 7, 8] },
  { id: "mundo", nome: "Ato III", sub: "Volta ao mundo", menus: [9, 10, 11, 12, 13] },
  { id: "final", nome: "Finale", sub: "O menu dela", menus: [14] },
];

// Os menus. Cada prato tem uma chave (usada para ligar a receita do caderno).
export const MENUS = {
  1: { nome: "Almoço de semana", pratos: [["1-arroz", "Arroz branco"], ["1-feijao", "Feijão"], ["1-bife", "Bife acebolado"], ["1-couve", "Couve refogada"], ["1-vinagrete", "Vinagrete"]],
    tecnicas: ["Refogado", "Panela de pressão", "Selar carne", "Cortes finos", "Fazer 5 coisas ao mesmo tempo"] },
  2: { nome: "Almoço mineiro", pratos: [["2-paodequeijo", "Pão de queijo"], ["2-frango", "Frango com quiabo"], ["2-angu", "Angu"], ["2-arroz", "Arroz"]],
    tecnicas: ["Destrinchar frango inteiro", "Quiabo sem baba", "Angu sem empelotar", "Escaldar polvilho"] },
  3: { nome: "Domingo de assado", pratos: [["3-maminha", "Maminha assada"], ["3-batata", "Batata rústica"], ["3-farofa", "Farofa de manteiga"], ["3-vinagrete", "Vinagrete"]],
    tecnicas: ["Forno", "Ponto e descanso da carne"] },
  4: { nome: "Moqueca", pratos: [["4-moqueca", "Moqueca de peixe"], ["4-pirao", "Pirão"], ["4-arroz", "Arroz"], ["4-farofa", "Farofa de dendê"]],
    tecnicas: ["Limpar e cortar peixe", "Caldo com cabeça e espinha", "Pirão"] },
  5: { nome: "Feijoada de sábado", pratos: [["5-feijoada", "Feijoada"], ["5-arroz", "Arroz"], ["5-couve", "Couve"], ["5-farofa", "Farofa"], ["5-torresmo", "Torresmo"], ["5-laranja", "Laranja"]],
    tecnicas: ["Planejar em 2 dias", "Dessalgar", "Fritura de imersão (com um adulto por perto)"] },
  6: { nome: "Jantar simples", pratos: [["6-bruschetta", "Bruschetta de tomate"], ["6-spaghetti", "Spaghetti al pomodoro"], ["6-salada", "Salada verde"]],
    tecnicas: ["Massa al dente", "Emulsionar o molho com a água do cozimento"] },
  7: { nome: "Domingo à bolonhesa", pratos: [["7-caprese", "Caprese"], ["7-pappardelle", "Pappardelle feito à mão"], ["7-ragu", "Ragù"]],
    tecnicas: ["Soffritto", "Cozimento longo", "Sovar e abrir massa"] },
  8: { nome: "Jantar milanês", pratos: [["8-caldo", "Caldo caseiro"], ["8-risoto", "Risoto alla milanese"], ["8-cotoletta", "Cotoletta alla milanese"]],
    tecnicas: ["Fazer caldo", "Risoto do jeito clássico", "Empanar e fritar em pouco óleo"] },
  9: { nome: "França", pratos: [["9-sopa", "Sopa de cebola"], ["9-frango", "Frango assado com ervas"], ["9-ratatouille", "Ratatouille"]],
    tecnicas: ["Caramelizar cebola devagar", "Assar ave inteira", "Cortes uniformes"] },
  10: { nome: "México", pratos: [["10-guacamole", "Guacamole"], ["10-pico", "Pico de gallo"], ["10-tortilla", "Tortilla caseira"], ["10-tacos", "Tacos de carne marinada"], ["10-feijao", "Feijão refrito"]],
    tecnicas: ["Tortilla", "Marinada"] },
  11: { nome: "Oriente Médio", pratos: [["11-homus", "Homus"], ["11-tabule", "Tabule"], ["11-kafta", "Kafta grelhada"], ["11-pita", "Pão pita"]],
    tecnicas: ["Pão de frigideira", "Grelhar"] },
  12: { nome: "Japão", pratos: [["12-guioza", "Guioza"], ["12-teriyaki", "Frango teriyaki"], ["12-yakimeshi", "Yakimeshi"], ["12-sunomono", "Sunomono"]],
    tecnicas: ["Fechar a massa da guioza", "Wok em fogo alto", "Redução para laquear"] },
  13: { nome: "Peru", pratos: [["13-ceviche", "Ceviche"], ["13-lomo", "Lomo saltado"]],
    tecnicas: ["Cozinhar só com ácido (peixe muito fresco)", "Salteado no wok"] },
  14: { nome: "O menu dela", pratos: [], livre: true,
    tecnicas: ["Planejar o cardápio", "Lista de compras", "Cronograma de preparo"] },
};

// Prêmios: liberados pelo número de menus concluídos.
export const RECOMPENSAS = [
  { id: "faca", titulo: "Faca de chef", desc: "A ferramenta que ela mais vai usar daqui em diante.", alvo: 3 },
  { id: "frigideira", titulo: "Frigideira de fundo grosso", desc: "De ferro ou inox, para selar carne e a cotoletta.", alvo: 6 },
  { id: "ferro", titulo: "Panela de ferro fundido", desc: "Para ensopados e assados.", alvo: 9 },
  { id: "wok", titulo: "Wok", desc: "Bem a tempo do lomo saltado.", alvo: 12 },
  { id: "maquina", titulo: "Máquina de macarrão", desc: "O grand finale.", alvo: 14 },
];

export const CATEGORIAS = ["Entrada", "Prato principal", "Acompanhamento", "Massa", "Sopa", "Salada", "Pão", "Molho", "Doce", "Bebida", "Outro"];

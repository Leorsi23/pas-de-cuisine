# Pas de Cuisine

A trilha de menus e o caderno de receitas da Alice. Feito para o celular.

- **Trilha:** 13 menus (Brasil, Itália, volta ao mundo) e um final criado por ela. Cada menu é feito 3 vezes; na 3ª, com pelo menos 2 notas e média 4 ou mais, ele está concluído. Um menu abre quando o anterior foi feito pela primeira vez.
- **Notas:** depois de servir, ela tira a foto do prato e manda um link para quem comeu. A pessoa abre sem login, vê a foto, dá de 1 a 5 estrelas e escreve o que ela pode melhorar.
- **Prêmios:** um utensílio a cada 3 menus concluídos, e a máquina de macarrão no fim. Só o pai marca como entregue.
- **Caderno:** todas as receitas, para sempre. Busca, categorias, favoritas, porções recalculadas e modo cozinha (tela sempre acesa, passo a passo grande, timers).
- **Importar:** foto, print, PDF, link ou texto. A IA da Anthropic lê e devolve a receita padronizada; ela confere antes de salvar.

Site estático no GitHub Pages, sem etapa de build. Dados, fotos e login no Supabase.

## Estrutura

| Arquivo | O que é |
|---|---|
| `js/config.js` | **O que você edita:** chaves do Supabase, regras (vezes, nota mínima, nº de notas), menus, pratos, técnicas e prêmios |
| `js/app.js` | As telas |
| `js/store.js` | Banco, fotos, links de avaliação e importação |
| `js/receita.js` | Contas das porções e arredondamentos |
| `avaliar.html` | A página que quem comeu abre pelo link |
| `supabase/schema.sql` | Tabelas, permissões e a pasta das fotos |
| `supabase/functions/importar-receita/index.ts` | A função que chama a IA. A sua chave da Anthropic fica só lá |

## Testar sem mexer em nada

Abra o site com `?demo` no fim do endereço, por exemplo `https://leorsi23.github.io/pas-de-cuisine/?demo`. Roda só no navegador, com receitas de exemplo, e a importação devolve uma receita de mentira. Com `?demo=pai` você vê como pai.

## Ligar tudo (uma vez)

1. **Banco.** Supabase > **SQL Editor** > **New query**, cole todo o `supabase/schema.sql` e clique em **Run**.
2. **Usuários.** **Authentication** > **Users** > **Add user** > **Create new user**: o seu e o da Alice, com e-mail e senha, marcando **Auto Confirm User**. Depois, no SQL Editor, rode trocando os e-mails:
   ```sql
   insert into public.members (user_id, role, nome)
   select id, 'pai', 'Leo' from auth.users where email = 'SEU-EMAIL';
   insert into public.members (user_id, role, nome)
   select id, 'cozinheira', 'Alice' from auth.users where email = 'EMAIL-DA-ALICE';
   ```
   Em **Authentication** > **Sign In / Providers**, desligue **Allow new users to sign up**.
3. **Função da IA.** **Edge Functions** > **Deploy a new function** > **Via Editor**. Nome: `importar-receita`. Apague o código de exemplo, cole todo o `supabase/functions/importar-receita/index.ts` e clique em **Deploy**. Nos detalhes da função, desligue **Verify JWT** (a própria função confere o login, e o pedido do navegador precisa passar).
4. **Chave da Anthropic.** **Edge Functions** > **Secrets** > **Add new secret**. Nome `ANTHROPIC_API_KEY`, valor a sua chave (`sk-ant-...`). Ela fica só no Supabase; o site nunca a vê. Vale pôr um limite de gasto mensal no console da Anthropic.
5. **Site.** No GitHub, **Settings** > **Pages** > *Deploy from a branch*, branch **main**, pasta **/ (root)**. Em 1 ou 2 minutos fica em `https://leorsi23.github.io/pas-de-cuisine/`.
6. **Instalar no celular.** iPhone: Safari > Compartilhar > **Adicionar à Tela de Início**. Android: Chrome > menu > **Instalar app**.

A chave *publishable* em `js/config.js` pode ficar no código público: o que protege os dados são as regras do `schema.sql`. Nunca cole lá a chave *secret*.

## Como as notas funcionam

- O link vale 7 dias (`diasDoLink`). Abrir o link não exige conta e só mostra aquele prato.
- Cada pessoa avalia uma vez por preparo; se mandar de novo com o mesmo nome, a nota é trocada.
- "O que melhorar" é obrigatório.
- O pai pode apagar uma nota ou um preparo lançado por engano.

## Custos e limites

- Supabase grátis: pausa depois de 7 dias sem uso. Se pausar, entre no painel e clique em *Restore*.
- Importação: limite de 25 por pessoa a cada 24 horas (`LIMITE_DIARIO` na função). Cada leitura custa centavos. O modelo usado está em `MODELO`, no topo da função.

Depois de mudar arquivos, se o app parecer igual, feche e abra de novo (ele guarda uma cópia para funcionar sem internet). Se mudar muita coisa, aumente a versão em `sw.js` (`pdc-v1` para `pdc-v2`).

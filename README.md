# MV Print - Site Institucional

[![Site](https://img.shields.io/badge/Site-mvprint.com.br-blue)](https://mvprint.com.br)
[![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

Site institucional da **MV Print**, grafica e comunicacao visual em Belo Horizonte/MG.

🔗 **[Ver site ao vivo](https://mvprint.com.br)**

![Preview do site](public/preview.png)

## Sobre o projeto

Site desenvolvido para apresentar os servicos da grafica:
- Plotagem veicular e envelopamento
- Comunicacao visual (fachadas, letreiros)
- Adesivos, banners e lonas
- Grafica rapida (cartoes, panfletos)

## Stack

| Tecnologia | Uso |
|------------|-----|
| **Astro** | Framework SSG |
| **Tailwind CSS** | Estilizacao |
| **Vanilla JS** | Interacoes |
| **Cloudflare Pages** | Hospedagem |

## Rodar localmente

```bash
npm ci
npm run dev
# http://localhost:4321
```

## Build

```bash
npm run build
# Arquivos em ./dist
```

## Estrutura

```
src/
├── components/    # Header, Hero, Services, Portfolio, Contact, Footer
├── layouts/       # Layout base
├── pages/         # index.astro, portfolio.astro
└── styles/        # CSS global
```

## Contato

- **Site:** [mvprint.com.br](https://mvprint.com.br)
- **Email:** atendimento@mvprint.com.br


## Publicação final de 23/09/2026

O novo front-end do Claude foi publicado a pedido de Math, com o filtro detalhado das 24 categorias restaurado. Código integrado pelo PR #4, commit `0f714ea8672828bd5b5b5533dc3fffcf0a90837d`.

- Produção: https://mvprint.com.br — deployment `ad720408-ab0c-44ce-aeae-9accd2cae167`, projeto `mvprint-bh`.
- Prévia validada: https://revisao-final.mvprint-bh.pages.dev — deployment `0c4d1a7e-4289-4808-a889-450a94856d52`.
- Reversão imediata: `61e057fa-268b-42d8-acdd-3727d4dee6ef`, preservado no histórico de deployments.
- Pacote publicado: 1.000 arquivos, 80.354.629 bytes; SHA-256 `ac506b4cd7ff816b26828e4c02550b17efa70beb323fc444a39b9fc49d06f00a`. O painel está no limite de arquivos: não remover fotos para acomodar novas adições; usar Wrangler se o pacote crescer.
- Validação: CI completo aprovado, três páginas e 1.117 referências locais, 30 opções do filtro conferidas, menu/ampliação/teclado em computador e celular, formulário testado offline sem enviar mensagem. Domínio oficial com páginas 200, 404 real, redirecionamentos HTTPS/www e arquivos JS/CSS correspondentes ao pacote. Produção indexável; prévias com noindex.
- Geração de imagens com memória limitada e gravação atômica, preservando as 242 fotos originais.

Os registros da revisão inicial abaixo permanecem como histórico; o estado publicado acima é o atual.

## Manutenção e publicação (revisado em 23/09/2026)

- Domínio: https://mvprint.com.br
- Hospedagem confirmada no painel: Cloudflare Pages, projeto `mvprint-bh`.
- Publicação por **Direct Upload**, sem conexão Git automática. Um push neste repositório não atualiza o site sozinho.
- Node 24.15.0 definido em `.node-version` (mínimo 22.12).
- `npm ci` instala exatamente o lockfile; `npm run build` gera o site em `dist/`.
- O prebuild cria versões WebP de 480 e 960 px. As 242 fotos originais permanecem preservadas; os derivados não entram no Git.
- `public/_headers` define cache diário das imagens, cache longo dos assets com hash e bloqueio de indexação dos domínios de prévia.
- GTM e Clarity refletem as integrações conferidas no site publicado, e só carregam no domínio de produção.

### Publicar com segurança

1. Execute `npm ci` e `npm run build`.
2. Faça primeiro um deploy de prévia no projeto `mvprint-bh` e confira menu, fotos, filtros e contato em computador e celular.
3. Para o painel, a pasta tem que respeitar o limite de 1.000 arquivos. `python scripts/package-deploy.py mvprint-deploy.zip` cria um pacote com 1.000 arquivos neste estado do projeto; só exclui do pacote cópias de logos não usadas. O ZIP ultrapassa 25 MiB: extraia-o e selecione a **pasta** no painel, pois o upload do ZIP inteiro excede o limite por arquivo.
4. Alternativamente, com Wrangler autenticado, publique `dist` por CLI (limite maior): `npx wrangler pages deploy dist --project-name mvprint-bh --branch nome-da-previa`. Só use `--branch main` para a publicação final.
5. Confira `https://mvprint.com.br`, `/portfolio`, uma URL inexistente (deve retornar 404) e os cabeçalhos/cache depois da publicação.
6. Reversão: no painel Pages, use o deployment anterior. A produção anterior a esta revisão era `cb57935b-b207-42b5-8234-84b3668470cc`.

### Validação desta revisão

- Instalação limpa, build estático de 3 páginas e auditoria sem alertas na data da revisão.
- Conferidos arquivos referenciados, IDs, âncoras, H1 e textos alternativos.
- Menu móvel, filtros e lightbox testados com toque/teclado; Escape devolve o foco ao cartão; navegação limitada à categoria selecionada.
- Fotos de destaque: 1.264.208 bytes de JPG para 196.232 bytes (480 px) ou 553.404 bytes (960 px). Isso mede peso dos arquivos, não representa uma nota PageSpeed nem tempo garantido de carregamento.

## Coordenação: front-end e infraestrutura

Em 23/09/2026, Math definiu: Claude cuida do design/front-end; Asuna/Codex cuida da infraestrutura. O visual publicado na revisão #1 foi rejeitado por Math e não deve ser considerado design aprovado. A proposta clara/editorial ficou a cargo do Claude; não há redesign adicional publicado pelo Codex.

- O projeto é estático: não há servidor de aplicação, banco, login ou serviço de envio de e-mail. O formulário prepara uma mensagem e abre o WhatsApp; o visitante confirma o envio lá.
- Fontes do visual: `src/components`, `src/pages`, `src/styles` e `src/layouts`. Contatos e dados da empresa: `src/config/site.ts`.
- Infraestrutura: `.github/workflows`, `scripts`, versões/lockfile, configuração Astro e `public/_headers`. Preservar `_headers`, `robots.txt`, `sitemap.xml` e `404.html` no build.
- O workflow **Validate site** instala, audita vulnerabilidades altas/críticas, gera o build e verifica páginas, arquivos locais, âncoras, IDs e limite de 25 MiB por arquivo. O build completo fica disponível por sete dias como artifact; ele não publica em produção.
- Validação local após mudar o front-end: `npm run build` e `python scripts/validate-build.py`. Depois, testar menu, filtros, ampliação de fotos e contato no navegador em computador e celular.
- A geração de imagens refaz variantes se a receita mudar e remove somente derivados órfãos. Originais permanecem em `public/images/portfolio`.
- O arquivo ZIP do painel deve ficar fora de `dist`. A ferramenta interrompe se ultrapassar 1.000 arquivos; nesse caso usar Wrangler com `dist`, sem remover fotos para caber. O artifact completo do GitHub também deve ser publicado por Wrangler se exceder 1.000 arquivos.
- Produção do domínio principal: `mvprint-bh`, deployment `ad720408-ab0c-44ce-aeae-9accd2cae167`. Reversão imediata: `61e057fa-268b-42d8-acdd-3727d4dee6ef`. Versão anterior à revisão #1 também preservada: `cb57935b-b207-42b5-8234-84b3668470cc`.
- Há integrações herdadas de preview com Netlify e outro projeto Pages (`mvprint-site`). Não confundir um check verde desses serviços com publicação no domínio principal.
- Nunca incluir tokens no código ou no artifact. Deploy automático ao projeto principal exigiria credencial específica e configuração separada; isso não está habilitado.

### Proteções do empacotador

O empacotador valida tanto `dist` quanto a pasta exata que entrará no ZIP. Preserva logos referenciados em CSS, URLs com parâmetros, nomes codificados e coleções dinâmicas em JavaScript. Arquivos privados, links simbólicos e referências locais quebradas interrompem o processo. O pacote anterior só é substituído depois que a nova compactação termina com sucesso.

Execute `python -m unittest discover -s tests -v` para reproduzir os cenários de falha; a mesma suíte roda no GitHub. A validação verifica arquivos e referências estáticas, não substitui testes das interações no navegador nem faz análise de tipos TypeScript.

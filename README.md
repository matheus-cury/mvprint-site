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
3. Para o painel, a pasta tem que respeitar o limite de 1.000 arquivos. `python scripts/package-deploy.py mvprint-deploy.zip` cria um pacote com 993 arquivos neste estado do projeto; só exclui do pacote cópias de logos não usadas. O ZIP ultrapassa 25 MiB: extraia-o e selecione a **pasta** no painel, pois o upload do ZIP inteiro excede o limite por arquivo.
4. Alternativamente, com Wrangler autenticado, publique `dist` por CLI (limite maior): `npx wrangler pages deploy dist --project-name mvprint-bh --branch nome-da-previa`. Só use `--branch main` para a publicação final.
5. Confira `https://mvprint.com.br`, `/portfolio`, uma URL inexistente (deve retornar 404) e os cabeçalhos/cache depois da publicação.
6. Reversão: no painel Pages, use o deployment anterior. A produção anterior a esta revisão era `cb57935b-b207-42b5-8234-84b3668470cc`.

### Validação desta revisão

- Instalação limpa, build estático de 3 páginas e auditoria sem alertas na data da revisão.
- Conferidos arquivos referenciados, IDs, âncoras, H1 e textos alternativos.
- Menu móvel, filtros e lightbox testados com toque/teclado; Escape devolve o foco ao cartão; navegação limitada à categoria selecionada.
- Fotos de destaque: 1.264.208 bytes de JPG para 196.232 bytes (480 px) ou 553.404 bytes (960 px). Isso mede peso dos arquivos, não representa uma nota PageSpeed nem tempo garantido de carregamento.

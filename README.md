# MV Print - Site Institucional

Site institucional da MV Print, grafica e comunicacao visual em Belo Horizonte.

## Tecnologias

- **Astro** - Framework web estatico
- **Tailwind CSS** - Framework de estilos
- **Vanilla JS** - Interacoes simples

## Como executar

```bash
# Instalar dependencias
npm install

# Rodar em desenvolvimento
npm run dev

# Abrir no navegador
http://localhost:4321
```

## Build para producao

```bash
# Gerar build
npm run build

# Os arquivos serao gerados em ./dist
```

## Estrutura do projeto

```
mvprint-site/
├── public/
│   └── images/
│       ├── logo-mvprint.png
│       └── portfolio/         # Fotos selecionadas
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Services.astro
│   │   ├── Portfolio.astro
│   │   ├── About.astro
│   │   ├── Contact.astro
│   │   ├── Footer.astro
│   │   └── WhatsAppButton.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro        # Pagina principal
│   │   └── portfolio.astro    # Galeria completa
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
└── README.md
```

## Deploy

### Vercel (recomendado)

1. Crie uma conta em vercel.com
2. Conecte seu repositorio GitHub
3. Vercel detectara automaticamente o Astro
4. Deploy automatico a cada push

### Netlify

1. Crie uma conta em netlify.com
2. Arraste a pasta `dist` para o painel
3. Ou conecte o repositorio GitHub

## Contato

- **Site:** mvprint.com.br
- **WhatsApp:** (31) 97302-4426
- **Email:** atendimento@mvprint.com.br

---

Desenvolvido com Astro + Tailwind CSS

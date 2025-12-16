"""
Script para baixar logos dos clientes da MV Print
Usa Brandfetch CDN como fonte principal
"""

import os
import urllib.request
import ssl
from pathlib import Path

# Pasta de destino
LOGOS_DIR = Path("public/images/logos")
LOGOS_DIR.mkdir(parents=True, exist_ok=True)

# Contexto SSL para evitar erros de certificado
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# User-Agent para evitar bloqueios
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# URLs das logos
LOGOS = {
    # === LOGOS EXISTENTES ===
    "cbf": {
        "url": "https://cdn.brandfetch.io/idzQ0eT-WM/w/1823/h/2504/theme/light/logo.png",
        "filename": "cbf.png"
    },
    "cemig": {
        "url": "https://cdn.brandfetch.io/idn1x4Enag/w/820/h/215/theme/dark/logo.png",
        "filename": "cemig.png"
    },
    "claro": {
        "url": "https://cdn.brandfetch.io/idnSdYFIv9/w/820/h/297/theme/dark/logo.png",
        "filename": "claro.png"
    },
    "citroen": {
        "url": "https://cdn.brandfetch.io/idC1Do3U6t/w/250/h/239/theme/dark/logo.png",
        "filename": "citroen.png"
    },
    "renault": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Renault_2021_Text.svg/320px-Renault_2021_Text.svg.png",
        "filename": "renault.png"
    },
    "csn": {
        "url": "https://cdn.brandfetch.io/idf-2eye-D/w/820/h/376/theme/dark/logo.png",
        "filename": "csn.png"
    },

    # === NOVAS LOGOS (MV Print) ===

    # 1. Zak
    "zak": {
        "url": "https://cdn.brandfetch.io/idfiovB7j9/w/512/h/512/theme/dark/logo.png",
        "filename": "zak.png"
    },

    # 2. Windsor Hotéis
    "windsor": {
        "url": "https://cdn.brandfetch.io/idM8Oupycg/w/667/h/667/theme/dark/icon.jpeg",
        "filename": "windsor.jpeg"
    },

    # 3. Grupo Roma Brasil
    "grupo-roma": {
        "url": "https://cdn.worldvectorlogo.com/logos/grupo-roma.svg",
        "filename": "grupo-roma.svg"
    },

    # 4. AeC Contact Center
    "aec": {
        "url": "https://cdn.worldvectorlogo.com/logos/aec-1.svg",
        "filename": "aec.svg"
    },

    # 5. Grupo Tecar
    "grupo-tecar": {
        "url": "https://cdn.dealerspace.ai/tecar/logo/GrupoTecar%20WHITE.png",
        "filename": "grupo-tecar.png"
    },

    # 6. Mit Car Minas
    "mit-car": {
        "url": "https://cdn.dealerspace.ai/mit-car/logos/mit-car-minas.png",
        "filename": "mit-car.png"
    },

    # 7. Orcasa Netimóveis
    "orcasa": {
        "url": "https://www.orcasa.com.br/wp-content/uploads/2019/09/cropped-cropped-Orcasa_Hor_Colorida.png",
        "filename": "orcasa.png"
    },

    # 8. Drogarias Pacheco
    "drogarias-pacheco": {
        "url": "https://logodownload.org/wp-content/uploads/2022/08/drogarias-pacheco-logo.png",
        "filename": "drogarias-pacheco.png"
    },

    # 9. Pague Menos
    "pague-menos": {
        "url": "https://cdn.worldvectorlogo.com/logos/pague-menos-logo.svg",
        "filename": "pague-menos.svg"
    },

    # 10. Portal Auto Shopping
    "portal-auto-shopping": {
        "url": "https://cdn.brandfetch.io/id8VkaZAZD/w/400/h/150/theme/light/logo.png",
        "filename": "portal-auto-shopping.png"
    },

    # === LOGOS QUE PRECISAM SER BAIXADAS MANUALMENTE ===
    # - Grupo Jorlan: Não encontrado em bancos de logos. Baixar de https://grupojorlan.com.br
    # - Pontua X: Empresa pequena (fintech), logo não disponível em bancos. Baixar de https://cubo.network/startups/pontua-x
}

def download_logo(name, info):
    """Baixa uma logo e salva na pasta"""
    url = info["url"]
    filename = info["filename"]
    filepath = LOGOS_DIR / filename

    print(f"Baixando {name}... ", end="", flush=True)

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            data = response.read()

        with open(filepath, "wb") as f:
            f.write(data)

        size_kb = len(data) / 1024
        print(f"OK ({size_kb:.1f} KB)")
        return True

    except Exception as e:
        print(f"ERRO: {e}")
        return False

def main():
    print("=" * 50)
    print("Baixando logos dos clientes MV Print")
    print("=" * 50)
    print(f"Destino: {LOGOS_DIR.absolute()}\n")

    success_count = 0
    failed = []

    for name, info in LOGOS.items():
        if download_logo(name, info):
            success_count += 1
        else:
            failed.append(name)

    print("\n" + "=" * 50)
    print(f"Concluido: {success_count}/{len(LOGOS)} logos baixadas")

    if failed:
        print(f"Falharam: {', '.join(failed)}")

    # Lista os arquivos baixados
    print("\nArquivos na pasta:")
    for f in LOGOS_DIR.iterdir():
        print(f"  - {f.name} ({f.stat().st_size / 1024:.1f} KB)")

    print("=" * 50)

if __name__ == "__main__":
    main()

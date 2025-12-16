"""
Script para converter imagens JPG para WebP
Melhora performance do site (WebP é ~30% menor que JPG)
"""

from PIL import Image
import os
from pathlib import Path

# Pasta das imagens
PORTFOLIO_DIR = Path(r"C:\Users\Magnett1c\Documents\mvprint-site\public\images\portfolio")

# Imagens prioritarias (usadas no Hero, Services, About)
PRIORITY_IMAGES = [
    "ambientes-689498ae-10a6-4a37-95fb-307ec35bf8b4.jpg",  # Hero atual
    "ambientes-098fba31-0bf4-48f6-88ab-24d1e2723481.jpg",  # Candidata Hero
    "ambientes-21f8527a-4975-4e21-9fad-983d515d6904.jpg",  # Candidata Hero
    "vitrines-29fa897e-40d2-4fed-bdb6-0b65dd97312b.jpg",   # Candidata Hero
    "tapumes-b0e7aaa7-c85a-4c1f-9551-4eac1f096151.jpg",   # Candidata Hero
    "veiculos-8982d6d7-b525-4103-8dad-a33e1b6342d8.jpg",   # Services
    "tapumes-11e2f421-a874-4c97-b166-2dac2c960d24.jpg",    # Services
    "blocos-446d5a03-dbde-463f-9cb0-909077d3be96.jpg",     # Services
    "veiculos-a5fdcb18-1032-411d-ae69-de02f9b5e53c.jpg",   # About
    "ambientes-52d794b7-5776-46d6-8e1e-d4311de13d8b.jpg",  # About
    "tapumes-036fd989-71f7-40de-9cb0-9a72467d561e.jpg",    # About
    "carros-9b9d5fa5-82cb-4dbc-858f-436c88bbba5e.jpg",     # About
]

def convert_to_webp(jpg_path, quality=85):
    """Converte JPG para WebP mantendo qualidade"""
    webp_path = jpg_path.with_suffix('.webp')

    if webp_path.exists():
        print(f"  [SKIP] {webp_path.name} ja existe")
        return None

    try:
        with Image.open(jpg_path) as img:
            # Converte para RGB se necessario (remove alpha de PNG)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Salva como WebP
            img.save(webp_path, 'WEBP', quality=quality, method=6)

            # Calcula reducao de tamanho
            jpg_size = jpg_path.stat().st_size / 1024
            webp_size = webp_path.stat().st_size / 1024
            reduction = ((jpg_size - webp_size) / jpg_size) * 100

            print(f"  [OK] {jpg_path.name}")
            print(f"       JPG: {jpg_size:.1f}KB -> WebP: {webp_size:.1f}KB ({reduction:.1f}% menor)")

            return webp_path
    except Exception as e:
        print(f"  [ERRO] {jpg_path.name}: {e}")
        return None

def main():
    print("=" * 50)
    print("CONVERSAO JPG -> WebP")
    print("=" * 50)
    print()

    converted = 0
    total_saved = 0

    print("Convertendo imagens prioritarias...")
    print()

    for filename in PRIORITY_IMAGES:
        jpg_path = PORTFOLIO_DIR / filename
        if jpg_path.exists():
            jpg_size = jpg_path.stat().st_size / 1024
            result = convert_to_webp(jpg_path)
            if result:
                webp_size = result.stat().st_size / 1024
                total_saved += (jpg_size - webp_size)
                converted += 1
        else:
            print(f"  [NAO ENCONTRADO] {filename}")

    print()
    print("=" * 50)
    print(f"Convertidas: {converted} imagens")
    print(f"Economia total: {total_saved:.1f}KB ({total_saved/1024:.2f}MB)")
    print("=" * 50)
    print()
    print("PROXIMO PASSO: Atualizar os componentes para usar .webp")

if __name__ == "__main__":
    main()

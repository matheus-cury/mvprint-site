"""
Script para converter TODAS as imagens JPG para WebP
Melhora performance do site (WebP é ~30% menor que JPG)
"""

from PIL import Image
import os
from pathlib import Path

# Pasta das imagens
PORTFOLIO_DIR = Path(r"C:\Users\Magnett1c\Documents\mvprint-site\public\images\portfolio")

def convert_to_webp(jpg_path, quality=85):
    """Converte JPG para WebP mantendo qualidade"""
    webp_path = jpg_path.with_suffix('.webp')

    if webp_path.exists():
        return None  # Ja existe

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

            return (jpg_size, webp_size, reduction)
    except Exception as e:
        print(f"  [ERRO] {jpg_path.name}: {e}")
        return None

def main():
    print("=" * 60)
    print("CONVERSAO JPG -> WebP (TODAS AS IMAGENS)")
    print("=" * 60)
    print()

    # Lista todas as imagens JPG
    jpg_files = list(PORTFOLIO_DIR.glob("*.jpg"))
    total = len(jpg_files)

    print(f"Encontradas {total} imagens JPG")
    print()

    converted = 0
    skipped = 0
    total_saved = 0

    for i, jpg_path in enumerate(jpg_files, 1):
        result = convert_to_webp(jpg_path)
        if result:
            jpg_size, webp_size, reduction = result
            total_saved += (jpg_size - webp_size)
            converted += 1
            print(f"[{i}/{total}] {jpg_path.name} - {reduction:.0f}% menor")
        else:
            skipped += 1

    print()
    print("=" * 60)
    print(f"RESULTADO:")
    print(f"  - Convertidas: {converted} imagens")
    print(f"  - Ja existiam: {skipped} imagens")
    print(f"  - Economia total: {total_saved:.1f}KB ({total_saved/1024:.2f}MB)")
    print("=" * 60)

if __name__ == "__main__":
    main()

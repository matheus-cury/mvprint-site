import os
import shutil
import json
import re

# Pastas
SOURCE = r"C:\Users\Magnett1c\Documents\MVPRINT"
DEST = r"C:\Users\Magnett1c\Documents\mvprint-site\public\images\portfolio"

# Mapeamento de categorias para nomes amigáveis e slugs
CATEGORY_MAP = {
    "Adesivação (Campanhas)": {"name": "Campanhas", "slug": "campanhas"},
    "Adesivação Comunicação Visual": {"name": "Comunicação Visual", "slug": "comunicacao-visual"},
    "Adesivação de Ambientes": {"name": "Ambientes", "slug": "ambientes"},
    "Adesivação de Piso": {"name": "Piso", "slug": "piso"},
    "Adesivação de Vitrines": {"name": "Vitrines", "slug": "vitrines"},
    "Adesivação em parabrisas": {"name": "Parabrisas", "slug": "parabrisas"},
    "Adesivos Imobiliários": {"name": "Imobiliários", "slug": "imobiliarios"},
    "Backdrop e faixas em lona": {"name": "Backdrop e Faixas", "slug": "backdrop"},
    "Banners": {"name": "Banners", "slug": "banners"},
    "Blocos personalizados": {"name": "Blocos Personalizados", "slug": "blocos"},
    "Carros": {"name": "Carros", "slug": "carros"},
    "Carros Personalizados": {"name": "Carros Personalizados", "slug": "carros-personalizados"},
    "Envelopamento e personalização de carros": {"name": "Envelopamento", "slug": "envelopamento"},
    "Etiquetas Personalizadas": {"name": "Etiquetas", "slug": "etiquetas"},
    "Lona CBF": {"name": "Projeto CBF", "slug": "cbf"},
    "Lonas": {"name": "Lonas", "slug": "lonas"},
    "Placas e lonas": {"name": "Placas e Lonas", "slug": "placas-lonas"},
    "Placas em PVC": {"name": "Placas PVC", "slug": "placas-pvc"},
    "Plotagens": {"name": "Plotagens", "slug": "plotagens"},
    "Promocionais e campanhas": {"name": "Promocionais", "slug": "promocionais"},
    "Recortes digitais": {"name": "Recortes Digitais", "slug": "recortes"},
    "Remoção Limpeza Adesivação Personalização": {"name": "Remoção e Limpeza", "slug": "remocao"},
    "Tapumes": {"name": "Tapumes", "slug": "tapumes"},
    "Veículos": {"name": "Veículos", "slug": "veiculos"},
}

# Estrutura para guardar as categorias
categories = {}

# Limpar pasta destino (manter apenas logo)
print("Limpando pasta destino...")
for f in os.listdir(DEST):
    if f.endswith(('.jpg', '.jpeg', '.png')) and f != 'logo-mvprint.png':
        os.remove(os.path.join(DEST, f))

# Processar cada pasta
print("Copiando imagens...")
count = 0

for folder in os.listdir(SOURCE):
    folder_path = os.path.join(SOURCE, folder)

    # Pular se não for pasta ou for site-fotos-selecionadas
    if not os.path.isdir(folder_path) or folder == "site-fotos-selecionadas":
        continue

    # Verificar se está no mapa
    if folder not in CATEGORY_MAP:
        print(f"  Ignorando: {folder}")
        continue

    cat_info = CATEGORY_MAP[folder]
    slug = cat_info["slug"]
    name = cat_info["name"]

    if slug not in categories:
        categories[slug] = {"name": name, "slug": slug, "items": []}

    # Processar imagens da pasta
    for img in os.listdir(folder_path):
        if img.lower().endswith(('.jpg', '.jpeg', '.png')) and not img.startswith('_'):
            # Nome novo: slug-uuid.ext
            ext = os.path.splitext(img)[1]
            new_name = f"{slug}-{img}"

            src = os.path.join(folder_path, img)
            dst = os.path.join(DEST, new_name)

            shutil.copy2(src, dst)

            categories[slug]["items"].append({
                "image": f"/images/portfolio/{new_name}",
                "title": name
            })
            count += 1

print(f"\nTotal copiado: {count} imagens")

# Ordenar categorias por quantidade (maior primeiro)
sorted_cats = sorted(categories.values(), key=lambda x: len(x["items"]), reverse=True)

# Gerar código Astro
print("\nGerando código para portfolio.astro...")

astro_code = """const categories = [
"""

for cat in sorted_cats:
    astro_code += f"""  {{
    name: "{cat['name']}",
    slug: "{cat['slug']}",
    items: [
"""
    for item in cat["items"]:
        astro_code += f"""      {{ image: "{item['image']}", title: "{item['title']}" }},
"""
    astro_code += """    ]
  },
"""

astro_code += """];"""

# Salvar código
with open(os.path.join(SOURCE, "portfolio-categories.js"), "w", encoding="utf-8") as f:
    f.write(astro_code)

print(f"Código salvo em: {SOURCE}/portfolio-categories.js")

# Resumo
print("\n=== RESUMO ===")
for cat in sorted_cats:
    print(f"  {cat['name']}: {len(cat['items'])} fotos")
print(f"\nTOTAL: {count} fotos em {len(sorted_cats)} categorias")

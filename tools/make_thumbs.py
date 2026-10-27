#!/usr/bin/env python3
"""Запускать после добавления или замены фотографий (нужен Pillow: pip install pillow).
Из assets/photos/edited создаёт:
  - assets/photos/thumbs/NN.jpg  (лёгкие превью для галереи)
  - assets/photos/og.jpg         (картинка для превью ссылки)
  - downloads/<префикс>-edited.zip  (архив обработанных фото для кнопки «Скачать все»)
Из assets/photos/original создаёт:
  - release/<префикс>-originals.zip (архив исходников; его НЕ кладут в репозиторий,
    а загружают в GitHub Releases, см. README)
Запуск из корня проекта: python3 tools/make_thumbs.py"""
import os, re, glob, zipfile
from PIL import Image, ImageOps
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(root, *a)
prefix = re.search(r'filePrefix:\s*"([^"]+)"', open(P("assets/js/photos.js"), encoding="utf-8").read()).group(1)
ed, th, orig = P("assets/photos/edited"), P("assets/photos/thumbs"), P("assets/photos/original")
os.makedirs(th, exist_ok=True)
files = sorted(f for f in glob.glob(os.path.join(ed, "*.*")) if f.lower().endswith((".jpg", ".jpeg", ".png")))
for f in files:
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB"); im.thumbnail((1200, 1200), Image.LANCZOS)
    im.save(os.path.join(th, os.path.splitext(os.path.basename(f))[0] + ".jpg"), quality=82, optimize=True, progressive=True)
    print("превью:", os.path.basename(f))
if files:
    ImageOps.fit(ImageOps.exif_transpose(Image.open(files[0])).convert("RGB"), (1200, 630), Image.LANCZOS, centering=(0.72, 0.4)).save(P("assets/photos/og.jpg"), quality=85, optimize=True)
def pack(src_files, kind, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED) as z:
        for f in src_files:
            n, e = os.path.splitext(os.path.basename(f)); z.write(f, f"{prefix}-{n}-{kind}{e.lower()}")
    print("архив:", os.path.relpath(out, root), round(os.path.getsize(out) / 1048576, 1), "МБ")
if files: pack(files, "edited", P("downloads", f"{prefix}-edited.zip"))
of = sorted(f for f in glob.glob(os.path.join(orig, "*.*")) if not f.endswith(".gitkeep"))
if of: pack(of, "original", P("release", f"{prefix}-originals.zip"))

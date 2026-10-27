#!/usr/bin/env python3
"""Создаёт лёгкие превью (assets/photos/thumbs/NN.jpg, 1200 px) и картинку для ссылок
(assets/photos/og.jpg) из обработанных фото. Нужен Pillow: pip install pillow
Запуск из корня проекта: python3 tools/make_thumbs.py"""
import os, glob
from PIL import Image, ImageOps
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ed, th = (os.path.join(root, "assets/photos", d) for d in ("edited", "thumbs"))
os.makedirs(th, exist_ok=True)
for f in sorted(glob.glob(os.path.join(ed, "*.*"))):
    if not f.lower().endswith((".jpg", ".jpeg", ".png")): continue
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    im.thumbnail((1200, 1200), Image.LANCZOS)
    out = os.path.join(th, os.path.splitext(os.path.basename(f))[0] + ".jpg")
    im.save(out, quality=82, optimize=True, progressive=True)
    print("превью:", os.path.relpath(out, root))
first = sorted(glob.glob(os.path.join(ed, "01.*")))
if first:
    og = ImageOps.fit(ImageOps.exif_transpose(Image.open(first[0])).convert("RGB"), (1200, 630), Image.LANCZOS, centering=(0.72, 0.4))
    og.save(os.path.join(root, "assets/photos/og.jpg"), quality=85, optimize=True)
    print("картинка для ссылок: assets/photos/og.jpg")

#!/usr/bin/env python3
"""Проверка перед публикацией: все ли файлы из photos.js существуют.
Запуск из корня проекта: python3 tools/check.py"""
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(root, "assets/js/photos.js"), encoding="utf-8").read()
paths = re.findall(r'(?:edited|original):\s*"([^"]+)"', src)
missing = [p for p in paths if not os.path.isfile(os.path.join(root, p))]
big = [p for p in paths if os.path.isfile(os.path.join(root, p)) and os.path.getsize(os.path.join(root, p)) > 50*1024*1024]
print(f"Записей в photos.js: {len(paths)//2}, файлов проверено: {len(paths)}")
for p in missing: print("НЕТ ФАЙЛА:", p)
for p in big: print("СЛИШКОМ БОЛЬШОЙ (>50 МБ, GitHub не примет):", p)
sys.exit(1 if missing or big else 0)

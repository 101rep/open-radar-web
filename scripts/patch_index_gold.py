# -*- coding: utf-8 -*-
import re

paths = [
    r"C:\Users\ktaeh\open-radar-web\index.html",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\index.html"
]

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()

    new_brand = '''<div class="brand-section" onclick="App.handleBrandSecretClick()" style="cursor: pointer;" title="오픈레이더 (비밀문자 입력)">
        <span class="brand-icon-insta" id="headerBrandIcon">📡</span>
        <h1 class="brand-title" id="headerBrandTitle">오픈레이더</h1>'''

    c = re.sub(
        r'<div class="brand-section">\s*<span class="brand-icon-insta">📡</span>\s*<h1 class="brand-title">오픈레이더</h1>',
        new_brand,
        c
    )

    c = re.sub(
        r'placeholder="대표자 마스터 코드 입력 [^"]*"',
        'placeholder="비밀문자 입력 (king / admin)"',
        c
    )

    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[OK] Patched {p}")

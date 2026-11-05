# -*- coding: utf-8 -*-
import re

paths = [
    r"C:\Users\ktaeh\open-radar-web\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app\src\main\assets\app.js"
]

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    c = re.sub(
        r"console\.log\([^\n;]*Cloud Live Sync[^\n;]*\);",
        "console.log('[Cloud Live Sync] ' + added + ' new stores loaded into radar.');",
        c
    )
    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[OK] Fixed {p}")

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
        r'let csvContent = "[^"]*영업제안메모[^"]*";',
        'let csvContent = "\\uFEFF관리번호,상호명,업종,인허가일자,D-Day,영업상태,영업면적,도로명주소,지번주소,전화번호,영업제안메모\\n";',
        c
    )
    # Also fix any multi-line unquoted string in downloadCsvBlob
    c = c.replace(
        'let csvContent = "\ufeff관리번호,상호명,업종,인허가일자,D-Day,영업상태,영업면적,도로명주소,지번주소,전화번호,영업제안메모\n";',
        'let csvContent = "\\uFEFF관리번호,상호명,업종,인허가일자,D-Day,영업상태,영업면적,도로명주소,지번주소,전화번호,영업제안메모\\n";'
    )
    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[OK] Fixed csvContent line in {p}")

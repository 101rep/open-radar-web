# -*- coding: utf-8 -*-
paths = [
    r"C:\Users\ktaeh\open-radar-web\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app\src\main\assets\app.js"
]

header_line = '    let csvContent = "\\uFEFF관리번호,상호명,업종,인허가일자,D-Day,영업상태,영업면적,도로명주소,지번주소,전화번호,영업제안메모\\n";\n'

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'function downloadCsvBlob(list, filename)' in line:
            new_lines.append(line)
            # Replace next 2 lines (broken csvContent string)
            new_lines.append(header_line)
            i += 1
            # Skip until list.forEach
            while i < len(lines) and 'list.forEach' not in lines[i]:
                i += 1
            continue
        elif 'csvContent += row.join' in line:
            new_lines.append('      csvContent += row.join(",") + "\\n";\n')
            i += 1
            continue
        new_lines.append(line)
        i += 1

    with open(p, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print(f"[OK] Fixed csvContent in {p}")

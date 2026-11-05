# -*- coding: utf-8 -*-
import json
import sys
from collections import Counter

with open(r"C:\Users\ktaeh\open-radar-web\live_businesses.json", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total records in live_businesses.json: {len(data)}")

# Check unique IDs
ids = [x["id"] for x in data if "id" in x]
print(f"Unique IDs: {len(set(ids))} / {len(ids)}")

# Check duplicate names in same address prefix
key_counts = Counter()
for x in data:
    name = (x.get("business_name") or "").strip()
    addr = (x.get("address_road") or x.get("address_jibun") or "").strip()
    prefix = " ".join(addr.split()[:4])
    key = f"{name}:::{prefix}"
    key_counts[key] += 1

dups = {k: v for k, v in key_counts.items() if v > 1}
print(f"Duplicate (name + addr_prefix) count: {len(dups)}")

# Check Gyeonggi distribution
gg_districts = [
    "수원", "용인", "고양", "화성", "성남", "부천", "남양주", "안산", "평택", "안양",
    "시흥", "파주", "김포", "의정부", "광주", "하남", "광명", "군포", "양주", "오산",
    "이천", "안성", "구리", "의왕", "포천", "양평", "여주", "동두천", "가평", "과천", "연천"
]

gg_counts = Counter()
for b in data:
    addr = (b.get("address_road") or b.get("address_jibun") or "")
    for d in gg_districts:
        if d in addr:
            gg_counts[d] += 1
            break

out = []
for d in gg_districts:
    out.append(f"{d}: {gg_counts[d]}개")
sys.stdout.buffer.write((" | ".join(out) + "\n").encode("utf-8"))

# Check Seoul distribution
seoul_gu = [
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
    "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
]

seoul_counts = Counter()
for b in data:
    addr = (b.get("address_road") or b.get("address_jibun") or "")
    for g in seoul_gu:
        if g in addr:
            seoul_counts[g] += 1
            break

out_s = []
for g in seoul_gu:
    out_s.append(f"{g}: {seoul_counts[g]}개")
sys.stdout.buffer.write((" | ".join(out_s) + "\n").encode("utf-8"))

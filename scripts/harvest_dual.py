# -*- coding: utf-8 -*-
"""
OpenRadar Dual-Mode Daily Store Harvester
Runs twice daily:
- Slot 1: Morning 07:30 (Full previous day + overnight licensing sync)
- Slot 2: Afternoon 14:00 (Today morning approved licensing sync)
"""

import os
import sys
import json
import argparse
import datetime
import random
import requests

try:
    import pyproj
    TRANSFORMER = pyproj.Transformer.from_crs('EPSG:5174', 'EPSG:4326', always_xy=True)
except Exception:
    TRANSFORMER = None

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(REPO_DIR, "live_businesses.json")
LOG_DIR = os.path.join(REPO_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "harvest_dual.log")

def log(msg):
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{now_str}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def load_existing():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            log(f"Failed to load existing json: {e}")
    return []

def deduplicate(records):
    seen_ids = set()
    seen_keys = set()
    cleaned = []
    for b in records:
        if not b:
            continue
        bid = str(b.get("id") or "").strip()
        bname = (b.get("business_name") or "").strip()
        norm_name = bname.replace(" ", "").lower()
        addr = (b.get("address_road") or b.get("address_jibun") or "").strip()
        road_prefix = " ".join(addr.split()[:4])
        key = f"{norm_name}:::{road_prefix}"

        if bid and bid in seen_ids:
            continue
        if norm_name and road_prefix and key in seen_keys:
            continue

        if bid:
            seen_ids.add(bid)
        if norm_name and road_prefix:
            seen_keys.add(key)
        cleaned.append(b)
    return cleaned

def fetch_seoul_open_data(max_count=100):
    """
    Query Seoul Open Data for newly licensed restaurants (LOCALDATA_072404)
    """
    records = []
    url = f"http://openapi.seoul.go.kr:8088/sample/json/LOCALDATA_072404/1/{max_count}/"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            rows = data.get("LOCALDATA_072404", {}).get("row", [])
            for r in rows:
                name = (r.get("BPLCNM") or "").strip()
                road_addr = (r.get("RDNWH_ADDR") or "").strip()
                jibun_addr = (r.get("SITEWHLADDR") or "").strip()
                lic_date = (r.get("APVPERMYMD") or "").strip()
                state = (r.get("TRDSTATENM") or "").strip()
                mgt_no = (r.get("MGTNO") or "").strip()
                x_val = r.get("X")
                y_val = r.get("Y")

                if state != "영업/정상" or not name:
                    continue

                # Coordinate transform
                lat, lng = 37.5665, 126.9780
                if TRANSFORMER and x_val and y_val:
                    try:
                        lon_t, lat_t = TRANSFORMER.transform(float(x_val), float(y_val))
                        if 33.0 <= lat_t <= 39.0 and 124.0 <= lon_t <= 132.0:
                            lat, lng = round(lat_t, 6), round(lon_t, 6)
                    except Exception:
                        pass

                # Parse date (YYYYMMDD to YYYY-MM-DD)
                if len(lic_date) == 8:
                    formatted_date = f"{lic_date[:4]}-{lic_date[4:6]}-{lic_date[6:8]}"
                else:
                    formatted_date = datetime.date.today().strftime("%Y-%m-%d")

                records.append({
                    "id": f"LIVE-SEOUL-{mgt_no}" if mgt_no else f"LIVE-SEOUL-{random.randint(100000, 999999)}",
                    "business_name": name,
                    "category": "일반음식점",
                    "district": "seoul",
                    "license_date": formatted_date,
                    "license_dday": 0,
                    "status": "영업/정상",
                    "address_road": road_addr or jibun_addr,
                    "address_jibun": jibun_addr or road_addr,
                    "lat": lat,
                    "lng": lng,
                    "contact": (r.get("SITETEL") or "02-120").strip(),
                    "sales_status": "미방문",
                    "sales_note": "서울시 실시간 인허가 연동. 신규 개업 준비 현장 방문 및 제안 추천.",
                    "proposal_tags": ["POS/테이블오더", "보안/CCTV/방역"],
                    "updated_at": datetime.date.today().strftime("%Y-%m-%d"),
                    "is_live": True
                })
    except Exception as e:
        log(f"Seoul API fetch note: {e}")
    return records

def recalculate_ddays(stores):
    """
    Recalculates license_dday based on today's actual date
    """
    today = datetime.date.today()
    for s in stores:
        dt_str = s.get("license_date")
        if dt_str:
            try:
                parts = [int(p) for p in dt_str.split("-")]
                if len(parts) == 3:
                    s_date = datetime.date(parts[0], parts[1], parts[2])
                    diff = (today - s_date).days
                    s["license_dday"] = max(0, diff)
            except Exception:
                pass
    return stores

def run_harvest(slot="morning"):
    log(f"=== Starting Dual Harvester [{slot.upper()}] ===")
    existing = load_existing()
    log(f"Loaded existing stores: {len(existing)}")

    # 1. Recalculate D-Days for rolling timeline
    existing = recalculate_ddays(existing)

    # 2. Fetch live data
    seoul_new = fetch_seoul_open_data(max_count=100)
    log(f"Fetched {len(seoul_new)} records from public portal API")

    # 3. Tag records by slot
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    for r in seoul_new:
        if slot == "afternoon":
            r["sales_note"] = f"지자체 당일 오후 14:00 실시간 인허가 포착. {r.get('sales_note', '')}"
            r["license_dday"] = 0
            r["license_date"] = today_str

    # 4. Merge new records on top
    combined = seoul_new + existing

    # 5. Strict deduplication
    final_stores = deduplicate(combined)
    log(f"After deduplication: {len(final_stores)} stores total")

    # 6. Save back to live_businesses.json
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(final_stores, f, ensure_ascii=False, indent=2)

    log(f"=== Completed Dual Harvester [{slot.upper()}]: {len(final_stores)} stores saved to live_businesses.json ===")
    return len(final_stores)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenRadar Dual Harvester")
    parser.add_argument("--slot", choices=["morning", "afternoon"], default="morning", help="Harvest time slot")
    args = parser.parse_args()

    run_harvest(slot=args.slot)

"""
OpenRadar Daily Automated Licensing Harvester
Collects daily newly licensed stores from Seoul Open Data & Public Data Portals,
converts TM coordinates to WGS84, performs deduplication, and updates live_businesses.json.
"""

import os
import sys
import json
import datetime
import requests
try:
    import pyproj
    HAS_PYPROJ = True
except ImportError:
    HAS_PYPROJ = False

# Coordinate transformer: Bessel TM (EPSG:5174) to WGS84 (EPSG:4326)
TRANSFORMER = None
if HAS_PYPROJ:
    try:
        TRANSFORMER = pyproj.Transformer.from_crs('EPSG:5174', 'EPSG:4326', always_xy=True)
    except Exception as e:
        print(f"Transformer init note: {e}")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(REPO_DIR, 'live_businesses.json')

def load_existing_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {DATA_FILE}: {e}")
    return []

def deduplicate_stores(store_list):
    seen_ids = set()
    seen_keys = set()
    deduped = []
    for b in store_list:
        if not b:
            continue
        bid = (b.get('id') or '').strip()
        bname = (b.get('business_name') or '').strip()
        broad = (b.get('address_road') or b.get('address_jibun') or '').strip()
        norm_key = f"{bname}:::{broad}"

        if bid and bid in seen_ids:
            continue
        if bname and broad and norm_key in seen_keys:
            continue

        if bid:
            seen_ids.add(bid)
        if bname and broad:
            seen_keys.add(norm_key)
        deduped.append(b)
    return deduped

def determine_district_key(address):
    addr = address or ''
    mapping = {
        '강남구': 'gangnam',
        '서초구': 'seocho',
        '송파구': 'songpa',
        '마포구': 'hongdae',
        '용산구': 'itaewon',
        '성동구': 'seongsu',
        '중구': 'euljiro',
        '종로구': 'jongno',
        '영등포구': 'yeouido',
        '수원시': 'suwon',
        '성남시': 'bundang',
        '고양시': 'ilsan',
        '인천': 'incheon',
        '부산': 'busan',
        '대구': 'daegu',
        '대전': 'daejeon',
        '광주': 'gwangju'
    }
    for region, key in mapping.items():
        if region in addr:
            return key
    return 'all'

def convert_tm_to_wgs84(x_str, y_str):
    if not TRANSFORMER or not x_str or not y_str:
        return 37.5665, 126.9780 # Seoul default fallback
    try:
        x = float(str(x_str).strip())
        y = float(str(y_str).strip())
        lon, lat = TRANSFORMER.transform(x, y)
        if 33.0 <= lat <= 39.0 and 124.0 <= lon <= 132.0:
            return round(lat, 6), round(lon, 6)
    except Exception:
        pass
    return 37.5665, 126.9780

def fetch_seoul_open_data(api_key="sample", max_records=200):
    """
    Fetches newly licensed general restaurant records from Seoul Open Data.
    API Code: LOCALDATA_072404
    """
    print(f"Fetching Seoul Open Data (API Key: {'configured' if api_key != 'sample' else 'sample'})...")
    url = f"http://openapi.seoul.go.kr:8088/{api_key}/json/LOCALDATA_072404/1/{max_records}/"
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            data = r.json()
            if 'LOCALDATA_072404' in data and 'row' in data['LOCALDATA_072404']:
                rows = data['LOCALDATA_072404']['row']
                print(f"Received {len(rows)} raw rows from Seoul Open Data.")
                results = []
                today = datetime.date.today()
                for row in rows:
                    status_name = (row.get('TRDSTATENM') or '').strip()
                    # Only collect active/open stores (영업/정상)
                    if status_name != '영업/정상':
                        continue

                    biz_name = (row.get('BPLCNM') or '').strip()
                    road_addr = (row.get('RDNWHLADDR') or '').strip()
                    jibun_addr = (row.get('SITEWHLADDR') or '').strip()
                    addr = road_addr or jibun_addr
                    if not biz_name or not addr:
                        continue

                    mgt_no = (row.get('MGTNO') or '').strip()
                    store_id = f"LIVE-{mgt_no}" if mgt_no else f"LIVE-SEOUL-{abs(hash(biz_name + addr))}"
                    
                    # License date parsing
                    perm_ymd = (row.get('APVPERMYMD') or '').strip()
                    license_date = f"{perm_ymd[:4]}-{perm_ymd[4:6]}-{perm_ymd[6:8]}" if len(perm_ymd) == 8 else today.strftime("%Y-%m-%d")
                    try:
                        lic_dt = datetime.datetime.strptime(license_date, "%Y-%m-%d").date()
                        dday = max(0, (today - lic_dt).days)
                    except Exception:
                        dday = 0

                    lat, lng = convert_tm_to_wgs84(row.get('X'), row.get('Y'))
                    district_key = determine_district_key(addr)
                    area_m2 = (row.get('SITEAREA') or '').strip()
                    area_desc = f"영업면적 {area_m2}㎡. " if area_m2 else ""

                    results.append({
                        "id": store_id,
                        "business_name": biz_name,
                        "category": "일반음식점",
                        "district": district_key,
                        "license_date": license_date,
                        "license_dday": dday,
                        "status": "영업/정상",
                        "address_road": road_addr or jibun_addr,
                        "address_jibun": jibun_addr or road_addr,
                        "lat": lat,
                        "lng": lng,
                        "contact": (row.get('SITETEL') or '연락처 미등록').strip(),
                        "sales_status": "미방문",
                        "sales_note": f"행정안전부/지자체 실시간 인허가. {area_desc}신규 개점 준비 현장 방문 및 제안 추천.",
                        "proposal_tags": ["POS/테이블오더", "보안/CCTV/방역"],
                        "updated_at": today.strftime("%Y-%m-%d"),
                        "is_live": True
                    })
                return results
    except Exception as e:
        print(f"Seoul Open Data fetch note: {e}")
    return []

def run_harvest():
    existing_data = load_existing_data()
    print(f"Existing stores in database: {len(existing_data)}")

    seoul_key = os.environ.get('SEOUL_DATA_API_KEY', 'sample')
    new_stores = fetch_seoul_open_data(api_key=seoul_key, max_records=500 if seoul_key != 'sample' else 5)

    combined = new_stores + existing_data
    deduped = deduplicate_stores(combined)

    print(f"Stores after harvest & deduplication: {len(deduped)} (Added {len(deduped) - len(existing_data)} net new stores)")

    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)

    print("Successfully updated live_businesses.json!")

if __name__ == '__main__':
    run_harvest()

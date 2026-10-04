// OpenRadar Nationwide Licensing DB & Persistence Module (v4)
const DEFAULT_BUSINESS_DB = [
  // ==========================================
  // 1. 서울특별시 (Seoul Metropolitan Area)
  // ==========================================
  // [서울 강남구]
  {
    id: "2026-SEOUL-010",
    business_name: "강남 테헤란로 프리미엄 스시야",
    category: "일반음식점",
    district: "gangnam",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "서울특별시 강남구 테헤란로 152",
    address_jibun: "서울특별시 강남구 역삼동 737",
    lat: 37.5005,
    lng: 127.0365,
    contact: "02-555-8812",
    sales_status: "미방문",
    sales_note: "오늘 인허가 등록! 하이엔드 오마카세. 수산물 식자재 공급 및 와인 리스트 제안 필수.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-011",
    business_name: "역삼 블루스퀘어 필라테스 & PT",
    category: "체육/기타",
    district: "gangnam",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "서울특별시 강남구 논현로85길 46",
    address_jibun: "서울특별시 강남구 역삼동 736-24",
    lat: 37.4982,
    lng: 127.0380,
    contact: "02-567-3390",
    sales_status: "방문예정",
    sales_note: "신축 빌딩 3층 전체 임차. 헬스기구 렌탈 및 출입 통제 지문인식기 상담.",
    proposal_tags: ["보안/CCTV/방역"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-012",
    business_name: "강남 파이낸스 에스프레소 바",
    category: "휴게음식점(카페)",
    district: "gangnam",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "서울특별시 강남구 테헤란로 142",
    address_jibun: "서울특별시 강남구 역삼동 736-1",
    lat: 37.5000,
    lng: 127.0350,
    contact: "02-508-4431",
    sales_status: "접촉중",
    sales_note: "직장인 테이크아웃 타깃. 일 300잔 예상. 베이커리 생지 및 우유 정기 배송 견적서 발송.",
    proposal_tags: ["식자재/원두납품"],
    updated_at: "2026-09-06"
  },
  {
    id: "2026-SEOUL-013",
    business_name: "청담 리젠트 피부과의원",
    category: "의원/병원",
    district: "gangnam",
    license_date: "2026-09-03",
    license_dday: 4,
    status: "영업/정상",
    address_road: "서울특별시 강남구 도산대로 411",
    address_jibun: "서울특별시 강남구 청담동 84-1",
    lat: 37.5235,
    lng: 127.0425,
    contact: "02-544-7700",
    sales_status: "계약성공",
    sales_note: "병원 마케팅 패키지 및 원내 음악 스트리밍 시스템 계약 체결.",
    proposal_tags: ["플레이스마케팅"],
    updated_at: "2026-09-05"
  },
  {
    id: "2026-SEOUL-014",
    business_name: "신사 가로수길 아뜰리에 부티크",
    category: "소매업/판매",
    district: "gangnam",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "서울특별시 강남구 압구정로12길 18",
    address_jibun: "서울특별시 강남구 신사동 541-11",
    lat: 37.5208,
    lng: 127.0229,
    contact: "02-540-3310",
    sales_status: "미방문",
    sales_note: "디자이너 브랜드 쇼룸 개업. 보안 CCTV 6대 및 카드 단말기 제안.",
    proposal_tags: ["보안/CCTV/방역", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },

  // [서울 성동구 (성수)]
  {
    id: "2026-SEOUL-001",
    business_name: "성수 오크 베이커리 & 로스터리",
    category: "휴게음식점(카페)",
    district: "seongsu",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "서울특별시 성동구 연무장길 42",
    address_jibun: "서울특별시 성동구 성수동2가 315-1",
    lat: 37.5445,
    lng: 127.0560,
    contact: "02-499-1234",
    sales_status: "미방문",
    sales_note: "연무장길 메인 동선 신축 코너 자리. 포스기 2대 및 주류/원두 납품 타깃.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-002",
    business_name: "무드 서울 성수 (모던 이탈리안)",
    category: "일반음식점",
    district: "seongsu",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "서울특별시 성동구 성수이로 88",
    address_jibun: "서울특별시 성동구 성수동2가 277-3",
    lat: 37.5422,
    lng: 127.0588,
    contact: "02-468-9821",
    sales_status: "방문예정",
    sales_note: "좌석 40석 규모 와인 다이닝. 테이블오더 및 세무기장 제안서 준비.",
    proposal_tags: ["POS/테이블오더", "세무/기장"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-003",
    business_name: "아틀리에 수 헤어살롱",
    category: "미용업(헤어/뷰티)",
    district: "seongsu",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "서울특별시 성동구 서울숲2길 19",
    address_jibun: "서울특별시 성동구 성수동1가 685-224",
    lat: 37.5468,
    lng: 127.0435,
    contact: "02-461-3312",
    sales_status: "미방문",
    sales_note: "오늘 신규 인허가 접수! 네이버 플레이스 마케팅 및 카드 단말기 급구 예상.",
    proposal_tags: ["플레이스마케팅", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-004",
    business_name: "서울숲 365 바른의원",
    category: "의원/병원",
    district: "seongsu",
    license_date: "2026-09-04",
    license_dday: 3,
    status: "영업/정상",
    address_road: "서울특별시 성동구 왕십리로 58",
    address_jibun: "서울특별시 성동구 성수동1가 656-335",
    lat: 37.5475,
    lng: 127.0450,
    contact: "02-2290-7575",
    sales_status: "접촉중",
    sales_note: "내과/이비인후과 의원. 청소용역 및 세무/노무 컨설팅 1차 미팅 진행 완료.",
    proposal_tags: ["보안/CCTV/방역", "세무/기장"],
    updated_at: "2026-09-06"
  },

  // [서울 영등포구 (여의도)]
  {
    id: "2026-SEOUL-020",
    business_name: "여의도 IFC 파이낸셜 라운지 펍",
    category: "일반음식점",
    district: "yeouido",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "서울특별시 영등포구 국제금융로 10",
    address_jibun: "서울특별시 영등포구 여의도동 23",
    lat: 37.5250,
    lng: 126.9255,
    contact: "02-6137-5000",
    sales_status: "미방문",
    sales_note: "IFC 인근 지하 1층 80평 규모. 생맥주 디스펜서 및 태블릿 오더 25대 견적.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-021",
    business_name: "더 파크 여의도 베이글 & 커피",
    category: "휴게음식점(카페)",
    district: "yeouido",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "서울특별시 영등포구 여의나루로 67",
    address_jibun: "서울특별시 영등포구 여의도동 25-4",
    lat: 37.5230,
    lng: 126.9270,
    contact: "02-780-1290",
    sales_status: "접촉중",
    sales_note: "여의도역 출구 앞. 조식 샌드위치 납품 및 키오스크 2대 제안서 검토중.",
    proposal_tags: ["POS/테이블오더"],
    updated_at: "2026-09-07"
  },

  // [서울 마포구 (홍대/합정)]
  {
    id: "2026-SEOUL-030",
    business_name: "홍대 어반 레코드 바이닐 바",
    category: "일반음식점",
    district: "hongdae",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "서울특별시 마포구 와우산로29길 14",
    address_jibun: "서울특별시 마포구 서교동 330-14",
    lat: 37.5540,
    lng: 126.9280,
    contact: "02-332-9011",
    sales_status: "미방문",
    sales_note: "홍대 예술거리 인근 감성 음악 칵테일바. 음향기기 렌탈 및 네온사인 간판.",
    proposal_tags: ["인테리어/간판", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-031",
    business_name: "연남 오디너리 브런치 & 티",
    category: "휴게음식점(카페)",
    district: "hongdae",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "서울특별시 마포구 동교로 242-4",
    address_jibun: "서울특별시 마포구 연남동 228-40",
    lat: 37.5610,
    lng: 126.9245,
    contact: "02-334-1188",
    sales_status: "방문예정",
    sales_note: "연트럴파크 단독주택 리모델링 카페. 야외 테라스 어닝 및 식자재 납품.",
    proposal_tags: ["식자재/원두납품"],
    updated_at: "2026-09-06"
  },

  // [서울 중구 (을지로/명동)]
  {
    id: "2026-SEOUL-040",
    business_name: "을지로 힙지로 양조장 & 탭룸",
    category: "일반음식점",
    district: "euljiro",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "서울특별시 중구 을지로12길 28",
    address_jibun: "서울특별시 중구 을지로3가 259-1",
    lat: 37.5660,
    lng: 126.9925,
    contact: "02-2275-8840",
    sales_status: "접촉중",
    sales_note: "노포 골목 3층 신규 인허가. 테이블마다 QR 무선결제 시스템 도입 관심.",
    proposal_tags: ["POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-041",
    business_name: "명동 K-뷰티 셀렉트 스튜디오",
    category: "소매업/판매",
    district: "euljiro",
    license_date: "2026-09-04",
    license_dday: 3,
    status: "영업/정상",
    address_road: "서울특별시 중구 명동8길 35",
    address_jibun: "서울특별시 중구 명동2가 32-1",
    lat: 37.5620,
    lng: 126.9850,
    contact: "02-778-5520",
    sales_status: "계약성공",
    sales_note: "외국인 관광객 면세 사후환급(Tax Free) 솔루션 및 단말기 공급 완료.",
    proposal_tags: ["POS/테이블오더"],
    updated_at: "2026-09-05"
  },

  // [서울 송파구 / 서초구]
  {
    id: "2026-SEOUL-050",
    business_name: "잠실 송리단길 마카롱 베이커리",
    category: "휴게음식점(카페)",
    district: "songpa",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "서울특별시 송파구 백제고분로45길 22",
    address_jibun: "서울특별시 송파구 송파동 48-7",
    lat: 37.5098,
    lng: 127.1082,
    contact: "02-412-8822",
    sales_status: "미방문",
    sales_note: "송리단길 메인 골목 신규 개업. 배달의민족/쿠팡이츠 POS 및 원두 정기공급 타깃.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-SEOUL-051",
    business_name: "서초 강남대로 바른정형외과",
    category: "의원/병원",
    district: "seocho",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "서울특별시 서초구 강남대로 381",
    address_jibun: "서울특별시 서초구 서초동 1317",
    lat: 37.4981,
    lng: 127.0261,
    contact: "02-532-9090",
    sales_status: "방문예정",
    sales_note: "강남역 9번 출구 메디컬 빌딩 4층 신규 개원. 공기청정 방역 렌탈 및 세무기장 제안.",
    proposal_tags: ["보안/CCTV/방역", "세무/기장"],
    updated_at: "2026-09-07"
  },

  // ==========================================
  // 2. 경기도 (Gyeonggi Metropolitan Area)
  // ==========================================
  // [경기 남양주시]
  {
    id: "2026-GYEONGGI-001",
    business_name: "다산 센트럴 화덕피자 & 파스타",
    category: "일반음식점",
    district: "namyangju",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "경기도 남양주시 다산중앙로123번길 22",
    address_jibun: "경기도 남양주시 다산동 6088",
    lat: 37.6105,
    lng: 127.1590,
    contact: "031-555-7890",
    sales_status: "미방문",
    sales_note: "다산신도시 중심상가 1층. 화덕 설치 신규 오픈! 테이블오더 18대 및 식자재 공급 타깃.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-002",
    business_name: "남양주 호평 베이커리 카페 숲",
    category: "휴게음식점(카페)",
    district: "namyangju",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "경기도 남양주시 늘을2로 14",
    address_jibun: "경기도 남양주시 호평동 640-1",
    lat: 37.6521,
    lng: 127.2422,
    contact: "031-591-3320",
    sales_status: "방문예정",
    sales_note: "평내호평역 인근 대형 카페. 2층 규모. 원두 40kg 정기납품 및 제빙기 렌탈 견적.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-003",
    business_name: "별내 스테이 동물병원",
    category: "의원/병원",
    district: "namyangju",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "경기도 남양주시 별내5로 23",
    address_jibun: "경기도 남양주시 별내동 1006",
    lat: 37.6410,
    lng: 127.1180,
    contact: "031-528-9911",
    sales_status: "접촉중",
    sales_note: "별내 카페거리 인근 24시 동물병원. 방역 소독 및 CCTV 8대 설치 상담 진행중.",
    proposal_tags: ["보안/CCTV/방역", "플레이스마케팅"],
    updated_at: "2026-09-06"
  },

  // [경기 구리시]
  {
    id: "2026-GYEONGGI-010",
    business_name: "구리 갈매역 프리미엄 골프 아카데미",
    category: "체육/기타",
    district: "guri",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "경기도 구리시 갈매순환로 204",
    address_jibun: "경기도 구리시 갈매동 597",
    lat: 37.6320,
    lng: 127.1140,
    contact: "031-571-0988",
    sales_status: "미방문",
    sales_note: "갈매역 복합빌딩 5층 타석 15개 GDR 오픈. 출입키오스크 및 락커룸 CCTV 상담.",
    proposal_tags: ["보안/CCTV/방역", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-011",
    business_name: "구리 돌다리 숯불갈비",
    category: "일반음식점",
    district: "guri",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "경기도 구리시 검배로 12",
    address_jibun: "경기도 구리시 수택동 374-1",
    lat: 37.5990,
    lng: 127.1380,
    contact: "031-562-4411",
    sales_status: "방문예정",
    sales_note: "수택동 먹자골목 신축 입점. 60석 규모. 축산 도매 납품 및 식기세척기 렌탈.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },

  // [경기 화성시]
  {
    id: "2026-GYEONGGI-020",
    business_name: "동탄 호수공원 레이크뷰 다이닝",
    category: "일반음식점",
    district: "hwaseong",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "경기도 화성시 동탄순환대로 69",
    address_jibun: "경기도 화성시 송동 726-1",
    lat: 37.1685,
    lng: 127.1042,
    contact: "031-378-5520",
    sales_status: "미방문",
    sales_note: "동탄호수공원 조망 대형 패밀리 레스토랑. 태블릿 오더 30대 및 서빙로봇 2대 제안.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-021",
    business_name: "화성 팔탄 오토물류 정비센터",
    category: "소매업/판매",
    district: "hwaseong",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "경기도 화성시 팔탄면 마당바위로 28",
    address_jibun: "경기도 화성시 팔탄면 구장리 120",
    lat: 37.1642,
    lng: 126.9080,
    contact: "031-353-8822",
    sales_status: "방문예정",
    sales_note: "공단 진입로 대형 정비·유통센터. 화재보험 및 산업용 CCTV 12대 견적 타깃.",
    proposal_tags: ["보안/CCTV/방역", "세무/기장"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-022",
    business_name: "동탄 영천 테크노밸리 로스터리",
    category: "휴게음식점(카페)",
    district: "hwaseong",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "경기도 화성시 동탄첨단산업1로 51",
    address_jibun: "경기도 화성시 영천동 103",
    lat: 37.2140,
    lng: 127.0980,
    contact: "031-8015-7760",
    sales_status: "계약성공",
    sales_note: "지식산업센터 상주 인원 타깃. 키오스크 3대 및 원두 공급 계약 체결 완료.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-06"
  },

  // [경기 성남시 분당구 / 판교]
  {
    id: "2026-GYEONGGI-030",
    business_name: "판교 알파돔 테크 라운지 카페",
    category: "휴게음식점(카페)",
    district: "bundang",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "경기도 성남시 분당구 판교역로 145",
    address_jibun: "경기도 성남시 분당구 백현동 533",
    lat: 37.3942,
    lng: 127.1118,
    contact: "031-622-1100",
    sales_status: "미방문",
    sales_note: "IT 개발자 미팅 타깃 80평 대형 카페. 초고속 와이파이망 및 프리미엄 원두 납품.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-031",
    business_name: "정자 카페거리 프렌치 비스트로",
    category: "일반음식점",
    district: "bundang",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "경기도 성남시 분당구 정자일로 230",
    address_jibun: "경기도 성남시 분당구 정자동 14-3",
    lat: 37.3675,
    lng: 127.1085,
    contact: "031-715-4490",
    sales_status: "접촉중",
    sales_note: "정자역 인근 와인 페어링 다이닝. 테이블오더 14대 도입 상담 및 주류 공급 협의.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-06"
  },

  // [경기 수원시 팔달구 / 영통]
  {
    id: "2026-GYEONGGI-040",
    business_name: "수원 인계동 나이트라이프 펍",
    category: "일반음식점",
    district: "suwon",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "경기도 수원시 팔달구 효원로265번길 28",
    address_jibun: "경기도 수원시 팔달구 인계동 1120",
    lat: 37.2618,
    lng: 127.0315,
    contact: "031-233-6677",
    sales_status: "미방문",
    sales_note: "인계동 중심상권 2층 60평 신규 개업. 무선 테이블결제 단말기 20대 견적.",
    proposal_tags: ["POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-041",
    business_name: "수원 행궁동 한옥 베이커리",
    category: "휴게음식점(카페)",
    district: "suwon",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "경기도 수원시 팔달구 화서문로 42",
    address_jibun: "경기도 수원시 팔달구 장안동 288",
    lat: 37.2845,
    lng: 127.0135,
    contact: "031-248-1200",
    sales_status: "방문예정",
    sales_note: "행리단길 전통 한옥 개조 카페. 인스타 플레이스 마케팅 패키지 및 원두 납품.",
    proposal_tags: ["플레이스마케팅", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },

  // [경기 하남시 / 부천시]
  {
    id: "2026-GYEONGGI-050",
    business_name: "하남 미사호수공원 이탈리안 퀴진",
    category: "일반음식점",
    district: "hanam",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "경기도 하남시 미사강변중앙로 218",
    address_jibun: "경기도 하남시 망월동 1104",
    lat: 37.5645,
    lng: 127.1895,
    contact: "031-792-8810",
    sales_status: "미방문",
    sales_note: "미사역 상권 호수변 매장. 테이블오더 22대 및 수입 주류 납품 견적.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GYEONGGI-060",
    business_name: "부천 신중동역 스마트 필라테스",
    category: "체육/기타",
    district: "bucheon",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "경기도 부천시 원미구 길주로 280",
    address_jibun: "경기도 부천시 원미구 중동 1141",
    lat: 37.5032,
    lng: 126.7645,
    contact: "032-325-7799",
    sales_status: "접촉중",
    sales_note: "롯데백화점 인근 신규 오픈. 회원 전용 무인 지문인식 출입통제 및 CCTV 견적.",
    proposal_tags: ["보안/CCTV/방역"],
    updated_at: "2026-09-07"
  },

  // ==========================================
  // 3. 인천광역시 (Incheon Metropolitan City)
  // ==========================================
  {
    id: "2026-INCHEON-001",
    business_name: "송도 센트럴파크 오션 브런치",
    category: "일반음식점",
    district: "incheon",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "인천광역시 연수구 센트럴로 194",
    address_jibun: "인천광역시 연수구 송도동 23-4",
    lat: 37.3948,
    lng: 126.6389,
    contact: "032-831-2290",
    sales_status: "미방문",
    sales_note: "송도 센트럴파크 1층 테라스 매장. 포스기 2대 및 유럽 직수입 베이커리 생지 공급.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-INCHEON-002",
    business_name: "인천 부평 문화의거리 K-팝 스튜디오",
    category: "소매업/판매",
    district: "incheon",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "인천광역시 부평구 부평문화로 71",
    address_jibun: "인천광역시 부평구 부평동 212-1",
    lat: 37.4925,
    lng: 126.7240,
    contact: "032-504-8833",
    sales_status: "방문예정",
    sales_note: "1020 타깃 굿즈 및 네컷사진 매장. 무인 키오스크 4대 및 조명 인테리어.",
    proposal_tags: ["POS/테이블오더", "인테리어/간판"],
    updated_at: "2026-09-06"
  },

  // ==========================================
  // 4. 부산광역시 (Busan Metropolitan City)
  // ==========================================
  {
    id: "2026-BUSAN-001",
    business_name: "해운대 센텀 하이엔드 오마카세",
    category: "일반음식점",
    district: "busan",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "부산광역시 해운대구 센텀중앙로 78",
    address_jibun: "부산광역시 해운대구 우동 1466-1",
    lat: 35.1745,
    lng: 129.1290,
    contact: "051-744-8890",
    sales_status: "미방문",
    sales_note: "센텀 신세계 백화점 맞은편 고급 일식집. 수산 식자재 공급 및 프라이빗 룸 POS.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-BUSAN-002",
    business_name: "부산 서면 1번가 루프탑 라운지",
    category: "일반음식점",
    district: "busan",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "부산광역시 부산진구 서면로 39",
    address_jibun: "부산광역시 부산진구 부전동 242-1",
    lat: 35.1555,
    lng: 129.0578,
    contact: "051-808-1250",
    sales_status: "방문예정",
    sales_note: "서면 젊음의거리 7층 루프탑 펍. 테이블오더 28대 및 야외 조명/음향 렌탈.",
    proposal_tags: ["POS/테이블오더", "인테리어/간판"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-BUSAN-003",
    business_name: "광안리 오션뷰 스페셜티 로스터스",
    category: "휴게음식점(카페)",
    district: "busan",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "부산광역시 수영구 광안해변로 179",
    address_jibun: "부산광역시 수영구 광안동 193-2",
    lat: 35.1530,
    lng: 129.1185,
    contact: "051-755-3344",
    sales_status: "접촉중",
    sales_note: "광안대교 정면 조망 3층 카페. 에스프레소 머신 렌탈 및 네이버 플레이스 광고.",
    proposal_tags: ["식자재/원두납품", "플레이스마케팅"],
    updated_at: "2026-09-06"
  },

  // ==========================================
  // 5. 대구광역시 (Daegu Metropolitan City)
  // ==========================================
  {
    id: "2026-DAEGU-001",
    business_name: "대구 수성못 레이크사이드 스테이크하우스",
    category: "일반음식점",
    district: "daegu",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "대구광역시 수성구 용학로 106",
    address_jibun: "대구광역시 수성구 두산동 888",
    lat: 35.8285,
    lng: 128.6180,
    contact: "053-768-9900",
    sales_status: "미방문",
    sales_note: "수성못 유원지 조망 신축 2층 다이닝. 육류 직납품 및 테이블 키오스크 20대.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-DAEGU-002",
    business_name: "동성로 로데오 패션 셀렉트샵",
    category: "소매업/판매",
    district: "daegu",
    license_date: "2026-09-05",
    license_dday: 2,
    status: "영업/정상",
    address_road: "대구광역시 중구 동성로2길 45",
    address_jibun: "대구광역시 중구 삼덕동1가 18-5",
    lat: 35.8685,
    lng: 128.5995,
    contact: "053-421-5501",
    sales_status: "접촉중",
    sales_note: "동성로 핫플레이스 1층 편집매장. 무인 결제 단말기 및 매장 음악 스트리밍.",
    proposal_tags: ["POS/테이블오더"],
    updated_at: "2026-09-06"
  },

  // ==========================================
  // 6. 대전광역시 (Daejeon Metropolitan City)
  // ==========================================
  {
    id: "2026-DAEJEON-001",
    business_name: "대전 유성 봉명동 온천거리 베이커리",
    category: "휴게음식점(카페)",
    district: "daejeon",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "대전광역시 유성구 온천북로 33",
    address_jibun: "대전광역시 유성구 봉명동 640-1",
    lat: 36.3575,
    lng: 127.3420,
    contact: "042-822-7711",
    sales_status: "미방문",
    sales_note: "유성온천역 부근 1층 대형 베이커리. 베이커리 재료 및 포스기 3대 제안.",
    proposal_tags: ["식자재/원두납품", "POS/테이블오더"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-DAEJEON-002",
    business_name: "대전 둔산 갤러리아 앞 바른이치과의원",
    category: "의원/병원",
    district: "daejeon",
    license_date: "2026-09-04",
    license_dday: 3,
    status: "영업/정상",
    address_road: "대전광역시 서구 대덕대로 226",
    address_jibun: "대전광역시 서구 둔산동 1038",
    lat: 36.3530,
    lng: 127.3785,
    contact: "042-488-2875",
    sales_status: "계약성공",
    sales_note: "둔산 상업지구 메디컬 5층. 병원 전문 세무 기장 및 정수기/공기청정 렌탈 체결.",
    proposal_tags: ["세무/기장", "보안/CCTV/방역"],
    updated_at: "2026-09-05"
  },

  // ==========================================
  // 7. 광주광역시 (Gwangju Metropolitan City)
  // ==========================================
  {
    id: "2026-GWANGJU-001",
    business_name: "광주 상무지구 비즈니스 와인 다이닝",
    category: "일반음식점",
    district: "gwangju",
    license_date: "2026-09-07",
    license_dday: 0,
    status: "영업/정상",
    address_road: "광주광역시 서구 상무중앙로 72",
    address_jibun: "광주광역시 서구 치평동 1217-1",
    lat: 35.1530,
    lng: 126.8514,
    contact: "062-383-9988",
    sales_status: "미방문",
    sales_note: "광주시청 인근 직장인 타깃 50석 레스토랑. 태블릿 오더 15대 및 와인 공급 제안.",
    proposal_tags: ["POS/테이블오더", "식자재/원두납품"],
    updated_at: "2026-09-07"
  },
  {
    id: "2026-GWANGJU-002",
    business_name: "광주 첨단지구 시너지 라운지 바",
    category: "일반음식점",
    district: "gwangju",
    license_date: "2026-09-06",
    license_dday: 1,
    status: "영업/정상",
    address_road: "광주광역시 광산구 첨단중앙로116번길 19",
    address_jibun: "광주광역시 광산구 월계동 881-1",
    lat: 35.2165,
    lng: 126.8480,
    contact: "062-971-4422",
    sales_status: "방문예정",
    sales_note: "첨단 핫플 거리 복합상가 2층. 포스/테이블오더 및 간판 조명 설비 상담.",
    proposal_tags: ["POS/테이블오더", "인테리어/간판"],
    updated_at: "2026-09-07"
  }
];

const CATEGORY_COLORS = {
  '휴게음식점(카페)': { color: '#f59e0b', emoji: '☕', label: '카페' },
  '일반음식점': { color: '#ef4444', emoji: '🍽️', label: '음식점' },
  '미용업(헤어/뷰티)': { color: '#8b5cf6', emoji: '💇', label: '미용' },
  '의원/병원': { color: '#10b981', emoji: '🏥', label: '의원' },
  '소매업/판매': { color: '#0284c7', emoji: '🛍️', label: '소매' },
  '체육/기타': { color: '#6366f1', emoji: '🏋️', label: '체육' }
};

const DISTRICT_COORDS = {
  // 전국 중심 좌표 (South Korea nationwide center)
  all: { name: "전국 전체", centerLat: 36.3500, centerLng: 127.8000, zoom: 7 },

  // 서울 주요 권역
  gangnam: { name: "서울 강남구", centerLat: 37.5005, centerLng: 127.0365, zoom: 14 },
  seongsu: { name: "서울 성동구(성수)", centerLat: 37.5445, centerLng: 127.0540, zoom: 15 },
  yeouido: { name: "서울 영등포구(여의도)", centerLat: 37.5240, centerLng: 126.9260, zoom: 14 },
  hongdae: { name: "서울 마포구(홍대)", centerLat: 37.5550, centerLng: 126.9240, zoom: 15 },
  euljiro: { name: "서울 중구(을지로)", centerLat: 37.5650, centerLng: 126.9910, zoom: 15 },
  songpa: { name: "서울 송파구(잠실)", centerLat: 37.5130, centerLng: 127.1000, zoom: 14 },
  seocho: { name: "서울 서초구(강남대로)", centerLat: 37.4950, centerLng: 127.0200, zoom: 14 },

  // 경기 주요 권역
  namyangju: { name: "경기 남양주시", centerLat: 37.6360, centerLng: 127.2165, zoom: 13 },
  guri: { name: "경기 구리시", centerLat: 37.5943, centerLng: 127.1296, zoom: 14 },
  hwaseong: { name: "경기 화성시(동탄/팔탄)", centerLat: 37.1995, centerLng: 126.8315, zoom: 12 },
  bundang: { name: "경기 분당구(판교/정자)", centerLat: 37.3827, centerLng: 127.1189, zoom: 14 },
  suwon: { name: "경기 수원시(인계/행궁)", centerLat: 37.2636, centerLng: 127.0286, zoom: 13 },
  hanam: { name: "경기 하남시(미사)", centerLat: 37.5500, centerLng: 127.1900, zoom: 14 },
  bucheon: { name: "경기 부천시(중동)", centerLat: 37.5030, centerLng: 126.7660, zoom: 14 },

  // 광역 대도시 권역
  incheon: { name: "인천광역시(송도/부평)", centerLat: 37.4560, centerLng: 126.7052, zoom: 12 },
  busan: { name: "부산광역시(해운대/서면)", centerLat: 35.1796, centerLng: 129.0756, zoom: 12 },
  daegu: { name: "대구광역시(수성/동성로)", centerLat: 35.8714, centerLng: 128.6014, zoom: 12 },
  daejeon: { name: "대전광역시(유성/둔산)", centerLat: 36.3504, centerLng: 127.3845, zoom: 13 },
  gwangju: { name: "광주광역시(상무/첨단)", centerLat: 35.1595, centerLng: 126.8526, zoom: 13 }
};

// Storage Key (v4 - Nationwide Full Dataset Refresh)
const STORAGE_KEY = 'openradar_biz_data_v4';

function getStoredBusinesses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If cached data is present and contains full nationwide records (>= 25)
      if (Array.isArray(parsed) && parsed.length >= 25) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Storage read failed, using nationwide defaults', e);
  }
  // Initialize or upgrade with complete nationwide dataset
  saveStoredBusinesses(DEFAULT_BUSINESS_DB);
  return [...DEFAULT_BUSINESS_DB];
}

function saveStoredBusinesses(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage write failed', e);
  }
}

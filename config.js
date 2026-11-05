// OpenRadar Central Configuration & Constants Module
// 향후 설정 변경, 결제 플랜, 지원 지역, 법적 고지 정보 등을 손쉽게 관리할 수 있도록 중앙 집중화

const OpenRadarConfig = (function() {
  // 🏢 법적 사업자 정보 및 고객센터 정보
  const COMPANY_INFO = {
    corpName: "주식회사 티에이치",
    ceoName: "김태훈",
    bizNumber: "878-05-03614",
    mailOrderNumber: "제 2026-경기양주-2778 호",
    address: "경기도 양주시 회천중앙로249 106동 2601호",
    tel: "070-8064-0914",
    email: "kth.101rep@gmail.com",
    privacyOfficer: "김태훈",
    pgProvider: "NHN KCP / KG이니시스 / 토스페이먼츠"
  };

  // 🎁 무료 체험 및 멤버십 구독 설정
  const TRIAL_CONFIG = {
    trialDays: 10, // 무상 체험 기간 (10일)
    trialDurationMs: 10 * 24 * 60 * 60 * 1000,
    servicePeriodText: "결제일로부터 1개월간 (정기구독 시 1개월 단위 자동 갱신)",
    refundNoticeText: "결제일로부터 7일 이내 데이터 열람 또는 알림톡 발송 이력이 없는 경우 전액 환불 가능하며, 데이터 열람/다운로드 이력 발생 시 전자상거래법 제17조에 따라 환불이 제한되거나 잔여기간 일할 계산 후 환불됩니다. (접수: 고객센터 070-8064-0914 / kth.101rep@gmail.com)"
  };

  // 💳 결제 상품 카탈로그 (KG이니시스/포트원 P_CHKFAKE 사전 검증용)
  const PLAN_CATALOG = {
    '1개 구 올인원': { price: 9900, name: '1개 구 올인원 (월 9,900원)' },
    '권역 추가': { price: 5000, name: '권역 추가 (+5,000원/구)' },
    '광역 시·도 패키지': { price: 49000, name: '광역 시·도 패키지 (월 49,000원)' },
    '지역 독점 라이선스': { price: 39000, name: '지역 독점 라이선스 (월 39,000원)' }
  };

  // 🗺️ 2단계 계층형 전국 행정 권역 카탈로그 (시·도 -> 시·군·구)
  const REGION_HIERARCHY = {
    "전국": {
      name: "전국 전체",
      center: { lat: 36.3500, lng: 127.8000, zoom: 7 },
      subDistricts: [
        { name: "전국 전체 (All)", key: "ALL", lat: 36.3500, lng: 127.8000, zoom: 7 }
      ]
    },
    "서울": {
      name: "서울특별시",
      center: { lat: 37.5665, lng: 126.9780, zoom: 11 },
      subDistricts: [
        { name: "서울 전체", key: "서울", lat: 37.5665, lng: 126.9780, zoom: 11 },
        { name: "강남구", key: "강남구", lat: 37.5172, lng: 127.0473, zoom: 14 },
        { name: "강동구", key: "강동구", lat: 37.5301, lng: 127.1238, zoom: 14 },
        { name: "강북구", key: "강북구", lat: 37.6396, lng: 127.0255, zoom: 14 },
        { name: "강서구", key: "강서구", lat: 37.5509, lng: 126.8495, zoom: 14 },
        { name: "관악구", key: "관악구", lat: 37.4784, lng: 126.9516, zoom: 14 },
        { name: "광진구", key: "광진구", lat: 37.5385, lng: 127.0824, zoom: 14 },
        { name: "구로구", key: "구로구", lat: 37.4954, lng: 126.8874, zoom: 14 },
        { name: "금천구", key: "금천구", lat: 37.4568, lng: 126.8954, zoom: 14 },
        { name: "노원구", key: "노원구", lat: 37.6542, lng: 127.0568, zoom: 14 },
        { name: "도봉구", key: "도봉구", lat: 37.6688, lng: 127.0471, zoom: 14 },
        { name: "동대문구", key: "동대문구", lat: 37.5744, lng: 127.0397, zoom: 14 },
        { name: "동작구", key: "동작구", lat: 37.5124, lng: 126.9393, zoom: 14 },
        { name: "마포구", key: "마포구", lat: 37.5663, lng: 126.9016, zoom: 14 },
        { name: "서대문구", key: "서대문구", lat: 37.5791, lng: 126.9368, zoom: 14 },
        { name: "서초구", key: "서초구", lat: 37.4837, lng: 127.0324, zoom: 14 },
        { name: "성동구", key: "성동구", lat: 37.5633, lng: 127.0371, zoom: 14 },
        { name: "성북구", key: "성북구", lat: 37.5891, lng: 127.0182, zoom: 14 },
        { name: "송파구", key: "송파구", lat: 37.5145, lng: 127.1066, zoom: 14 },
        { name: "양천구", key: "양천구", lat: 37.5169, lng: 126.8665, zoom: 14 },
        { name: "영등포구", key: "영등포구", lat: 37.5264, lng: 126.8962, zoom: 14 },
        { name: "용산구", key: "용산구", lat: 37.5326, lng: 126.9900, zoom: 14 },
        { name: "은평구", key: "은평구", lat: 37.6027, lng: 126.9291, zoom: 14 },
        { name: "종로구", key: "종로구", lat: 37.5730, lng: 126.9794, zoom: 14 },
        { name: "중구", key: "중구", lat: 37.5641, lng: 126.9979, zoom: 14 },
        { name: "중랑구", key: "중랑구", lat: 37.6066, lng: 127.0927, zoom: 14 }
      ]
    },
    "경기": {
      name: "경기도",
      center: { lat: 37.4138, lng: 127.5183, zoom: 10 },
      subDistricts: [
        { name: "경기 전체", key: "경기", lat: 37.4138, lng: 127.5183, zoom: 10 },
        { name: "의정부시", key: "의정부시", lat: 37.7381, lng: 127.0337, zoom: 13 },
        { name: "양주시", key: "양주시", lat: 37.7853, lng: 127.0458, zoom: 13 },
        { name: "남양주시", key: "남양주시", lat: 37.6360, lng: 127.2165, zoom: 13 },
        { name: "구리시", key: "구리시", lat: 37.5943, lng: 127.1296, zoom: 14 },
        { name: "고양시", key: "고양시", lat: 37.6584, lng: 126.8320, zoom: 13 },
        { name: "파주시", key: "파주시", lat: 37.7600, lng: 126.7799, zoom: 13 },
        { name: "포천시", key: "포천시", lat: 37.8949, lng: 127.2003, zoom: 12 },
        { name: "동두천시", key: "동두천시", lat: 37.9035, lng: 127.0607, zoom: 13 },
        { name: "가평군", key: "가평군", lat: 37.8315, lng: 127.5097, zoom: 12 },
        { name: "연천군", key: "연천군", lat: 38.0964, lng: 127.0748, zoom: 12 },
        { name: "수원시", key: "수원시", lat: 37.2636, lng: 127.0286, zoom: 13 },
        { name: "성남시(분당)", key: "성남시", lat: 37.4200, lng: 127.1265, zoom: 13 },
        { name: "용인시", key: "용인시", lat: 37.2411, lng: 127.1776, zoom: 13 },
        { name: "화성시", key: "화성시", lat: 37.1995, lng: 126.8315, zoom: 12 },
        { name: "부천시", key: "부천시", lat: 37.5030, lng: 126.7660, zoom: 14 },
        { name: "안산시", key: "안산시", lat: 37.3219, lng: 126.8309, zoom: 13 },
        { name: "평택시", key: "평택시", lat: 36.9921, lng: 127.1129, zoom: 13 },
        { name: "안양시", key: "안양시", lat: 37.3943, lng: 126.9568, zoom: 14 },
        { name: "시흥시", key: "시흥시", lat: 37.3802, lng: 126.8029, zoom: 13 },
        { name: "김포시", key: "김포시", lat: 37.6153, lng: 126.7157, zoom: 13 },
        { name: "광주시", key: "광주시", lat: 37.4294, lng: 127.2551, zoom: 13 },
        { name: "하남시", key: "하남시", lat: 37.5500, lng: 127.1900, zoom: 14 },
        { name: "광명시", key: "광명시", lat: 37.4786, lng: 126.8644, zoom: 14 },
        { name: "군포시", key: "군포시", lat: 37.3616, lng: 126.9352, zoom: 14 },
        { name: "이천시", key: "이천시", lat: 37.2723, lng: 127.4350, zoom: 13 },
        { name: "오산시", key: "오산시", lat: 37.1498, lng: 127.0772, zoom: 14 },
        { name: "안성시", key: "안성시", lat: 37.0080, lng: 127.2797, zoom: 13 },
        { name: "의왕시", key: "의왕시", lat: 37.3448, lng: 126.9683, zoom: 14 },
        { name: "양평군", key: "양평군", lat: 37.4917, lng: 127.4876, zoom: 12 },
        { name: "여주시", key: "여주시", lat: 37.2983, lng: 127.6372, zoom: 13 },
        { name: "과천시", key: "과천시", lat: 37.4292, lng: 126.9877, zoom: 14 }
      ]
    },
    "인천": {
      name: "인천광역시",
      center: { lat: 37.4560, lng: 126.7052, zoom: 11 },
      subDistricts: [
        { name: "인천 전체", key: "인천", lat: 37.4560, lng: 126.7052, zoom: 11 },
        { name: "부평구", key: "부평구", lat: 37.5074, lng: 126.7219, zoom: 14 },
        { name: "연수구(송도)", key: "연수구", lat: 37.4101, lng: 126.6783, zoom: 13 },
        { name: "남동구", key: "남동구", lat: 37.4470, lng: 126.7314, zoom: 13 },
        { name: "서구(청라)", key: "서구", lat: 37.5454, lng: 126.6760, zoom: 13 },
        { name: "미추홀구", key: "미추홀구", lat: 37.4635, lng: 126.6506, zoom: 14 },
        { name: "계양구", key: "계양구", lat: 37.5374, lng: 126.7378, zoom: 14 },
        { name: "중구/동구", key: "중구", lat: 37.4738, lng: 126.6215, zoom: 13 }
      ]
    },
    "부산": {
      name: "부산광역시",
      center: { lat: 35.1796, lng: 129.0756, zoom: 11 },
      subDistricts: [
        { name: "부산 전체", key: "부산", lat: 35.1796, lng: 129.0756, zoom: 11 },
        { name: "해운대구", key: "해운대구", lat: 35.1631, lng: 129.1636, zoom: 13 },
        { name: "부산진구(서면)", key: "부산진구", lat: 35.1584, lng: 129.0531, zoom: 14 },
        { name: "수영구(광안리)", key: "수영구", lat: 35.1456, lng: 129.1132, zoom: 14 },
        { name: "남구", key: "남구", lat: 35.1365, lng: 129.0842, zoom: 14 },
        { name: "동래구", key: "동래구", lat: 35.2048, lng: 129.0838, zoom: 14 }
      ]
    },
    "대구": {
      name: "대구광역시",
      center: { lat: 35.8714, lng: 128.6014, zoom: 11 },
      subDistricts: [
        { name: "대구 전체", key: "대구", lat: 35.8714, lng: 128.6014, zoom: 11 },
        { name: "수성구", key: "수성구", lat: 35.8580, lng: 128.6306, zoom: 13 },
        { name: "중구(동성로)", key: "중구", lat: 35.8694, lng: 128.5942, zoom: 14 },
        { name: "달서구", key: "달서구", lat: 35.8298, lng: 128.5327, zoom: 13 },
        { name: "북구", key: "북구", lat: 35.8856, lng: 128.5828, zoom: 13 }
      ]
    },
    "대전": {
      name: "대전광역시",
      center: { lat: 36.3504, lng: 127.3845, zoom: 12 },
      subDistricts: [
        { name: "대전 전체", key: "대전", lat: 36.3504, lng: 127.3845, zoom: 12 },
        { name: "유성구", key: "유성구", lat: 36.3622, lng: 127.3564, zoom: 13 },
        { name: "서구(둔산)", key: "서구", lat: 36.3553, lng: 127.3838, zoom: 14 },
        { name: "중구/동구", key: "중구", lat: 36.3250, lng: 127.4214, zoom: 13 }
      ]
    },
    "광주": {
      name: "광주광역시",
      center: { lat: 35.1595, lng: 126.8526, zoom: 12 },
      subDistricts: [
        { name: "광주 전체", key: "광주", lat: 35.1595, lng: 126.8526, zoom: 12 },
        { name: "서구(상무지구)", key: "서구", lat: 35.1520, lng: 126.8510, zoom: 14 },
        { name: "광산구(첨단)", key: "광산구", lat: 35.1950, lng: 126.8120, zoom: 13 },
        { name: "북구", key: "북구", lat: 35.1741, lng: 126.9121, zoom: 13 },
        { name: "동구/남구", key: "동구", lat: 35.1460, lng: 126.9231, zoom: 13 }
      ]
    }
  };

  // 평탄화된 단일 좌표 맵 (지도 이동 및 반경 계산용)
  const FLAT_DISTRICT_COORDS = {};
  Object.keys(REGION_HIERARCHY).forEach(reg => {
    const rInfo = REGION_HIERARCHY[reg];
    rInfo.subDistricts.forEach(sub => {
      FLAT_DISTRICT_COORDS[sub.name] = {
        name: sub.name,
        key: sub.key,
        region: reg,
        centerLat: sub.lat,
        centerLng: sub.lng,
        zoom: sub.zoom
      };
    });
  });

  return {
    COMPANY_INFO,
    TRIAL_CONFIG,
    PLAN_CATALOG,
    REGION_HIERARCHY,
    FLAT_DISTRICT_COORDS
  };
})();

if (typeof window !== 'undefined') {
  window.OpenRadarConfig = OpenRadarConfig;
}

// OpenRadar Kakao Integration Service
// Kakao Maps JavaScript SDK & Kakao Local REST API / Geocoding Module

const KakaoService = (function() {
  let isSdkLoading = false;
  let isSdkReady = false;

  // Retrieve stored keys (with default OpenRadar key fallback)
  function getJsKey() {
    return (localStorage.getItem('openradar_kakao_js_key') || localStorage.getItem('openradar_kakao_key') || '24593edda0f49725d21af2d4bfe7effc').trim();
  }

  function getRestKey() {
    return (localStorage.getItem('openradar_kakao_rest_key') || localStorage.getItem('openradar_kakao_key') || '6c770c94a0702147751bdbdf1f3dbc6b').trim();
  }

  // Check if SDK is available
  function isReady() {
    return isSdkReady && typeof window.kakao !== 'undefined' && typeof window.kakao.maps !== 'undefined';
  }

  // Dynamically load Kakao Maps JavaScript SDK
  function loadSdk(appKey) {
    const key = appKey || getJsKey();
    if (!key) {
      return Promise.reject(new Error('카카오 JavaScript 키가 설정되지 않았습니다.'));
    }

    if (isReady()) {
      return Promise.resolve(true);
    }

    if (isSdkLoading) {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (isReady()) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('SDK 로딩 시간 초과'));
        }, 8000);
      });
    }

    isSdkLoading = true;

    return new Promise((resolve, reject) => {
      // Remove any previously failed script
      const existingScript = document.getElementById('kakaoMapsSdkScript');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.id = 'kakaoMapsSdkScript';
      script.type = 'text/javascript';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services,clusterer&autoload=false`;

      script.onload = function() {
        if (typeof window.kakao !== 'undefined' && window.kakao.maps) {
          window.kakao.maps.load(() => {
            isSdkReady = true;
            isSdkLoading = false;
            console.log('✅ Kakao Maps SDK successfully loaded & initialized');
            resolve(true);
          });
        } else {
          isSdkLoading = false;
          reject(new Error('Kakao 객체를 찾을 수 없습니다. 도메인 등록 설정을 확인해주세요.'));
        }
      };

      script.onerror = function(err) {
        isSdkLoading = false;
        reject(new Error('카카오 지도 스크립트 로드에 실패했습니다. API 키 및 플랫폼 Web 도메인 설정을 확인해주세요.'));
      };

      document.head.appendChild(script);
    });
  }

  // Test Kakao REST API key via Local Address API
  async function testRestKey(keyToTest) {
    const key = (keyToTest || getRestKey()).trim();
    if (!key) {
      return { success: false, message: 'REST API 키를 입력해주세요.' };
    }

    try {
      const response = await fetch('https://dapi.kakao.com/v2/local/search/address.json?query=서울시청', {
        headers: {
          'Authorization': `KakaoAK ${key}`
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          message: '✅ 카카오 로컬 REST API 통신 성공! 정상 작동합니다.',
          data: data
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: '❌ 인증 실패 (401): 카카오 REST API 키가 올바르지 않습니다.'
        };
      } else {
        return {
          success: false,
          message: `❌ 카카오 서버 응답 오류 (HTTP ${response.status})`
        };
      }
    } catch (e) {
      return {
        success: false,
        message: `❌ 네트워크 통신 실패: ${e.message} (CORS 또는 오프라인 환경)`
      };
    }
  }

  // Geocoding: Search address and convert to Lat/Lng
  // 1st Priority: Kakao Maps Services Geocoder (Client-side, No CORS restriction)
  // 2nd Priority: Kakao Local REST API
  async function searchAddress(address) {
    if (!address || !address.trim()) {
      return { success: false, message: '주소를 입력해주세요.' };
    }

    const query = address.trim();

    // 1. Try SDK Geocoder if SDK is available
    if (isReady() && window.kakao.maps.services && window.kakao.maps.services.Geocoder) {
      try {
        const res = await new Promise((resolve, reject) => {
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(query, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
              const item = result[0];
              resolve({
                success: true,
                lat: parseFloat(item.y),
                lng: parseFloat(item.x),
                roadAddress: item.road_address ? item.road_address.address_name : query,
                jibunAddress: item.address ? item.address.address_name : query,
                source: 'kakao-sdk-geocoder'
              });
            } else {
              resolve(null);
            }
          });
        });

        if (res) return res;
      } catch (err) {
        console.warn('SDK Geocoder search failed, trying REST API fallback', err);
      }
    }

    // 2. Try REST API if REST Key exists
    const restKey = getRestKey();
    if (restKey) {
      try {
        const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `KakaoAK ${restKey}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.documents && data.documents.length > 0) {
            const item = data.documents[0];
            return {
              success: true,
              lat: parseFloat(item.y),
              lng: parseFloat(item.x),
              roadAddress: item.road_address ? item.road_address.address_name : query,
              jibunAddress: item.address ? item.address.address_name : query,
              source: 'kakao-rest-api'
            };
          }
        }
      } catch (e) {
        console.warn('Kakao REST API address search error:', e);
      }
    }

    return {
      success: false,
      message: '주소의 위경도 좌표를 찾을 수 없습니다. (카카오 API 키 또는 주소 확인 필요)'
    };
  }

  return {
    getJsKey,
    getRestKey,
    isReady,
    loadSdk,
    testRestKey,
    searchAddress
  };
})();

if (typeof window !== 'undefined') {
  window.KakaoService = KakaoService;
}

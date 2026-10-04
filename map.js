// OpenRadar High-Reliability Map Module
// 1st Priority: Native Kakao Maps SDK (Korea High-Definition Vector Map & Roadview)
// Fallback: Leaflet (OpenStreetMap) and Vector Radar Map

const MapModule = (function() {
  let activeMapType = 'none'; // 'kakao' | 'leaflet' | 'vector'
  let kakaoMap = null;
  let kakaoOverlays = [];
  let leafletMap = null;
  let leafletMarkers = [];
  let currentZoom = 1;
  let panX = 0;
  let panY = 0;
  let currentDistrict = 'all';

  async function init() {
    const container = document.getElementById('map');
    if (!container) return;

    // 1. Try Kakao Maps SDK first
    const jsKey = KakaoService.getJsKey();
    if (jsKey) {
      try {
        await KakaoService.loadSdk(jsKey);
        if (KakaoService.isReady()) {
          const success = initKakaoMap(container);
          if (success) {
            console.log('✅ Kakao Maps initialized successfully as primary map');
            return;
          }
        }
      } catch (err) {
        console.warn('Kakao Maps init failed, falling back to secondary maps:', err.message);
      }
    }

    // 2. Secondary: Leaflet (OpenStreetMap) if available online
    if (typeof window.L !== 'undefined') {
      try {
        leafletMap = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([37.5350, 127.0000], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(leafletMap);

        leafletMap.on('click', function() {
          App.closeQuickCard();
        });

        // 🔄 Leaflet moveend event
        leafletMap.on('moveend', function() {
          onMapMovedOrZoomed();
        });

        activeMapType = 'leaflet';
        console.log('Leaflet Map initialized as fallback');
        return;
      } catch (e) {
        console.warn('Leaflet init failed, falling back to Vector Radar Map', e);
      }
    }

    // 3. Last Resort: Built-in Interactive Seoul Commercial Radar Map
    initVectorRadarMap(container);
  }

  // --- KAKAO MAP INITIALIZATION & RENDERING ---
  function initKakaoMap(container) {
    if (typeof window.kakao === 'undefined' || !window.kakao.maps) return false;

    try {
      container.innerHTML = ''; // Clear container

      const mapOptions = {
        center: new kakao.maps.LatLng(37.5350, 127.0000), // Seoul Center
        level: 8 // Zoom level (1 to 14, lower is closer)
      };

      kakaoMap = new kakao.maps.Map(container, mapOptions);

      // Close drawer on map background click
      kakao.maps.event.addListener(kakaoMap, 'click', function() {
        App.closeQuickCard();
      });

      // 🔄 Auto-detect Map Pan / Drag and Zoom (화면 이동 시 현재 화면 기준 재탐색)
      kakao.maps.event.addListener(kakaoMap, 'dragend', function() {
        onMapMovedOrZoomed();
      });
      kakao.maps.event.addListener(kakaoMap, 'zoom_changed', function() {
        onMapMovedOrZoomed();
      });

      activeMapType = 'kakao';
      updateMapBadgeUI('카카오 지도 (HD)');
      return true;
    } catch (e) {
      console.error('Failed to instantiate Kakao Map:', e);
      return false;
    }
  }

  let moveDebounceTimer = null;

  function onMapMovedOrZoomed() {
    if (moveDebounceTimer) clearTimeout(moveDebounceTimer);
    moveDebounceTimer = setTimeout(() => {
      if (window.App && typeof window.App.onMapBoundsChanged === 'function') {
        const info = getMapCenterAndBounds();
        if (info) {
          window.App.onMapBoundsChanged(info);
        }
      }
    }, 300);
  }

  function getMapCenterAndBounds() {
    if (activeMapType === 'kakao' && kakaoMap) {
      const center = kakaoMap.getCenter();
      const bounds = kakaoMap.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      return {
        center: { lat: center.getLat(), lng: center.getLng() },
        bounds: {
          minLat: sw.getLat(),
          maxLat: ne.getLat(),
          minLng: sw.getLng(),
          maxLng: ne.getLng()
        },
        level: kakaoMap.getLevel()
      };
    }

    if (activeMapType === 'leaflet' && leafletMap) {
      const center = leafletMap.getCenter();
      const bounds = leafletMap.getBounds();
      return {
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast()
        },
        level: leafletMap.getZoom()
      };
    }

    return null;
  }

  function updateMapBadgeUI(label) {
    const badge = document.getElementById('mapEngineBadge');
    if (badge) {
      badge.textContent = `🗺️ ${label}`;
      badge.style.display = 'inline-flex';
    }
  }

  // Render Pins on Kakao Map
  function renderKakaoPins(businesses) {
    if (!kakaoMap) return;

    // Clear existing overlays
    kakaoOverlays.forEach(overlay => overlay.setMap(null));
    kakaoOverlays = [];

    businesses.forEach(b => {
      const catInfo = CATEGORY_COLORS[b.category] || { color: '#3b82f6', emoji: '📍' };
      const isD0 = b.license_dday === 0;

      // Custom Overlay HTML
      const content = document.createElement('div');
      content.className = 'kakao-marker-overlay';
      content.style.cursor = 'pointer';
      content.innerHTML = `
        <div class="custom-pin" style="background-color: ${catInfo.color};">
          ${isD0 ? '<div class="pulse-ring"></div>' : ''}
          <span>${catInfo.emoji}</span>
          <div class="dday-tag" style="background-color: ${isD0 ? '#ef4444' : '#1e293b'}">
            D-${b.license_dday}
          </div>
        </div>
        <div class="kakao-pin-tooltip">${b.business_name}</div>
      `;

      content.onclick = (e) => {
        e.stopPropagation();
        App.showQuickCard(b);
      };

      const position = new kakao.maps.LatLng(b.lat, b.lng);
      const overlay = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1.05,
        zIndex: isD0 ? 100 : 10
      });

      overlay.setMap(kakaoMap);
      kakaoOverlays.push(overlay);
    });
  }

  // Fallback: Vector Radar Map
  function initVectorRadarMap(container) {
    activeMapType = 'vector';
    updateMapBadgeUI('벡터 레이더 맵');
    container.innerHTML = `
      <div id="vectorRadarMap" class="fallback-map">
        <div class="seoul-grid"></div>
        <div class="han-river"></div>
        
        <div id="radarPinsContainer" style="position: absolute; inset: 0; transform-origin: center center; transition: transform 0.25s ease;">
          <!-- Pins rendered here -->
        </div>

        <div style="position: absolute; bottom: 8px; left: 12px; z-index: 10; font-size: 10px; color: #94a3b8; background: rgba(15,23,42,0.85); padding: 4px 10px; border-radius: 6px; border: 1px solid #334155;">
          📍 서울 전역 인허가 레이더 (카카오 키 등록 시 HD 카카오맵으로 자동 전환)
        </div>
      </div>
    `;

    setupVectorPan();
  }

  function setupVectorPan() {
    const radar = document.getElementById('vectorRadarMap');
    if (!radar) return;

    let isDown = false;
    let startX, startY;

    radar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.vector-pin-point')) return;
      isDown = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    });

    window.addEventListener('mouseup', () => isDown = false);
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    });

    radar.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDown = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => isDown = false);
    window.addEventListener('touchmove', (e) => {
      if (!isDown || e.touches.length !== 1) return;
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      applyTransform();
    }, { passive: true });
  }

  function applyTransform() {
    const layer = document.getElementById('radarPinsContainer');
    if (layer) {
      layer.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    }
  }

  // Render Fire Pins if Fire Radar is Active
  async function renderFirePinsUnified() {
    if (!window.App || !window.App.isFireRadarOn || !window.App.isFireRadarOn()) return;
    if (typeof FireRadarService === 'undefined') return;

    const fireList = await FireRadarService.fetchFireList('ALL');

    if (activeMapType === 'kakao' && kakaoMap) {
      fireList.forEach(f => {
        const content = document.createElement('div');
        content.className = 'kakao-marker-overlay';
        content.style.cursor = 'pointer';
        content.innerHTML = `
          <div class="fire-pin">
            <span>🔥</span>
            <div style="position:absolute; top:-7px; right:-7px; font-size:8px; font-weight:900; padding:1px 5px; border-radius:999px; background:#ef4444; color:#fff; border:1px solid #fee500; animation:pulse 1s infinite;">
              화재
            </div>
          </div>
          <div class="kakao-pin-tooltip" style="color: #fef08a; background: rgba(185,28,28,0.95);">${f.title}</div>
        `;
        content.onclick = (e) => {
          e.stopPropagation();
          App.showFireQuickCard(f);
        };
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(f.lat, f.lng),
          content: content,
          yAnchor: 1.05,
          zIndex: 9999
        });
        overlay.setMap(kakaoMap);
        kakaoOverlays.push(overlay);
      });
      return;
    }

    if (activeMapType === 'leaflet' && leafletMap) {
      fireList.forEach(f => {
        const iconHtml = `
          <div class="fire-pin">
            <span>🔥</span>
            <div style="position:absolute; top:-7px; right:-7px; font-size:8px; font-weight:900; padding:1px 5px; border-radius:999px; background:#ef4444; color:#fff; border:1px solid #fee500;">
              화재
            </div>
          </div>
        `;
        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-pin-wrap',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        const marker = L.marker([f.lat, f.lng], { icon: icon, zIndexOffset: 1000 });
        marker.on('click', () => {
          App.showFireQuickCard(f);
        });
        marker.addTo(leafletMap);
        leafletMarkers.push(marker);
      });
      return;
    }

    // Vector Map
    const container = document.getElementById('radarPinsContainer');
    if (!container) return;
    const minLat = 37.4700, maxLat = 37.5850;
    const minLng = 126.9000, maxLng = 127.1200;

    fireList.forEach(f => {
      const xPct = Math.max(5, Math.min(95, 10 + ((f.lng - minLng) / (maxLng - minLng)) * 80));
      const yPct = Math.max(5, Math.min(95, 90 - ((f.lat - minLat) / (maxLat - minLat)) * 80));
      const fireEl = document.createElement('div');
      fireEl.className = 'vector-pin-point';
      fireEl.style.left = `${xPct}%`;
      fireEl.style.top = `${yPct}%`;
      fireEl.style.zIndex = '9999';
      fireEl.innerHTML = `
        <div class="pin-bubble" style="background: linear-gradient(135deg, #ef4444, #b91c1c); border: 2px solid #fef08a;">
          <span>🔥</span>
          <div style="position:absolute; top:-7px; right:-7px; font-size:8px; font-weight:800; padding:1px 4px; border-radius:999px; background:#ef4444; color:#fff; border:1px solid #fee500;">화재</div>
        </div>
        <div class="pin-name-tag" style="background:#7f1d1d; color:#fef08a; border-color:#ef4444;">${f.title}</div>
      `;
      fireEl.onclick = () => App.showFireQuickCard(f);
      container.appendChild(fireEl);
    });
  }

  // Unified Render function
  function render(businesses) {
    if (activeMapType === 'kakao' && kakaoMap) {
      renderKakaoPins(businesses);
      renderFirePinsUnified();
      return;
    }

    if (activeMapType === 'leaflet' && leafletMap) {
      leafletMarkers.forEach(m => leafletMap.removeLayer(m));
      leafletMarkers = [];

      businesses.forEach(b => {
        const catInfo = CATEGORY_COLORS[b.category] || { color: '#3b82f6', emoji: '📍' };
        const isD0 = b.license_dday === 0;

        const iconHtml = `
          <div class="custom-pin" style="background-color: ${catInfo.color};">
            ${isD0 ? '<div class="pulse-ring"></div>' : ''}
            <span>${catInfo.emoji}</span>
            <div class="dday-tag" style="background-color: ${isD0 ? '#ef4444' : '#1e293b'}">
              D-${b.license_dday}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-pin-wrap',
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });

        const marker = L.marker([b.lat, b.lng], { icon: icon });
        marker.on('click', () => {
          App.showQuickCard(b);
        });

        marker.addTo(leafletMap);
        leafletMarkers.push(marker);
      });
      renderFirePinsUnified();
      return;
    }

    // Vector Map Rendering
    const container = document.getElementById('radarPinsContainer');
    if (!container) return;

    let minLat = 35.1, maxLat = 37.7;
    let minLng = 126.6, maxLng = 129.2;
    if (businesses.length > 0) {
      const lats = businesses.map(b => b.lat);
      const lngs = businesses.map(b => b.lng);
      minLat = Math.min(...lats) - 0.02;
      maxLat = Math.max(...lats) + 0.02;
      minLng = Math.min(...lngs) - 0.02;
      maxLng = Math.max(...lngs) + 0.02;
      if (maxLat === minLat) { maxLat += 0.04; minLat -= 0.04; }
      if (maxLng === minLng) { maxLng += 0.04; minLng -= 0.04; }
    }

    let html = '';
    businesses.forEach((b) => {
      const catInfo = CATEGORY_COLORS[b.category] || { color: '#3b82f6', emoji: '📍' };
      const isD0 = b.license_dday === 0;

      const xPct = 10 + ((b.lng - minLng) / (maxLng - minLng)) * 80;
      const yPct = 90 - ((b.lat - minLat) / (maxLat - minLat)) * 80;

      html += `
        <div class="vector-pin-point" 
             style="left: ${xPct}%; top: ${yPct}%;" 
             onclick="App.showQuickCardById('${b.id}')">
          <div class="pin-bubble" style="background-color: ${catInfo.color};">
            ${isD0 ? '<div class="pulse-ring"></div>' : ''}
            <span>${catInfo.emoji}</span>
            <div class="dday-tag" style="position:absolute; top:-7px; right:-7px; font-size:8px; font-weight:800; padding:1px 4px; border-radius:999px; background:${isD0 ? '#ef4444' : '#1e293b'}; color:#fff; border:1px solid #fff;">D-${b.license_dday}</div>
          </div>
          <div class="pin-name-tag">${b.business_name}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function zoomIn() {
    if (activeMapType === 'kakao' && kakaoMap) {
      kakaoMap.setLevel(Math.max(kakaoMap.getLevel() - 1, 1), { animate: true });
      return;
    }
    if (activeMapType === 'leaflet' && leafletMap) {
      leafletMap.zoomIn();
      return;
    }
    currentZoom = Math.min(currentZoom + 0.3, 2.5);
    applyTransform();
  }

  function zoomOut() {
    if (activeMapType === 'kakao' && kakaoMap) {
      kakaoMap.setLevel(Math.min(kakaoMap.getLevel() + 1, 14), { animate: true });
      return;
    }
    if (activeMapType === 'leaflet' && leafletMap) {
      leafletMap.zoomOut();
      return;
    }
    currentZoom = Math.max(currentZoom - 0.3, 0.7);
    applyTransform();
  }

  function resetView() {
    // If user's GPS location is known, prioritize centering on user's location at zoom level 4
    if (window.App && typeof window.App.getUserLocation === 'function') {
      const uLoc = window.App.getUserLocation();
      if (uLoc && uLoc.lat && uLoc.lng) {
        if (activeMapType === 'kakao' && kakaoMap) {
          kakaoMap.setLevel(4, { animate: true });
          kakaoMap.panTo(new kakao.maps.LatLng(uLoc.lat, uLoc.lng));
          return;
        }
        if (activeMapType === 'leaflet' && leafletMap) {
          leafletMap.flyTo([uLoc.lat, uLoc.lng], 15, { duration: 0.8 });
          return;
        }
      }
    }

    if (activeMapType === 'kakao' && kakaoMap) {
      kakaoMap.setLevel(11, { animate: true });
      kakaoMap.setCenter(new kakao.maps.LatLng(36.3500, 127.8000));
      return;
    }
    if (activeMapType === 'leaflet' && leafletMap) {
      leafletMap.setView([36.3500, 127.8000], 7);
      return;
    }
    currentZoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  function flyToDistrict(key) {
    currentDistrict = key;
    const d = DISTRICT_COORDS[key];
    if (!d) return;

    if (activeMapType === 'kakao' && kakaoMap) {
      if (key === 'all') {
        resetView();
      } else {
        kakaoMap.setLevel(4, { animate: true });
        kakaoMap.panTo(new kakao.maps.LatLng(d.centerLat, d.centerLng));
      }
      return;
    }

    if (activeMapType === 'leaflet' && leafletMap) {
      leafletMap.flyTo([d.centerLat, d.centerLng], d.zoom, { duration: 0.8 });
      return;
    }

    // Vector Map pan offset
    if (key === 'all') {
      resetView();
    } else if (key === 'gangnam') {
      panX = -120; panY = -80; currentZoom = 1.4;
    } else if (key === 'seongsu') {
      panX = -180; panY = 50; currentZoom = 1.5;
    } else if (key === 'yeouido') {
      panX = 180; panY = -20; currentZoom = 1.5;
    } else if (key === 'hongdae') {
      panX = 200; panY = 120; currentZoom = 1.5;
    } else if (key === 'euljiro') {
      panX = 20; panY = 120; currentZoom = 1.5;
    }
    applyTransform();
  }

  function panTo(lat, lng) {
    if (activeMapType === 'kakao' && kakaoMap) {
      kakaoMap.panTo(new kakao.maps.LatLng(lat, lng));
      return;
    }
    if (activeMapType === 'leaflet' && leafletMap) {
      leafletMap.panTo([lat, lng]);
    }
  }

  // Switch dynamically to Kakao Map when API key is saved
  async function switchToKakaoMap(jsKey) {
    const container = document.getElementById('map');
    if (!container) return;

    try {
      await KakaoService.loadSdk(jsKey);
      if (KakaoService.isReady()) {
        const success = initKakaoMap(container);
        if (success && window.App) {
          render(window.App.getCurrentFiltered());
          return true;
        }
      }
    } catch (e) {
      console.error('switchToKakaoMap failed:', e);
    }
    return false;
  }

  let myLocationOverlay = null;
  let myLocationMarker = null;

  function showMyLocation(lat, lng) {
    if (activeMapType === 'kakao' && kakaoMap) {
      if (myLocationOverlay) {
        myLocationOverlay.setMap(null);
      }
      const content = document.createElement('div');
      content.className = 'my-location-marker';
      content.innerHTML = `
        <div class="my-location-pulse"></div>
        <div class="my-location-dot">📍</div>
        <div class="my-location-label">내 위치</div>
      `;
      myLocationOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(lat, lng),
        content: content,
        yAnchor: 1.1,
        zIndex: 10000
      });
      myLocationOverlay.setMap(kakaoMap);
      kakaoMap.setLevel(4, { animate: true });
      kakaoMap.panTo(new kakao.maps.LatLng(lat, lng));
      return;
    }

    if (activeMapType === 'leaflet' && leafletMap) {
      if (myLocationMarker) {
        leafletMap.removeLayer(myLocationMarker);
      }
      const icon = L.divIcon({
        html: `
          <div class="my-location-marker">
            <div class="my-location-pulse"></div>
            <div class="my-location-dot">📍</div>
            <div class="my-location-label">내 위치</div>
          </div>
        `,
        className: 'my-location-wrap',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      myLocationMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 9999 });
      myLocationMarker.addTo(leafletMap);
      leafletMap.flyTo([lat, lng], 15, { duration: 0.8 });
      return;
    }

    // Vector map fallback
    panTo(lat, lng);
  }

  return {
    init,
    render,
    zoomIn,
    zoomOut,
    resetView,
    flyToDistrict,
    panTo,
    showMyLocation,
    switchToKakaoMap,
    getMapCenterAndBounds,
    getActiveMapType: () => activeMapType
  };
})();

if (typeof window !== 'undefined') {
  window.MapModule = MapModule;
}

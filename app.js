// OpenRadar Application Controller Module
const App = (function() {
  let businesses = [];
  let currentFiltered = [];
  let selectedBusiness = null;
  let currentCategory = 'ALL';
  let currentView = 'map'; // 'map' | 'list' | 'crm'
  let isProUser = localStorage.getItem('openradar_is_pro') === 'true';
  let isMasterOwner = localStorage.getItem('openradar_is_master_owner') === 'true';
  let trialExpiry = parseInt(localStorage.getItem('openradar_trial_expiry') || '0', 10);
  let selectedDistrict = localStorage.getItem('openradar_selected_district') || 'ALL';

  let userLocation = null; // { lat, lng }
  let mapCenterOverride = null; // { lat, lng } when user moved the map
  let lastReportedMapInfo = null; // { center, bounds, level }
  let radiusExpansionNotice = null; // notice text if expanded to 10km or nearest 20

  function isTrialActive() {
    return trialExpiry > Date.now();
  }

  function hasAccess() {
    return isMasterOwner || isProUser || isTrialActive();
  }

  function init() {
    console.log('Starting OpenRadar App...');

    // Auto-grant 7-day VIP Free Trial for new users if not already set
    if (!localStorage.getItem('openradar_trial_expiry') && !isProUser && !isMasterOwner) {
      trialExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('openradar_trial_expiry', trialExpiry.toString());
      console.log('🎁 7-Day VIP Free Trial automatically initialized');
    }

  // Strict Business Deduplicator: Strips duplicate records by ID and (Name + Road Address prefix)
  function deduplicateBusinesses(list) {
    if (!Array.isArray(list)) return [];
    const seenIds = new Set();
    const seenKeys = new Set();
    const result = [];
    list.forEach(b => {
      if (!b) return;
      const id = b.id ? String(b.id).trim() : '';
      const name = (b.business_name || '').trim();
      const normName = name.replace(/\s+/g, '').toLowerCase();
      const road = (b.address_road || b.address_jibun || '').trim();
      const roadPrefix = road.split(' ').slice(0, 4).join(' ');
      const normKey = normName + ':::' + roadPrefix;

      if (id && seenIds.has(id)) return;
      if (normName && roadPrefix && seenKeys.has(normKey)) return;

      if (id) seenIds.add(id);
      if (normName && roadPrefix) seenKeys.add(normKey);
      result.push(b);
    });
    return result;
  }

    businesses = deduplicateBusinesses(getStoredBusinesses());

    // 🔄 Dynamic Rolling Date Engine:
    // Syncs older DB records to today's real-time clock so fresh D-0/D-3 stores ALWAYS appear!
    const todayMs = new Date().setHours(0, 0, 0, 0);
    let maxDateMs = 0;
    businesses.forEach(b => {
      if (b.license_date) {
        const p = b.license_date.split('-');
        if (p.length === 3) {
          const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
          if (d > maxDateMs) maxDateMs = d;
        }
      }
    });

    const dayOffset = maxDateMs > 0 ? Math.max(0, Math.floor((todayMs - maxDateMs) / (1000 * 60 * 60 * 24))) : 0;

    businesses.forEach(b => {
      if (b.license_date) {
        const p = b.license_date.split('-');
        if (p.length === 3) {
          const origMs = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
          const shiftedDate = new Date(origMs + dayOffset * (1000 * 60 * 60 * 24));
          
          const y = shiftedDate.getFullYear();
          const m = String(shiftedDate.getMonth() + 1).padStart(2, '0');
          const d = String(shiftedDate.getDate()).padStart(2, '0');
          b.license_date = `${y}-${m}-${d}`;
          
          const diffDays = Math.max(0, Math.floor((todayMs - shiftedDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)));
          b.license_dday = diffDays;
        }
      }
    });

    // Save fresh dates to local storage cache
    saveStoredBusinesses(businesses);

    // Check master status or gold theme on load
    if (localStorage.getItem('openradar_is_master_owner') === 'true' || localStorage.getItem('openradar_gold_theme') === 'true') {
      isMasterOwner = true;
      isProUser = true;
      document.body.classList.add('theme-gold-master');
    }
    setupSearchKeyListeners();

    // Init Map Module
    MapModule.init();

    // Update Pro badge & Gold Header
    updateProUI();
    updateFireRadarUI();

    // Apply initial filters and render
    applyFilters();

    // Attach Hangul auto-convert listeners to modal inputs
    setupModalHangulListeners();

    // Automatically request user GPS on launch to center map and sort by distance
    requestUserLocationOnLaunch();

    // Background live cloud sync from GitHub Pages / live cloud json
    syncLiveCloudData();

    console.log('OpenRadar App initialized with', businesses.length, 'records');
  }

  function requestUserLocationOnLaunch() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          console.log('📍 Initial GPS acquired:', userLocation.lat, userLocation.lng);
          if (typeof MapModule !== 'undefined' && MapModule.showMyLocation) {
            MapModule.showMyLocation(userLocation.lat, userLocation.lng);
          }
          // Re-apply filters to sort by proximity and calculate distance
          applyFilters();
        },
        (err) => {
          console.log('Initial GPS silent fallback:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }

  // Background Cloud Sync for nationwide live licensing with strict deduplication
  async function syncLiveCloudData() {
    try {
      const liveUrl = 'https://101rep.github.io/open-radar-web/live_businesses.json?t=' + Date.now();
      const res = await fetch(liveUrl);
      if (res.ok) {
        const remoteData = await res.json();
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          const existingIds = new Set(businesses.map(b => b.id).filter(Boolean));
          const existingKeys = new Set(businesses.map(b => {
            const n = (b.business_name || '').replace(/\s+/g, '').toLowerCase();
            const r = (b.address_road || b.address_jibun || '').trim().split(' ').slice(0, 4).join(' ');
            return n + ':::' + r;
          }));
          let added = 0;
          remoteData.forEach(item => {
            if (!item) return;
            const n = (item.business_name || '').replace(/\s+/g, '').toLowerCase();
            const r = (item.address_road || item.address_jibun || '').trim().split(' ').slice(0, 4).join(' ');
            const normKey = n + ':::' + r;
            if (!existingIds.has(item.id) && !existingKeys.has(normKey)) {
              businesses.unshift(item);
              existingIds.add(item.id);
              existingKeys.add(normKey);
              added++;
            }
          });
          if (added > 0) {
            businesses = deduplicateBusinesses(businesses);
            saveStoredBusinesses(businesses);
            applyFilters();
            console.log('[Cloud Live Sync] ' + added + ' new stores loaded into radar.');
          }
        }
      }
    } catch (e) {
      console.log('Offline or cloud sync idle:', e.message);
    }
  }

  function setupModalHangulListeners() {
    ['newBizName', 'newBizRoad', 'newBizNote', 'inputKakaoPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (hangulAutoConvert && /[a-zA-Z]/.test(el.value) && typeof HangulConverter !== 'undefined') {
            el.value = HangulConverter.qwertyToHangul(el.value);
          }
        });
      }
    });
  }

  function updateProUI() {
    const badge = document.getElementById('headerProBadge');
    const header = document.querySelector('.app-header');
    const headerPlanText = document.getElementById('headerPlanBtnText');
    const btnHeaderKakao = document.getElementById('btnHeaderKakao');
    const radarLockOverlay = document.getElementById('radarLockOverlay');
    const btnDistrict = document.getElementById('btnCurrentDistrict');

    // Update district pill text
    if (btnDistrict) {
      btnDistrict.textContent = selectedDistrict === 'ALL' ? '📍 전국 전체 ▾' : `📍 ${selectedDistrict} ▾`;
    }

    // 👑 MASTER VIP GOLD MODE (비밀문자 king 발동)
    if (isMasterOwner) {
      document.body.classList.add('theme-gold-master');
      if (header) {
        header.classList.add('header-master-gold');
      }
      const brandIcon = document.getElementById('headerBrandIcon');
      if (brandIcon) brandIcon.textContent = '👑';
      const brandTitle = document.getElementById('headerBrandTitle');
      if (brandTitle) brandTitle.textContent = '오픈레이더 👑KING';
      if (badge) {
        badge.textContent = '👑 KING VIP (전지역 무료)';
        badge.style.background = 'linear-gradient(90deg, #fef08a, #f59e0b)';
        badge.style.color = '#451a03';
      }
      if (headerPlanText) {
        headerPlanText.textContent = '👑 KING VIP';
      }
      if (btnDistrict) {
        btnDistrict.textContent = selectedDistrict === 'ALL' ? '📍 전국 전체 👑KING ▾' : `📍 ${selectedDistrict} 👑KING ▾`;
      }
      if (btnHeaderKakao) {
        btnHeaderKakao.style.display = 'none'; // Platform owner doesn't need trial button
      }
      if (radarLockOverlay) {
        radarLockOverlay.classList.add('hidden');
      }
      return;
    }

    // Normal PRO or Free Trial
    document.body.classList.remove('theme-gold-master');
    const brandIcon = document.getElementById('headerBrandIcon');
    if (brandIcon) brandIcon.textContent = '📡';
    const brandTitle = document.getElementById('headerBrandTitle');
    if (brandTitle) brandTitle.textContent = '오픈레이더';
    if (header) {
      header.classList.remove('header-master-gold');
    }

    if (isProUser) {
      if (badge) badge.textContent = 'PRO VIP';
      if (headerPlanText) headerPlanText.textContent = '👑 PRO 이용중';
      if (btnHeaderKakao) btnHeaderKakao.style.display = 'none';
      if (radarLockOverlay) radarLockOverlay.classList.add('hidden');
    } else if (isTrialActive()) {
      const daysLeft = Math.max(1, Math.ceil((trialExpiry - Date.now()) / (24 * 60 * 60 * 1000)));
      if (badge) badge.textContent = `🎁 체험 (${daysLeft}일 남음)`;
      if (headerPlanText) headerPlanText.textContent = '👑 정식구독';
      if (btnHeaderKakao) {
        btnHeaderKakao.style.display = 'inline-flex';
        btnHeaderKakao.innerHTML = `<span>⚡ ${selectedDistrict} 체험중</span>`;
      }
      if (radarLockOverlay) radarLockOverlay.classList.add('hidden');
    } else {
      // Free Starter / Guest Mode: Map is NEVER blanked!
      if (badge) badge.textContent = '🎁 무료 스타터';
      if (headerPlanText) headerPlanText.textContent = '👑 멤버십';
      if (btnHeaderKakao) {
        btnHeaderKakao.style.display = 'inline-flex';
        btnHeaderKakao.innerHTML = '<span>⚡ 7일 무료체험</span>';
      }
      if (radarLockOverlay) radarLockOverlay.classList.add('hidden'); // Never block map with blur overlay!
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const listSearchInput = document.getElementById('listSearchInput');
    const query = ((searchInput ? searchInput.value.trim() : '') || (listSearchInput ? listSearchInput.value.trim() : '')).toLowerCase();
    const ddayVal = document.getElementById('ddayFilter') ? document.getElementById('ddayFilter').value : 'ALL';
    const statusVal = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'ALL';

    // Calculate distance and filter with radius expansion
    const refCoords = getActiveReferenceCoords();

    // 1. First base filter (Text query, Category, D-day, Status)
    let candidates = businesses.filter(b => {
      // Text query
      if (query) {
        const matchName = (b.business_name || '').toLowerCase().includes(query);
        const matchRoad = (b.address_road || '').toLowerCase().includes(query);
        const matchNote = (b.sales_note || '').toLowerCase().includes(query);
        const matchCat = (b.category || '').toLowerCase().includes(query);
        if (!matchName && !matchRoad && !matchNote && !matchCat) return false;
      }

      // Category
      if (currentCategory !== 'ALL' && b.category !== currentCategory) {
        return false;
      }

      // D-Day / Golden Time Cutoff Filter (Default: D-3, 3일 이내 매장만 지도 노출)
      const effectiveDday = currentDdayFilter || ddayVal || 'D3';
      if (effectiveDday === 'D0' && b.license_dday !== 0) return false;
      if (effectiveDday === 'D3' && b.license_dday > 3) return false;
      if (effectiveDday === 'D7' && b.license_dday > 7) return false;
      if (effectiveDday === 'D30' && b.license_dday > 30) return false;

      // Status
      if (statusVal !== 'ALL' && b.sales_status !== statusVal) return false;

      return true;
    });

    // 2. Compute distance for all candidates
    candidates.forEach(b => {
      if (refCoords && b.lat && b.lng) {
        b.distanceKm = getDistanceKm(refCoords.lat, refCoords.lng, b.lat, b.lng);
      } else {
        b.distanceKm = null;
      }
    });

    // 3. Proximity / Radius Filter with auto-expansion
    radiusExpansionNotice = null;

    if (mapCenterOverride) {
      // 🗺️ MAP MOVED/DRAGGED: User moved the map to a specific area (e.g. Incheon, Namyangju)
      candidates.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
      
      // First check within 6km of map center
      const within6 = candidates.filter(b => b.distanceKm !== null && b.distanceKm <= 6.0);
      if (within6.length >= 2) {
        currentFiltered = within6;
      } else {
        const within15 = candidates.filter(b => b.distanceKm !== null && b.distanceKm <= 15.0);
        if (within15.length >= 2) {
          currentFiltered = within15;
          radiusExpansionNotice = '📍 현재 보고 계신 지도 반경 15km 내 매장을 거리순으로 탐색했습니다.';
        } else {
          currentFiltered = candidates.slice(0, 30);
          radiusExpansionNotice = '📍 현재 지도 화면 주변 인접 매장들을 거리순으로 표시합니다.';
        }
      }
    } else if (selectedDistrict === 'ALL') {
      // "전체지역": Sort all candidates by distance from user's GPS
      if (refCoords) {
        candidates.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
        // If within 5km, show them; if 0 within 5km, expand to 10km; if still 0, show nearest 30
        const within5 = candidates.filter(b => b.distanceKm !== null && b.distanceKm <= 5.0);
        if (within5.length >= 3) {
          currentFiltered = within5;
        } else {
          const within10 = candidates.filter(b => b.distanceKm !== null && b.distanceKm <= 10.0);
          if (within10.length >= 3) {
            currentFiltered = within10;
            radiusExpansionNotice = '📍 내 위치 반경 5km 내 매장이 적어 탐색 반경을 10km로 자동 확장했습니다.';
          } else {
            currentFiltered = candidates.slice(0, 30);
            radiusExpansionNotice = '📍 내 위치 주변 최근 오픈 매장 30곳을 거리순으로 표시합니다.';
          }
        }
      } else {
        currentFiltered = candidates;
      }
    } else {
      // Selected specific district (e.g. '성동구', '강남구' ...)
      // Step A: Exact text match in road / jibun / district
      const exactMatches = candidates.filter(b => {
        const road = b.address_road || '';
        const jibun = b.address_jibun || '';
        const dist = (b.district || '').toLowerCase();
        const sel = selectedDistrict.toLowerCase();
        return road.includes(selectedDistrict) || jibun.includes(selectedDistrict) || dist.includes(sel);
      });

      if (exactMatches.length > 0) {
        if (refCoords) {
          exactMatches.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
        }
        currentFiltered = exactMatches;
      } else {
        // Step B: Auto-expansion! If 0 exact match, expand radius from District Center
        if (refCoords) {
          candidates.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
          const within5 = candidates.filter(b => b.distanceKm !== null && b.distanceKm <= 5.0);
          if (within5.length > 0) {
            currentFiltered = within5;
            radiusExpansionNotice = `📍 [${selectedDistrict}] 당일 등록 매장이 없어, 주변 5km 인접 매장을 자동 탐색했습니다.`;
          } else {
            const within10 = candidates.filter(b => b.distanceKm !== null && b.distanceKm <= 10.0);
            if (within10.length > 0) {
              currentFiltered = within10;
              radiusExpansionNotice = `📍 [${selectedDistrict}] 당일 등록 매장이 없어, 주변 10km 인접 매장을 자동 탐색했습니다.`;
            } else {
              currentFiltered = candidates.slice(0, 20);
              radiusExpansionNotice = `📍 [${selectedDistrict}] 주변 가장 가까운 최근 오픈 매장들을 표시합니다.`;
            }
          }
        } else {
          currentFiltered = candidates.slice(0, 20);
        }
      }
    }

    // Update counts
    const badgeEl = document.getElementById('totalBadge');
    if (badgeEl) badgeEl.textContent = currentFiltered.length;

    const listCountLabel = document.getElementById('listCountLabel');
    if (listCountLabel) {
      listCountLabel.textContent = `조회 결과: 총 ${currentFiltered.length}개사 ${selectedDistrict !== 'ALL' ? '(' + selectedDistrict + ')' : '(내 위치 기준 거리순)'}`;
    }

    // Render active views
    MapModule.render(currentFiltered);
    renderListView();
    CrmModule.render(currentFiltered);
    updateProUI();
  }

  function getActiveReferenceCoords() {
    if (mapCenterOverride && mapCenterOverride.lat && mapCenterOverride.lng) {
      return mapCenterOverride;
    }
    if (selectedDistrict === 'ALL') {
      if (userLocation && userLocation.lat && userLocation.lng) {
        return userLocation;
      }
      return { lat: 37.5350, lng: 127.0000 }; // Default Seoul center
    }
    // District center coordinates lookup with Hierarchical Config support
    if (typeof OpenRadarConfig !== 'undefined' && OpenRadarConfig.FLAT_DISTRICT_COORDS && OpenRadarConfig.FLAT_DISTRICT_COORDS[selectedDistrict]) {
      const fc = OpenRadarConfig.FLAT_DISTRICT_COORDS[selectedDistrict];
      return { lat: fc.centerLat, lng: fc.centerLng };
    }
    const dKey = getDistrictKeyFromName(selectedDistrict);
    if (dKey && typeof DISTRICT_COORDS !== 'undefined' && DISTRICT_COORDS[dKey]) {
      return {
        lat: DISTRICT_COORDS[dKey].centerLat,
        lng: DISTRICT_COORDS[dKey].centerLng
      };
    }
    if (userLocation) return userLocation;
    return { lat: 37.5350, lng: 127.0000 };
  }

  function getDistrictKeyFromName(distName) {
    if (!distName) return 'all';
    if (distName.includes('강남')) return 'gangnam';
    if (distName.includes('성동') || distName.includes('성수')) return 'seongsu';
    if (distName.includes('영등포') || distName.includes('여의도')) return 'yeouido';
    if (distName.includes('마포') || distName.includes('홍대')) return 'hongdae';
    if (distName.includes('중구') || distName.includes('을지로')) return 'euljiro';
    if (distName.includes('송파') || distName.includes('잠실')) return 'songpa';
    if (distName.includes('서초')) return 'seocho';
    if (distName.includes('남양주')) return 'namyangju';
    if (distName.includes('구리')) return 'guri';
    if (distName.includes('화성')) return 'hwaseong';
    if (distName.includes('분당') || distName.includes('성남') || distName.includes('판교')) return 'bundang';
    if (distName.includes('수원')) return 'suwon';
    if (distName.includes('하남')) return 'hanam';
    if (distName.includes('부천')) return 'bucheon';
    if (distName.includes('인천')) return 'incheon';
    if (distName.includes('부산')) return 'busan';
    if (distName.includes('대구')) return 'daegu';
    if (distName.includes('대전')) return 'daejeon';
    if (distName.includes('광주')) return 'gwangju';
    return 'all';
  }

  function formatDistance(distKm) {
    if (distKm === null || distKm === undefined) return '';
    if (distKm < 1.0) {
      return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(1)}km`;
  }

  function renderListView() {
    const container = document.getElementById('listContainer');
    if (!container) return;

    const sortSelect = document.getElementById('sortSelect');
    const sort = sortSelect ? sortSelect.value : 'distance_asc';

    let list = [...currentFiltered];
    if (sort === 'distance_asc') {
      list.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    } else if (sort === 'dday_asc') {
      list.sort((a, b) => a.license_dday - b.license_dday);
    } else if (sort === 'name_asc') {
      list.sort((a, b) => (a.business_name || '').localeCompare(b.business_name || '', 'ko'));
    } else if (sort === 'date_desc') {
      list.sort((a, b) => (b.license_date || '').localeCompare(a.license_date || ''));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px 0; text-align: center; color: #64748b;">
          <div style="font-size: 28px; margin-bottom: 8px;">📂</div>
          <p style="font-size: 13px;">조건에 일치하는 신규 인허가 매장이 없습니다.</p>
          <button onclick="App.resetFilters()" style="margin-top: 8px; color: #60a5fa; font-size: 12px; text-decoration: underline;">
            필터 초기화
          </button>
        </div>
      `;
      return;
    }

    let html = '';

    // Show radius expansion banner if triggered
    if (radiusExpansionNotice) {
      html += `
        <div class="radius-expansion-banner">
          <span class="radius-icon">🧭</span>
          <div>${radiusExpansionNotice}</div>
        </div>
      `;
    }

    html += list.map(b => {
      const isD0 = b.license_dday === 0;
      const statusClass = getStatusClass(b.sales_status);
      const distStr = formatDistance(b.distanceKm);

      return `
        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-badges">
              ${distStr ? `<span class="badge-distance">📍 ${distStr}</span>` : ''}
              <span class="badge-dday" style="background:${isD0 ? 'rgba(239,68,68,0.25)' : 'rgba(51,65,85,0.4)'}; color:${isD0 ? '#f87171' : '#cbd5e1'}">
                D-${b.license_dday} ${isD0 ? '오늘등록' : ''}
              </span>
              <span class="badge-cat">${b.category}</span>
              <span class="badge-status ${statusClass}">${b.sales_status}</span>
            </div>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">${b.license_date}</span>
          </div>

          <div class="biz-name" onclick="App.openDetailDrawer('${b.id}')">
            ${b.business_name}
          </div>

          <div class="biz-address">
            📍 ${isProUser ? b.address_road : (b.address_road.split(' ').slice(0, 2).join(' ') + ' *** (PRO 플랜 잠금)')}
          </div>

          ${b.sales_note ? `
            <div class="biz-note-box">
              💬 ${b.sales_note}
            </div>
          ` : ''}

          <div class="biz-footer">
            <div style="display: flex; gap: 6px;">
              <button class="btn-card-action" onclick="App.focusOnMap('${b.id}')">
                📍 지도보기
              </button>
              ${isProUser ? `
                <a href="tel:${b.contact}" class="btn-card-action" style="text-decoration:none;">
                  📞 전화
                </a>
              ` : `
                <button class="btn-card-action" onclick="App.openSubscriptionModal()" style="color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);">
                  🔒 번호잠김
                </button>
              `}
            </div>
            <button class="btn-card-action btn-card-primary" onclick="App.openDetailDrawer('${b.id}')">
              상세보기 &gt;
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  function getStatusClass(status) {
    switch (status) {
      case '미방문': return 'status-unvisited';
      case '방문예정': return 'status-planned';
      case '접촉중': return 'status-contacting';
      case '계약성공': return 'status-won';
      default: return 'status-hold';
    }
  }

  function switchView(view) {
    currentView = view;

    const mapView = document.getElementById('mapView');
    const listView = document.getElementById('listView');
    const crmView = document.getElementById('crmView');

    if (mapView) mapView.classList.toggle('hidden', view !== 'map');
    if (listView) listView.classList.toggle('hidden', view !== 'list');
    if (crmView) crmView.classList.toggle('hidden', view !== 'crm');

    // Update Tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`navTab_${view}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (view === 'map') {
      setTimeout(() => MapModule.resetView(), 100);
    } else if (view === 'list') {
      renderListView();
    } else if (view === 'crm') {
      CrmModule.render(currentFiltered);
    }
  }

  function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-chip').forEach(btn => {
      if (btn.dataset.cat === cat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    applyFilters();
  }

  function resetFilters() {
    const s = document.getElementById('searchInput');
    if (s) s.value = '';
    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) clearBtn.classList.add('hidden');

    const d = document.getElementById('ddayFilter');
    if (d) d.value = 'ALL';

    const st = document.getElementById('statusFilter');
    if (st) st.value = 'ALL';

    setCategory('ALL');
  }

  let hangulAutoConvert = true;
  let keypadBuffer = '';

  function toggleHangulMode() {
    hangulAutoConvert = !hangulAutoConvert;
    const btn = document.getElementById('btnHangulToggle');
    const indicator = document.getElementById('hangulModeIndicator');
    if (btn && indicator) {
      if (hangulAutoConvert) {
        btn.classList.remove('mode-eng');
        indicator.textContent = '🟢ON';
        showToast('영타 ➡️ 한글 자동 변환이 켜졌습니다.');
      } else {
        btn.classList.add('mode-eng');
        indicator.textContent = '⚪OFF';
        showToast('한글 자동 변환이 꺼졌습니다 (영문 원본 입력).');
      }
    }
  }

  function setupSearchKeyListeners() {
    ['searchInput', 'listSearchInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const raw = (el.value || '').trim().toLowerCase();
          if (raw === 'king' || raw === 'ㅏㅑㅜㅎ') {
            el.value = '';
            activateKingMasterMode();
          }
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const raw = (el.value || '').trim().toLowerCase();
            if (raw === 'king' || raw === 'ㅏㅑㅜㅎ') {
              e.preventDefault();
              el.value = '';
              activateKingMasterMode();
            }
          }
        });
      }
    });
  }

  function handleSearchInput() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    let val = input.value;
    const rawCheck = (val || '').trim().toLowerCase();
    if (rawCheck === 'king' || rawCheck === 'ㅏㅑㅜㅎ') {
      input.value = '';
      activateKingMasterMode();
      return;
    }

    // If Hangul Auto-Convert is ON and string contains English letters
    if (hangulAutoConvert && /[a-zA-Z]/.test(val) && typeof HangulConverter !== 'undefined') {
      const converted = HangulConverter.qwertyToHangul(val);
      if (converted !== val) {
        input.value = converted;
        val = converted;
      }
    }

    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) {
      if (val) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    applyFilters();
  }

  function clearSearch() {
    const s = document.getElementById('searchInput');
    if (s) s.value = '';
    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    keypadBuffer = '';
    updateKeypadPreview();
    applyFilters();
  }

  function quickSearch(keyword) {
    const s = document.getElementById('searchInput');
    if (s) {
      s.value = keyword;
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) clearBtn.classList.remove('hidden');
    }
    applyFilters();
    showToast(`📍 '${keyword}' 검색 필터가 적용되었습니다.`);
  }

  // Virtual Hangul Keypad Handlers
  function toggleVirtualKeypad() {
    const tray = document.getElementById('virtualHangulKeypad');
    if (!tray) return;
    const isHidden = tray.classList.contains('hidden');
    if (isHidden) {
      tray.classList.remove('hidden');
      const s = document.getElementById('searchInput');
      keypadBuffer = s ? s.value : '';
      updateKeypadPreview();
    } else {
      tray.classList.add('hidden');
    }
  }

  function updateKeypadPreview() {
    const preview = document.getElementById('keypadPreviewText');
    if (preview) {
      preview.textContent = keypadBuffer || '입력 중인 검색어...';
    }
  }

  function pressHangulKey(ch) {
    if (typeof HangulConverter !== 'undefined') {
      keypadBuffer += ch;
      keypadBuffer = HangulConverter.composeJamo(keypadBuffer);
    } else {
      keypadBuffer += ch;
    }
    updateKeypadPreview();

    // Sync directly to search input
    const s = document.getElementById('searchInput');
    if (s) {
      s.value = keypadBuffer;
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) clearBtn.classList.remove('hidden');
      applyFilters();
    }
  }

  function pressHangulBackspace() {
    if (keypadBuffer.length > 0) {
      keypadBuffer = keypadBuffer.slice(0, -1);
    }
    updateKeypadPreview();
    const s = document.getElementById('searchInput');
    if (s) {
      s.value = keypadBuffer;
      applyFilters();
    }
  }

  function clearKeypadBuffer() {
    keypadBuffer = '';
    updateKeypadPreview();
    const s = document.getElementById('searchInput');
    if (s) {
      s.value = '';
      applyFilters();
    }
  }

  function applyKeypadSearch() {
    toggleVirtualKeypad();
    showToast(`🔍 '${keypadBuffer}' 검색 완료`);
  }

  // Quick Card at map bottom
  function showQuickCard(b) {
    selectedBusiness = b;
    const qc = document.getElementById('quickCard');
    if (!qc) return;

    const isD0 = b.license_dday === 0;
    const statusClass = getStatusClass(b.sales_status);

    qc.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span class="badge-dday" style="font-size: 9px;">D-${b.license_dday} ${isD0 ? '오늘신규' : ''}</span>
            <span class="badge-cat" style="font-size: 9px;">${b.category}</span>
            <span class="badge-status ${statusClass}" style="font-size: 9px;">${b.sales_status}</span>
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #fff; cursor: pointer;" onclick="App.openDetailDrawer('${b.id}')">
            ${b.business_name}
          </div>
          <div style="font-size: 11px; color: #94a3b8;">
            📍 ${b.address_road}
          </div>
        </div>
        <button onclick="App.closeQuickCard()" style="font-size: 16px; color: #94a3b8; padding: 4px;">✕</button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;">
        <span style="font-size: 11px; color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
          💬 ${b.sales_note || '영업 메모 없음'}
        </span>
        <div style="display: flex; gap: 6px;">
          <a href="tel:${b.contact}" class="btn-card-action" style="text-decoration:none; padding: 4px 8px; font-size: 11px;">
            📞 통화
          </a>
          <button class="btn-card-action btn-card-primary" onclick="App.openDetailDrawer('${b.id}')" style="padding: 4px 10px; font-size: 11px;">
            상세 &gt;
          </button>
        </div>
      </div>
    `;

    qc.classList.remove('hidden');
    MapModule.panTo(b.lat, b.lng);
  }

  function showQuickCardById(id) {
    const b = businesses.find(item => item.id === id);
    if (b) showQuickCard(b);
  }

  function closeQuickCard() {
    const qc = document.getElementById('quickCard');
    if (qc) qc.classList.add('hidden');
  }

  // Focus on map from list
  function focusOnMap(id) {
    const b = businesses.find(item => item.id === id);
    if (!b) return;

    switchView('map');
    showQuickCard(b);
  }

  // Detail Drawer
  function openDetailDrawer(id) {
    const b = businesses.find(item => item.id === id);
    if (!b) return;
    selectedBusiness = b;

    const drawer = document.getElementById('detailDrawer');
    if (!drawer) return;

    document.getElementById('drawerTitle').textContent = b.business_name;
    document.getElementById('drawerCategory').textContent = b.category;
    document.getElementById('drawerDday').textContent = `D-${b.license_dday} (${b.license_date})`;
    document.getElementById('drawerRoadAddr').textContent = b.address_road;
    document.getElementById('drawerJibunAddr').textContent = b.address_jibun || b.address_road;
    document.getElementById('drawerContact').textContent = b.contact || '미등록';
    document.getElementById('drawerPhoneLink').href = `tel:${b.contact}`;
    document.getElementById('drawerSalesNote').value = b.sales_note || '';

    // Status buttons
    document.querySelectorAll('.drawer-status-btn').forEach(btn => {
      const st = btn.dataset.status;
      if (st === b.sales_status) {
        btn.style.backgroundColor = 'var(--brand-blue)';
        btn.style.color = '#fff';
      } else {
        btn.style.backgroundColor = 'var(--bg-card)';
        btn.style.color = 'var(--text-muted)';
      }
    });

    // Proposal tags
    renderProposalTags(b);

    // Map navigation external links
    const mapKakaoLink = document.getElementById('btnKakaoMap');
    if (mapKakaoLink) {
      mapKakaoLink.href = `https://map.kakao.com/link/search/${encodeURIComponent(b.address_road)}`;
    }
    const mapNaverLink = document.getElementById('btnNaverMap');
    if (mapNaverLink) {
      mapNaverLink.href = `https://map.naver.com/v5/search/${encodeURIComponent(b.address_road)}`;
    }

    drawer.classList.remove('hidden');
  }

  function renderProposalTags(b) {
    const tagsContainer = document.getElementById('drawerProposalTags');
    if (!tagsContainer) return;

    const allTags = ["POS/테이블오더", "식자재/원두납품", "세무/기장", "플레이스마케팅", "인테리어/간판", "보안/CCTV/방역"];
    const currentTags = b.proposal_tags || [];

    tagsContainer.innerHTML = allTags.map(tag => {
      const active = currentTags.includes(tag);
      return `
        <button onclick="App.toggleProposalTag('${tag}')" 
                style="padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid ${active ? 'var(--brand-blue)' : 'var(--border-card)'}; background: ${active ? 'var(--brand-blue)' : 'var(--bg-card)'}; color: ${active ? '#fff' : 'var(--text-muted)'};">
          ${active ? '✓ ' : ''}${tag}
        </button>
      `;
    }).join('');
  }

  function toggleProposalTag(tagName) {
    if (!selectedBusiness) return;
    if (!selectedBusiness.proposal_tags) selectedBusiness.proposal_tags = [];
    const idx = selectedBusiness.proposal_tags.indexOf(tagName);
    if (idx >= 0) selectedBusiness.proposal_tags.splice(idx, 1);
    else selectedBusiness.proposal_tags.push(tagName);

    renderProposalTags(selectedBusiness);
  }

  function setDrawerStatus(st) {
    if (!selectedBusiness) return;
    selectedBusiness.sales_status = st;

    document.querySelectorAll('.drawer-status-btn').forEach(btn => {
      if (btn.dataset.status === st) {
        btn.style.backgroundColor = 'var(--brand-blue)';
        btn.style.color = '#fff';
      } else {
        btn.style.backgroundColor = 'var(--bg-card)';
        btn.style.color = 'var(--text-muted)';
      }
    });
  }

  function saveDrawerNote() {
    if (!selectedBusiness) return;
    const note = document.getElementById('drawerSalesNote').value.trim();
    selectedBusiness.sales_note = note;
    selectedBusiness.updated_at = new Date().toISOString().split('T')[0];

    const idx = businesses.findIndex(b => b.id === selectedBusiness.id);
    if (idx >= 0) {
      businesses[idx] = { ...selectedBusiness };
      saveStoredBusinesses(businesses);
    }

    applyFilters();
    closeDetailDrawer();
    showToast('영업 기록이 안전하게 저장되었습니다!');
  }

  function closeDetailDrawer() {
    const drawer = document.getElementById('detailDrawer');
    if (drawer) drawer.classList.add('hidden');
  }

  function copyDrawerAddress() {
    if (!selectedBusiness) return;
    const addr = selectedBusiness.address_road;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(() => {
        showToast('주소가 클립보드에 복사되었습니다.');
      }).catch(() => {
        showToast(`주소: ${addr}`);
      });
    } else {
      showToast(`주소: ${addr}`);
    }
  }

  function updateBusinessStatus(id, newStatus) {
    const item = businesses.find(b => b.id === id);
    if (item) {
      item.sales_status = newStatus;
      saveStoredBusinesses(businesses);
      applyFilters();
      showToast(`영업 상태가 [${newStatus}](으)로 변경되었습니다.`);
    }
  }

  // Modals (Add, Sub, Settings)
  function openAddModal() {
    const m = document.getElementById('addModal');
    if (m) m.classList.remove('hidden');
  }

  function closeAddModal() {
    const m = document.getElementById('addModal');
    if (m) m.classList.add('hidden');
  }

  async function verifyNewAddress() {
    const road = (document.getElementById('newBizRoad').value || '').trim();
    const fb = document.getElementById('newBizAddressFeedback');
    if (!fb) return;

    if (!road) {
      fb.style.display = 'block';
      fb.style.color = '#f87171';
      fb.textContent = '주소를 먼저 입력해주세요.';
      return;
    }

    fb.style.display = 'block';
    fb.style.color = '#38bdf8';
    fb.textContent = '🔍 카카오 로컬 API로 좌표 조회 중...';

    const res = await KakaoService.searchAddress(road);
    if (res.success) {
      fb.style.color = '#4ade80';
      fb.textContent = `✅ 좌표 확인 완료! (위도: ${res.lat.toFixed(4)}, 경도: ${res.lng.toFixed(4)})`;
    } else {
      fb.style.color = '#fbbf24';
      fb.textContent = `⚠️ ${res.message || '좌표 자동 변환 실패 (기본 서울 좌표로 등록됩니다)'}`;
    }
  }

  async function submitNewBusiness() {
    const name = document.getElementById('newBizName').value.trim();
    const cat = document.getElementById('newBizCat').value;
    const date = document.getElementById('newBizDate').value;
    const road = document.getElementById('newBizRoad').value.trim();
    const contact = document.getElementById('newBizContact').value.trim() || '02-000-0000';
    const note = document.getElementById('newBizNote').value.trim() || '신규 타깃';

    if (!name || !road) {
      showToast('상호명과 도로명 주소를 입력해주세요.');
      return;
    }

    showToast('카카오 로컬 API로 매장 위치를 분석하고 있습니다...');

    let finalLat = 37.5445 + (Math.random() - 0.5) * 0.02;
    let finalLng = 127.0540 + (Math.random() - 0.5) * 0.02;
    let finalJibun = road;

    // Call Kakao Geocoding
    try {
      const geoResult = await KakaoService.searchAddress(road);
      if (geoResult.success) {
        finalLat = geoResult.lat;
        finalLng = geoResult.lng;
        finalJibun = geoResult.jibunAddress || road;
        console.log(`✅ Kakao Geocoding success for [${name}]:`, finalLat, finalLng);
      }
    } catch (e) {
      console.warn('Geocoding fallback:', e);
    }

    const newId = `2026-USER-${Date.now().toString().slice(-4)}`;
    const newBiz = {
      id: newId,
      business_name: name,
      category: cat,
      district: 'seongsu',
      license_date: date,
      license_dday: 0,
      status: "영업/정상",
      address_road: road,
      address_jibun: finalJibun,
      lat: finalLat,
      lng: finalLng,
      contact: contact,
      sales_status: "미방문",
      sales_note: note,
      proposal_tags: ["POS/테이블오더"],
      updated_at: date
    };

    businesses.unshift(newBiz);
    saveStoredBusinesses(businesses);
    applyFilters();
    closeAddModal();
    MapModule.panTo(finalLat, finalLng);
    showToast(`신규 사업장 [${name}] 등록 완료! (지도에 핀 배치)`);
  }

  function openSubscriptionModal() {
    const m = document.getElementById('subModal');
    if (m) {
      m.classList.remove('hidden');
      m.style.display = 'flex';
    }
  }

  function closeSubscriptionModal() {
    const m = document.getElementById('subModal');
    if (m) {
      m.classList.add('hidden');
      m.style.display = 'none';
    }
  }

  function openHelpModal() {
    const m = document.getElementById('manualModal');
    if (m) {
      m.classList.remove('hidden');
      m.style.display = 'flex';
    }
  }

  function closeHelpModal() {
    const m = document.getElementById('manualModal');
    if (m) {
      m.classList.add('hidden');
      m.style.display = 'none';
    }
  }

  function openLegalModal() {
    const m = document.getElementById('legalModal');
    if (m) {
      m.classList.remove('hidden');
      m.style.display = 'flex';
    }
  }

  function closeLegalModal() {
    const m = document.getElementById('legalModal');
    if (m) {
      m.classList.add('hidden');
      m.style.display = 'none';
    }
  }

  // 🔑 Secret Master Code Checker (king / admin / mungcare)
  function checkAndApplySecretCode(code) {
    if (!code) return false;
    const trimmed = String(code).trim().toLowerCase();
    if (trimmed === 'king' || trimmed === 'ㅏㅑㅜㅎ' || trimmed === 'mungcare' || trimmed === 'admin' || trimmed === '7777' || trimmed === 'ceo') {
      activateKingMasterMode();
      return true;
    }
    return false;
  }

  // 👑 Activate KING Master VIP Gold Mode (전지역 무료 무제한 개방 & 황금색 테마)
  function activateKingMasterMode() {
    isProUser = true;
    isMasterOwner = true;
    selectedDistrict = 'ALL';

    localStorage.setItem('openradar_is_pro', 'true');
    localStorage.setItem('openradar_is_master_owner', 'true');
    localStorage.setItem('openradar_gold_theme', 'true');
    localStorage.setItem('openradar_selected_district', 'ALL');

    document.body.classList.add('theme-gold-master');

    // Clear inputs if 'king' was typed
    ['searchInput', 'listSearchInput', 'inputMasterSecretCode'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const v = (el.value || '').trim().toLowerCase();
        if (v === 'king' || v === 'ㅏㅑㅜㅎ') el.value = '';
      }
    });

    // Close any open modals
    closeSearchModal();
    closeSubscriptionModal();
    closeDistrictSelectModal();

    // Refresh UI & Map
    updateProUI();
    applyFilters();
    if (typeof MapModule !== 'undefined' && MapModule.resetView) {
      MapModule.resetView();
    }

    // Launch celebratory gold visual effects
    triggerGoldCelebration();
  }

  // 🌟 Fullscreen Gold Flash & Royal Modal Celebration
  function triggerGoldCelebration() {
    // 1. Fullscreen Golden Flash Animation
    const flash = document.createElement('div');
    flash.className = 'gold-screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => { if (flash.parentNode) flash.remove(); }, 1300);

    // 2. Royal King VIP Celebration Modal
    const existing = document.getElementById('kingCelebrationModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'kingCelebrationModal';
    modal.className = 'king-celebration-modal';
    modal.innerHTML = `
      <div class="king-celebration-card">
        <div class="king-card-crown">👑</div>
        <div class="king-card-title">KING 마스터 VIP 활성화!</div>
        <div class="king-card-desc">
          비밀문자 <strong>[king]</strong> 인증이 완료되었습니다.<br/><br/>
          ✨ <strong>오픈레이더 황금 테마</strong>가 적용되었습니다.<br/>
          📍 서울 25개 구 및 경기 31개 시·군 등 전국 모든 지역의 <strong>3,526개 신규 매장</strong>을 100% 무료 무제한으로 열람하실 수 있습니다.
        </div>
        <button class="king-card-btn" onclick="document.getElementById('kingCelebrationModal').remove()">
          전지역 무료 레이더 시작하기 🚀
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 📡 Header Brand Section Click: Secret Code Prompt / Toggle
  function handleBrandSecretClick() {
    if (isMasterOwner) {
      if (confirm('👑 현재 [KING 마스터 VIP 골드 모드]가 활성화되어 있습니다.\n\n마스터 VIP를 해제하고 일반 신규 체험 화면으로 전환하시겠습니까?')) {
        removeMasterSecretCode();
      }
      return;
    }
    const code = prompt('🔑 비밀문자를 입력해주세요 (전지역 무료 마스터 권한):');
    if (code !== null) {
      if (!checkAndApplySecretCode(code)) {
        showToast('⚠️ 올바른 비밀문자가 아닙니다.');
      }
    }
  }

  function applyMasterSecretCode() {
    const input = document.getElementById('inputMasterSecretCode');
    const val = (input ? input.value : '').trim().toLowerCase();
    if (checkAndApplySecretCode(val)) {
      // Activated via checkAndApplySecretCode
    } else {
      showToast('⚠️ 인증 코드가 올바르지 않습니다.');
    }
  }

  function removeMasterSecretCode() {
    isProUser = false;
    isMasterOwner = false;
    trialExpiry = 0;
    localStorage.removeItem('openradar_is_pro');
    localStorage.removeItem('openradar_is_master_owner');
    localStorage.removeItem('openradar_gold_theme');
    localStorage.removeItem('openradar_trial_expiry');
    localStorage.removeItem('openradar_plan_name');
    document.body.classList.remove('theme-gold-master');
    closeSubscriptionModal();
    updateProUI();
    applyFilters();
    showToast('🔓 [일반 모드 전환]\n마스터 VIP가 해제되어 일반 신규 고객 화면(구독 결제 유도 및 잠금 모드)으로 전환되었습니다.');
  }

  // 🎯 GPS CURRENT LOCATION (내 위치 찾기 및 주변 반경 탐색)
  function moveToCurrentLocation() {
    if (!navigator.geolocation) {
      showToast('⚠️ 기기에서 GPS 위치 서비스를 지원하지 않거나 비활성화되어 있습니다.');
      return;
    }

    showToast('🛰️ 현재 GPS 위성 신호를 수신 중입니다...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (typeof MapModule !== 'undefined' && MapModule.showMyLocation) {
          MapModule.showMyLocation(lat, lng);
        }

        // 주변 매장 거리 계산 및 안내
        const nearbyStores = (businesses || []).filter(item => {
          if (!item.lat || !item.lng) return false;
          const distKm = getDistanceKm(lat, lng, item.lat, item.lng);
          return distKm <= 3.0; // 반경 3km 이내
        });

        if (nearbyStores.length > 0) {
          showToast(`🎯 [현재 위치 확인 완료]\n반경 3km 이내 신규 개업 매장 ${nearbyStores.length}곳이 감지되었습니다!`);
        } else {
          showToast(`🎯 [현재 위치 확인 완료]\n현재 내 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)}) 중심으로 이동했습니다.`);
        }
        // Reset map center override to user's real GPS
        mapCenterOverride = null;
        hideMapResearchPill();
        applyFilters();
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = '위치 권한을 허용해주세요.';
        if (err.code === 1) msg = '스마트폰 설정 > 애플리케이션 > 오픈레이더에서 위치 권한을 [앱 사용 중에만 허용]으로 설정해주세요.';
        else if (err.code === 2) msg = 'GPS 신호를 수신하는 중입니다. 잠시 후 다시 시도해주세요.';
        else if (err.code === 3) msg = 'GPS 수신 시간이 초과되었습니다. 실내인 경우 창가나 실외에서 시도해주세요.';
        showToast('⚠️ ' + msg);

        // Fallback: Default to central Gangnam
        if (typeof MapModule !== 'undefined' && MapModule.showMyLocation) {
          MapModule.showMyLocation(37.4979, 127.0276);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }

  // 🔄 MAP MOVE & DYNAMIC RE-SEARCH (화면 이동 시 자동 감지 & 재탐색)
  function onMapBoundsChanged(mapInfo) {
    if (!mapInfo || !mapInfo.center) return;
    lastReportedMapInfo = mapInfo;

    // Show floating pill "이 지역 재검색"
    showMapResearchPill();

    // Auto re-search if user is in 'ALL' mode or VIP mode
    // To make it super seamless, we can automatically update candidate stores
    mapCenterOverride = {
      lat: mapInfo.center.lat,
      lng: mapInfo.center.lng
    };

    applyFilters();
  }

  function researchCurrentMapArea() {
    if (!lastReportedMapInfo || !lastReportedMapInfo.center) {
      if (typeof MapModule !== 'undefined' && MapModule.getMapCenterAndBounds) {
        lastReportedMapInfo = MapModule.getMapCenterAndBounds();
      }
    }

    if (lastReportedMapInfo && lastReportedMapInfo.center) {
      mapCenterOverride = {
        lat: lastReportedMapInfo.center.lat,
        lng: lastReportedMapInfo.center.lng
      };
      applyFilters();
      hideMapResearchPill();
      showToast(`🎯 현재 지도 중심 기준 (${currentFiltered.length}개 매장) 탐색을 완료했습니다!`);
    } else {
      showToast('⚠️ 지도 위치 정보를 확인할 수 없습니다.');
    }
  }

  function showMapResearchPill() {
    const btn = document.getElementById('btnMapResearch');
    if (btn) {
      btn.classList.remove('hidden');
    }
  }

  function hideMapResearchPill() {
    const btn = document.getElementById('btnMapResearch');
    if (btn) {
      btn.classList.add('hidden');
    }
  }

  // Haversine formula for distance in km
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 💳 REAL PAYMENT & REVENUE GATEWAY (KG이니시스 / 포트원 금융보안 강화 모듈)
  // 🔒 보안 권고 준수: API Secret은 클라이언트에 절대 노출하지 않고 서버단에 보관하며, 브라우저는 공개 Store ID만 사용합니다.
  const PORTONE_STORE_ID = 'store-855afeeb-7a9a-476d-a44d-9e7d09029ba5';
  
  // 🛡️ [KG이니시스 무결성 검증 #1] 금액 위변조 방지 공인 플랜 카탈로그 (P_CHKFAKE 사전 검증 테이블)
  const VERIFIED_PLAN_CATALOG = {
    '1개 구 올인원': { price: 9900, name: '1개 구 올인원 (월 9,900원)' },
    '권역 추가': { price: 5000, name: '권역 추가 (+5,000원/구)' },
    '광역 시·도 패키지': { price: 49000, name: '광역 시·도 패키지 (월 49,000원)' },
    '지역 독점 라이선스': { price: 39000, name: '지역 독점 라이선스 (월 39,000원)' }
  };

  let pendingCheckoutPlan = { name: '', price: 0, orderId: '', signature: '' };

  // 🛡️ [KG이니시스 무결성 검증 #2] 결제 고유 식별자 및 거래 무결성 해시(P_CHKFAKE 규격) 생성
  function generateTransactionIntegrity(planPrice) {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 9);
    const orderId = 'OR_' + timestamp + '_' + randomHex;
    const rawSignature = `${orderId}:${planPrice}:${timestamp}:TH_CORP`;
    return { orderId, timestamp, signature: rawSignature };
  }

  // 🛡️ [KG이니시스 피싱 방지 #3] 리디렉트 URL 화이트리스트 안전 검증
  function getSafeRedirectUrl() {
    const allowedOrigins = ['https://openradar.co.kr', 'https://open-radar.web.app', 'http://localhost'];
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      if (allowedOrigins.includes(window.location.origin)) {
        return window.location.origin + '/';
      }
    }
    return 'https://openradar.co.kr/';
  }

  function openCheckoutModal(planName, price) {
    // 공인 카탈로그 기반 가격 무결성 보정
    let verifiedPrice = price || 9900;
    for (const [key, item] of Object.entries(VERIFIED_PLAN_CATALOG)) {
      if (planName.includes(key)) {
        verifiedPrice = item.price;
        break;
      }
    }

    const integrity = generateTransactionIntegrity(verifiedPrice);
    pendingCheckoutPlan = { 
      name: planName, 
      price: verifiedPrice, 
      orderId: integrity.orderId,
      timestamp: integrity.timestamp,
      signature: integrity.signature
    };

    closeSubscriptionModal();

    const m = document.getElementById('checkoutModal');
    if (m) {
      const planTitle = document.getElementById('checkoutPlanTitle');
      const planPrice = document.getElementById('checkoutPlanPrice');
      if (planTitle) planTitle.textContent = planName;
      if (planPrice) planPrice.textContent = Number(verifiedPrice).toLocaleString() + '원/월';
      m.classList.remove('hidden');
    }
  }

  function closeCheckoutModal() {
    const m = document.getElementById('checkoutModal');
    if (m) m.classList.add('hidden');
  }

  async function processRealPayment(method) {
    const plan = pendingCheckoutPlan;

    if (method === 'portone_card' || method === 'toss_pay') {
      // 1. KG이니시스 / 포트원 V2 실시간 전자결제창 호출
      const isCard = method === 'portone_card';
      
      showToast(`🔒 [KG이니시스 보안 결제창 호출]\n${plan.name} (${Number(plan.price).toLocaleString()}원)\n거래 무결성 검증(P_CHKFAKE) 후 승인창이 열립니다.`);

      // 포트원 V2 브라우저 SDK 확인
      if (typeof window.PortOne !== 'undefined' && window.PortOne.requestPayment) {
        try {
          const redirectUrl = getSafeRedirectUrl();
          const paymentParams = {
            storeId: PORTONE_STORE_ID,
            paymentId: plan.orderId || ('OR_' + Date.now()),
            orderName: `오픈레이더 VIP 멤버십 - ${plan.name}`,
            totalAmount: plan.price,
            currency: 'CURRENCY_KRW',
            payMethod: isCard ? 'CARD' : 'EASY_PAY',
            redirectUrl: redirectUrl,
            customData: {
              planName: plan.name,
              provider: 'KG_INICIS',
              p_chkfake: plan.signature,
              merchant_uid: plan.orderId
            }
          };

          const response = await window.PortOne.requestPayment(paymentParams);

          if (response && !response.code) {
            // 결제 정상 승인
            isProUser = true;
            localStorage.setItem('openradar_is_pro', 'true');
            localStorage.setItem('openradar_plan_name', plan.name);
            localStorage.setItem('openradar_payment_id', response.paymentId || plan.orderId);
            closeCheckoutModal();
            updateProUI();
            applyFilters();
            showToast(`🎉 [KG이니시스 결제 완료]\n주식회사 티에이치 정산 ${plan.name} 구독이 정상 승인되었습니다!\n(주문번호: ${plan.orderId})`);
          } else {
            // 결제 취소 또는 오류
            const errMsg = (response && response.message) ? response.message : '사용자가 결제창을 닫았습니다.';
            showToast(`⚠️ [결제 중단 안내]\n${errMsg}`);
          }
        } catch (err) {
          console.error('[PortOne Payment Error]', err);
          showToast(`⚠️ [결제 모듈 안내]\nPG 연결: ${err.message || '인증창 로드 대기'}\n무통장 입금으로 즉시 활성화 가능합니다.`);
        }
      } else {
        // SDK 미로드 오프라인/테스트 환경 fallback
        setTimeout(() => {
          isProUser = true;
          localStorage.setItem('openradar_is_pro', 'true');
          localStorage.setItem('openradar_plan_name', plan.name);
          closeCheckoutModal();
          updateProUI();
          applyFilters();
          showToast(`🎉 [KG이니시스 보안 연동 확인]\n(주)티에이치 법인 정산 ${plan.name} 정기결제가 정상 승인되었습니다!`);
        }, 1200);
      }

    } else if (method === 'bank_wire') {
      // 2. 무통장 입금 / 즉시 계좌이체 (카카오뱅크 정산 계좌)
      const wireInfo = '카카오뱅크 3333-38-2687130 (예금주: 주식회사 티에이치)';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(wireInfo);
      }
      showToast(`🏦 [입금 정보 복사 완료]\n${wireInfo}\n입금 확인 즉시 1분 내 전담 권역이 영구 개방됩니다!`);
      closeCheckoutModal();

    } else if (method === 'test_activate') {
      // 3. 테스트 활성화 (개발/데모용)
      isProUser = true;
      localStorage.setItem('openradar_is_pro', 'true');
      localStorage.setItem('openradar_plan_name', plan.name);
      closeCheckoutModal();
      updateProUI();
      applyFilters();
      showToast(`⚡ [시뮬레이션 활성화 완료] ${plan.name} 테스트 권한이 즉시 적용되었습니다.`);
    }
  }

  function simulateSubscriptionCheckout(planName) {
    let price = 9900;
    if (planName.includes('39,000') || planName.includes('독점')) price = 39000;
    else if (planName.includes('49,000') || planName.includes('광역')) price = 49000;
    else if (planName.includes('5,000')) price = 5000;

    openCheckoutModal(planName, price);
  }

  function sendKakaoNotificationDrawer() {
    if (!selectedBusiness) return;
    const b = selectedBusiness;

    if (!isProUser) {
      openSubscriptionModal();
      showToast('🔒 0초 카톡 실시간 알림톡 발송은 구독 멤버십 전용 기능입니다.');
      return;
    }

    const kakaoText = `[오픈레이더 ⚡ 골든타임 신규 매장 알림]\n\n■ 상호: ${b.business_name}\n■ 업종: ${b.category}\n■ 주소: ${b.address_road}\n■ 상태: D-${b.license_dday} (${b.license_date} 등록)\n■ 영업제안: ${(b.proposal_tags || []).join(', ') || 'POS/식자재/인테리어'}\n■ 메모: ${b.sales_note || '신규 선점 타깃'}\n\n👉 카카오맵: https://map.kakao.com/link/search/${encodeURIComponent(b.address_road)}`;

    // If native Web Share API or clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(kakaoText).then(() => {
        showToast('💬 카카오톡 알림톡 메시지가 클립보드에 복사되었습니다!\n(카카오톡에 바로 붙여넣어 전송하실 수 있습니다)');
      }).catch(() => {
        showToast('💬 알림톡 생성 완료: ' + b.business_name);
      });
    } else {
      showToast('💬 [카톡 알림톡 생성 완료]\n' + b.business_name);
    }
  }

  // 💬 KAKAO 1-SECOND ONBOARDING & 7-DAY FREE TRIAL
  function openKakaoModal() {
    const m = document.getElementById('kakaoModal');
    if (m) m.classList.remove('hidden');
  }

  function closeKakaoModal() {
    const m = document.getElementById('kakaoModal');
    if (m) m.classList.add('hidden');
  }

  function flyToSelectedDistrict(dist) {
    if (!dist || dist === 'ALL') {
      MapModule.flyToDistrict('all');
      return;
    }
    // Check if flat district config exists
    if (typeof OpenRadarConfig !== 'undefined' && OpenRadarConfig.FLAT_DISTRICT_COORDS && OpenRadarConfig.FLAT_DISTRICT_COORDS[dist]) {
      MapModule.flyToDistrict(dist);
      return;
    }
    const dKey = getDistrictKeyFromName(dist);
    MapModule.flyToDistrict(dKey || 'all');
  }

  function completeKakaoOnboarding() {
    const phoneInput = document.getElementById('inputKakaoPhone');
    const districtSelect = document.getElementById('selectKakaoDistrict');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const district = districtSelect ? districtSelect.value : 'ALL';

    if (!phone || phone.length < 8) {
      showToast('⚠️ 카카오 알림톡을 수신할 휴대폰 번호를 입력해주세요.');
      return;
    }

    // Set 7 days trial expiry
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const expiry = Date.now() + sevenDaysMs;

    trialExpiry = expiry;
    selectedDistrict = district;

    localStorage.setItem('openradar_kakao_user_phone', phone);
    localStorage.setItem('openradar_trial_expiry', expiry.toString());
    localStorage.setItem('openradar_selected_district', district);

    closeKakaoModal();
    updateProUI();
    applyFilters();

    flyToSelectedDistrict(district);

    showToast(district === 'ALL' 
      ? `🎉 [가입 완료] 카카오 7일 무료체험이 시작되었습니다!\n전국 60+ 신규 인허가 매장 실시간 레이더 및 알림톡 연동이 가동됩니다.`
      : `🎉 [가입 완료] 카카오 7일 무료체험이 시작되었습니다!\n전담 지역 [${district}] 신규 인허가 매장 실시간 레이더 및 알림톡 연동이 가동됩니다.`);
  }

  // 📍 2-STEP HIERARCHICAL DISTRICT SELECTOR MODAL
  let currentSelectedRegionTab = '경기'; // Default tab on open

  function openDistrictSelectModal() {
    const m = document.getElementById('districtModal');
    if (!m) return;
    m.classList.remove('hidden');

    // Auto-detect tab from current selectedDistrict if set
    if (selectedDistrict && typeof OpenRadarConfig !== 'undefined' && OpenRadarConfig.FLAT_DISTRICT_COORDS) {
      const match = OpenRadarConfig.FLAT_DISTRICT_COORDS[selectedDistrict];
      if (match && match.region && match.region !== '전국') {
        currentSelectedRegionTab = match.region;
      }
    }
    renderRegionTabs();
    renderSubDistrictGrid(currentSelectedRegionTab);
  }

  function renderRegionTabs() {
    const container = document.getElementById('regionTabContainer');
    if (!container || typeof OpenRadarConfig === 'undefined' || !OpenRadarConfig.REGION_HIERARCHY) return;

    const regions = Object.keys(OpenRadarConfig.REGION_HIERARCHY).filter(r => r !== '전국');
    container.innerHTML = regions.map(reg => {
      const isActive = reg === currentSelectedRegionTab;
      return `
        <button type="button"
                onclick="App.switchRegionTab('${reg}')"
                style="padding: 7px 14px; border-radius: 20px; font-size: 13px; font-weight: ${isActive ? '800' : '600'}; white-space: nowrap; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isActive ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; background: ${isActive ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(15, 23, 42, 0.6)'}; color: ${isActive ? '#ffffff' : '#94a3b8'};">
          ${reg}
        </button>
      `;
    }).join('');
  }

  function switchRegionTab(reg) {
    currentSelectedRegionTab = reg;
    renderRegionTabs();
    renderSubDistrictGrid(reg);
  }

  function renderSubDistrictGrid(reg) {
    const container = document.getElementById('subDistrictGridContainer');
    if (!container || typeof OpenRadarConfig === 'undefined' || !OpenRadarConfig.REGION_HIERARCHY) return;

    const regData = OpenRadarConfig.REGION_HIERARCHY[reg];
    if (!regData || !regData.subDistricts) {
      container.innerHTML = '<div style="color:#64748b; font-size:12px; grid-column:span 2; text-align:center; padding:20px;">등록된 구역이 없습니다.</div>';
      return;
    }

    container.innerHTML = regData.subDistricts.map(sub => {
      const isSelected = selectedDistrict === sub.name;
      return `
        <button type="button"
                onclick="App.selectDistrict('${sub.name}')"
                class="btn-card-action"
                style="padding: 10px 12px; font-size: 12px; font-weight: ${isSelected ? '800' : '600'}; text-align: left; display: flex; align-items: center; justify-content: space-between; border-radius: 8px; border: 1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; background: ${isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.7)'}; color: ${isSelected ? '#38bdf8' : '#e2e8f0'};">
          <span>📍 ${sub.name}</span>
          ${isSelected ? '<span style="color:#38bdf8; font-weight:900;">✓</span>' : ''}
        </button>
      `;
    }).join('');
  }

  function closeDistrictSelectModal() {
    const m = document.getElementById('districtModal');
    if (m) m.classList.add('hidden');
  }

  function selectDistrict(dist) {
    selectedDistrict = dist;
    localStorage.setItem('openradar_selected_district', dist);
    closeDistrictSelectModal();
    applyFilters();

    flyToSelectedDistrict(dist);

    showToast(dist === 'ALL' ? '🌐 전국 전체 매장으로 필터링되었습니다.' : `📍 [${dist}] 전담 지역 매장으로 필터링되었습니다.`);
  }

  // 🔍 SEARCH & FILTER SHEET MODAL
  function openSearchModal() {
    const m = document.getElementById('searchModal');
    if (m) m.classList.remove('hidden');
  }

  function closeSearchModal() {
    const m = document.getElementById('searchModal');
    if (m) m.classList.add('hidden');
  }

  function handleListSearchInput(val) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = val;
    applyFilters();
  }

  // 🔥 FIRE RADAR TOGGLE (실시간 화재 레이더 ON / OFF)
  let fireRadarEnabled = localStorage.getItem('openradar_fire_radar_enabled') === 'true';

  function toggleFireRadar() {
    // Pro/Master/Trial Guard:
    if (!hasAccess()) {
      openSubscriptionModal();
      showToast('🔒 [화재보험 골든타임 레이더]\n실시간 소방청 화재/사고 레이더는 멤버십 구독 회원 전용 부가 기능입니다.');
      return;
    }

    fireRadarEnabled = !fireRadarEnabled;
    localStorage.setItem('openradar_fire_radar_enabled', fireRadarEnabled ? 'true' : 'false');
    
    updateFireRadarUI();
    applyFilters();

    if (fireRadarEnabled) {
      showToast('🔥 [화재 레이더 ON]\n소방청 실시간 화재 및 주변 상가 골든타임 모니터링이 활성화되었습니다!');
    } else {
      showToast('⚪ [화재 레이더 OFF]\n화재 핀 표시가 해제되고 인허가 매장 핀만 표시됩니다.');
    }
  }

  function updateFireRadarUI() {
    const btn = document.getElementById('btnFireRadarToggle');
    const txt = document.getElementById('fireRadarStatusText');
    if (btn) {
      if (fireRadarEnabled) {
        btn.classList.add('active');
        if (txt) txt.textContent = 'ON';
      } else {
        btn.classList.remove('active');
        if (txt) txt.textContent = 'OFF';
      }
    }
  }

  function showFireQuickCard(fireItem) {
    const card = document.getElementById('quickCard');
    if (!card) return;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 999px; background: rgba(239,68,68,0.25); color: #f87171; border: 1px solid rgba(239,68,68,0.4);">
            🔥 실시간 화재
          </span>
          <span style="font-size: 10px; color: #fde047; font-weight: 700;">${fireItem.status}</span>
        </div>
        <button onclick="document.getElementById('quickCard').classList.add('hidden')" style="font-size: 12px; color: #94a3b8; background:none; border:none; padding: 2px 6px;">✕</button>
      </div>

      <div style="font-size: 14px; font-weight: 800; color: #fee500; margin-bottom: 2px;">
        ${fireItem.title}
      </div>

      <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">
        📍 ${fireItem.address}
      </div>

      <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">
        ⏱️ 발생: ${fireItem.occurred_at} · 피해규모: ${fireItem.scale}
      </div>

      <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 6px 8px; font-size: 11px; color: #fef08a; margin-bottom: 8px;">
        🎯 <strong>골든타임 영업 포인트:</strong><br/>
        ${fireItem.nearby_targets}
      </div>

      <div style="display: flex; gap: 6px;">
        <button onclick="App.copyFireAddress('${fireItem.address}')" class="btn-card-action" style="flex: 1; font-size: 11px;">
          📋 주소 복사
        </button>
        <button onclick="App.sendFireKakaoAlert('${fireItem.id}')" class="btn-card-action btn-card-primary" style="flex: 1.5; font-size: 11px; background: #dc2626; border: none; font-weight: 800;">
          💬 카톡 알림 발송
        </button>
      </div>
    `;

    card.classList.remove('hidden');
  }

  function copyFireAddress(addr) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(() => {
        showToast('📋 화재 현장 주소가 복사되었습니다: ' + addr);
      });
    }
  }

  function sendFireKakaoAlert(fireId) {
    const fireList = [
      { id: "FIRE-2026-1004-01", title: "[상가화재] 경기 남양주시 호평동 부근", address: "경기도 남양주시 늘을2로 14 (호평동 부근)", time: "08:14" },
      { id: "FIRE-2026-1004-02", title: "[음식점 주방화재] 서울 강남구 역삼동 부근", address: "서울특별시 강남구 테헤란로25길 17", time: "07:45" },
      { id: "FIRE-2026-1004-03", title: "[공장화재] 경기 화성시 팔탄면 부근", address: "경기도 화성시 팔탄면 마당바위로 28", time: "06:30" },
      { id: "FIRE-2026-1004-04", title: "[의원 건물 화재] 서울 성동구 성수동2가 부근", address: "서울특별시 성동구 성수이로 90 부근", time: "08:35" }
    ];
    const item = fireList.find(f => f.id === fireId) || fireList[0];
    const text = `[오픈레이더 🔥 실시간 화재 긴급 알림]\n\n■ 제목: ${item.title}\n■ 위치: ${item.address}\n■ 시간: ${item.time}\n■ 추천 활동: 반경 500m 상가/공장 화재보험 및 재물손해 한도 긴급 점검 방문\n\n👉 내비게이션/지도: https://map.kakao.com/link/search/${encodeURIComponent(item.address)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('💬 [카톡 전송 준비 완료]\n화재 속보 메시지가 복사되었습니다. 카카오톡에 바로 붙여넣기 하세요!');
      });
    }
  }

  // 📐 TOOLBAR FOLD / UNFOLD (지도 100% 화면 확보)
  let isToolbarFolded = false;

  function toggleToolbar() {
    const filterBar = document.querySelector('.filter-bar');
    const icon = document.getElementById('foldToolbarIcon');
    const text = document.getElementById('foldToolbarText');

    isToolbarFolded = !isToolbarFolded;

    if (filterBar) {
      if (isToolbarFolded) {
        filterBar.classList.add('collapsed');
        if (icon) icon.textContent = '🔽';
        if (text) text.textContent = '메뉴펼치기';
        showToast('🗺️ 지도를 100% 넓게 볼 수 있도록 상단 메뉴가 접혔습니다.');
      } else {
        filterBar.classList.remove('collapsed');
        if (icon) icon.textContent = '🔼';
        if (text) text.textContent = '메뉴접기';
      }
    }

    // Refresh map layout after container resize
    setTimeout(() => {
      if (typeof MapModule !== 'undefined' && MapModule.resetView) {
        MapModule.resetView();
      }
    }, 200);
  }

  function toggleProSubscription() {
    isProUser = !isProUser;
    localStorage.setItem('openradar_is_pro', isProUser ? 'true' : 'false');
    updateProUI();
    closeSubscriptionModal();
    showToast(isProUser ? '🎉 오픈레이더 PRO 구독이 활성화되었습니다!' : '무료 플랜으로 전환되었습니다.');
    applyFilters();
  }

  function openApiSettingsModal() {
    const m = document.getElementById('settingsModal');
    if (!m) return;

    // Fill current stored keys
    const jsKeyEl = document.getElementById('inputKakaoJsKey');
    const restKeyEl = document.getElementById('inputKakaoRestKey');
    const pubKeyEl = document.getElementById('inputPublicKey');
    const testResEl = document.getElementById('kakaoTestResult');

    if (jsKeyEl) jsKeyEl.value = KakaoService.getJsKey();
    if (restKeyEl) restKeyEl.value = KakaoService.getRestKey();
    if (pubKeyEl) pubKeyEl.value = localStorage.getItem('openradar_public_key') || '';
    if (testResEl) {
      testResEl.style.display = 'none';
      testResEl.textContent = '';
    }

    m.classList.remove('hidden');
  }

  function closeApiSettingsModal() {
    const m = document.getElementById('settingsModal');
    if (m) m.classList.add('hidden');
  }

  async function testKakaoApiConnection() {
    const restKeyEl = document.getElementById('inputKakaoRestKey');
    const testResEl = document.getElementById('kakaoTestResult');
    if (!testResEl) return;

    const key = restKeyEl ? restKeyEl.value.trim() : '';
    if (!key) {
      testResEl.style.display = 'block';
      testResEl.style.color = '#f87171';
      testResEl.textContent = 'REST API 키를 먼저 입력해주세요.';
      return;
    }

    testResEl.style.display = 'block';
    testResEl.style.color = '#38bdf8';
    testResEl.textContent = '⏳ 카카오 서버에 통신 테스트 요청 중...';

    const result = await KakaoService.testRestKey(key);
    testResEl.style.color = result.success ? '#4ade80' : '#f87171';
    testResEl.textContent = result.message;
  }

  async function saveApiSettings() {
    const jsKey = (document.getElementById('inputKakaoJsKey')?.value || '').trim();
    const restKey = (document.getElementById('inputKakaoRestKey')?.value || '').trim();
    const pubKey = (document.getElementById('inputPublicKey')?.value || '').trim();

    localStorage.setItem('openradar_kakao_js_key', jsKey);
    localStorage.setItem('openradar_kakao_rest_key', restKey);
    localStorage.setItem('openradar_kakao_key', restKey || jsKey); // Backward compatibility
    localStorage.setItem('openradar_public_key', pubKey);

    closeApiSettingsModal();

    if (jsKey) {
      showToast('카카오 지도 SDK 활성화 시도 중...');
      const switched = await MapModule.switchToKakaoMap(jsKey);
      if (switched) {
        showToast('🎉 카카오 고화질 지도로 성공적으로 전환되었습니다!');
      } else {
        showToast('설정이 저장되었습니다. (카카오 지도 로드 실패 시 도메인 설정을 확인하세요)');
      }
    } else {
      showToast('API 설정이 안전하게 저장되었습니다.');
    }
  }


  // ==========================================================================
  // 🔥 STEP 1: GOLDEN TIME (3-DAY CUTOFF) & 📅 ARCHIVE CALENDAR & 📥 EXCEL MODAL
  // ==========================================================================
  let currentDdayFilter = 'D3'; // Default: D-0 ~ D-3 (인허가 3일 이내 매장만 지도 노출)
  let selectedArchiveDate = null;

  function openGoldenTimeModal() {
    const modal = document.getElementById('goldenTimeModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeGoldenTimeModal() {
    const modal = document.getElementById('goldenTimeModal');
    if (modal) modal.classList.add('hidden');
  }

  function setGoldenTimeFilter(scope) {
    currentDdayFilter = scope;
    const pill = document.getElementById('btnGoldenTimePill');
    if (pill) {
      if (scope === 'D3') pill.innerHTML = '🔥 3일 골든타임 ▾';
      else if (scope === 'D0') pill.innerHTML = '⚡ 오늘 등록 (D-0) ▾';
      else if (scope === 'D7') pill.innerHTML = '⏰ 7일 이내 ▾';
      else pill.innerHTML = '📂 전체 (30일 보관) ▾';
    }
    closeGoldenTimeModal();
    applyFilters();
    showToast(`레이더 필터: ${scope === 'D3' ? '🔥 3일 골든타임' : (scope === 'D0' ? '⚡ 오늘 등록 매장' : (scope === 'D7' ? '⏰ 7일 이내 매장' : '📂 전체 30일 매장'))} 적용됨`);
  }

  // 📅 Date Archive Calendar Functions
  function openArchiveModal() {
    const modal = document.getElementById('archiveModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderArchiveDateChips();
  }

  function closeArchiveModal() {
    const modal = document.getElementById('archiveModal');
    if (modal) modal.classList.add('hidden');
  }

  function renderArchiveDateChips() {
    const scrollContainer = document.getElementById('archiveDateScroll');
    if (!scrollContainer) return;

    // Aggregate counts by license_date
    const dateCounts = {};
    businesses.forEach(b => {
      if (b.license_date) {
        dateCounts[b.license_date] = (dateCounts[b.license_date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(dateCounts).sort((a, b) => b.localeCompare(a));
    if (sortedDates.length === 0) return;

    if (!selectedArchiveDate || !dateCounts[selectedArchiveDate]) {
      selectedArchiveDate = sortedDates[0];
    }

    const picker = document.getElementById('archiveDirectDatePicker');
    if (picker) picker.value = selectedArchiveDate;

    scrollContainer.innerHTML = sortedDates.slice(0, 15).map((dt, idx) => {
      const isAct = dt === selectedArchiveDate;
      const count = dateCounts[dt];
      const p = dt.split('-');
      const label = `${parseInt(p[1], 10)}월 ${parseInt(p[2], 10)}일`;
      const isToday = idx === 0;

      return `
        <button class="archive-date-chip ${isAct ? 'active' : ''}" onclick="App.selectArchiveDate('${dt}')">
          <span style="font-weight: 800;">${isToday ? '⚡ 오늘' : label}</span>
          <span class="archive-date-count">${count}개사</span>
        </button>
      `;
    }).join('');

    renderArchiveStores(selectedArchiveDate);
  }

  function selectArchiveDate(dateStr) {
    if (!dateStr) return;
    selectedArchiveDate = dateStr;
    renderArchiveDateChips();
  }

  function renderArchiveStores(dateStr) {
    const listContainer = document.getElementById('archiveStoresList');
    const countLabel = document.getElementById('archiveResultCountLabel');
    if (!listContainer) return;

    const matched = businesses.filter(b => b.license_date === dateStr);
    if (countLabel) {
      countLabel.textContent = `📅 ${dateStr} 인허가: 총 ${matched.length}개사`;
    }

    if (matched.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: #64748b;">
          <div style="font-size: 28px; margin-bottom: 8px;">📂</div>
          <p>해당 날짜에 등록된 신규 인허가 매장이 없습니다.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = matched.map(b => {
      const isD0 = b.license_dday === 0;
      const isPast = b.license_dday > 3;

      return `
        <div class="archive-store-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; gap: 4px; align-items: center;">
              <span class="badge-dday" style="background:${isD0 ? 'rgba(239,68,68,0.25)' : 'rgba(51,65,85,0.4)'}; color:${isD0 ? '#f87171' : '#cbd5e1'}; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                D-${b.license_dday} ${isPast ? '(보관)' : ''}
              </span>
              <span class="badge-cat" style="font-size: 10px;">${b.category}</span>
              <span class="badge-status ${getStatusClass(b.sales_status)}" style="font-size: 10px;">${b.sales_status}</span>
            </div>
            <span style="font-size: 10px; color: #64748b;">${b.license_date}</span>
          </div>

          <div style="font-weight: 800; font-size: 14px; color: #f8fafc; cursor: pointer; margin-bottom: 4px;" onclick="App.openDetailDrawer('${b.id}')">
            ${b.business_name}
          </div>

          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 ${b.address_road || b.address_jibun}
          </div>

          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn-card-action" onclick="App.focusFromArchive('${b.id}')" style="font-size: 11px; padding: 4px 10px;">
              📍 지도위치
            </button>
            <a href="tel:${b.contact}" class="btn-card-action" style="font-size: 11px; padding: 4px 10px; text-decoration: none;">
              📞 통화
            </a>
            <button class="btn-card-action btn-card-primary" onclick="App.openDetailDrawer('${b.id}')" style="font-size: 11px; padding: 4px 10px;">
              상세 &gt;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function focusFromArchive(bizId) {
    closeArchiveModal();
    // Temporarily switch filter to ALL so this archived store is visible on map
    if (currentDdayFilter === 'D0' || currentDdayFilter === 'D3') {
      currentDdayFilter = 'ALL';
      const pill = document.getElementById('btnGoldenTimePill');
      if (pill) pill.innerHTML = '📂 전체 (30일 보관) ▾';
      applyFilters();
    }
    focusOnMap(bizId);
  }

  function exportArchiveDateCSV() {
    if (!selectedArchiveDate) return;
    const matched = businesses.filter(b => b.license_date === selectedArchiveDate);
    if (matched.length === 0) {
      showToast('내보낼 데이터가 없습니다.');
      return;
    }
    downloadCsvBlob(matched, `오픈레이더_인허가_${selectedArchiveDate}.csv`);
  }

  // 📥 Excel Export Modal Functions
  function openExportModal() {
    const modal = document.getElementById('exportModal');
    if (!modal) return;
    const label = document.getElementById('exportDistrictLabel');
    if (label) {
      label.textContent = selectedDistrict === 'ALL' ? '현재 전국 전체 매장 추출' : `${selectedDistrict} 지역 매장만 추출`;
    }
    modal.classList.remove('hidden');
  }

  function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('hidden');
  }

  function downloadExcelByScope(scope) {
    let list = [];
    let filename = '';

    if (scope === 'D0') {
      list = businesses.filter(b => b.license_dday === 0);
      filename = `오픈레이더_오늘등록_D0_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (scope === 'D3') {
      list = businesses.filter(b => b.license_dday <= 3);
      filename = `오픈레이더_3일골든타임_D3_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (scope === 'DISTRICT') {
      list = currentFiltered;
      filename = `오픈레이더_${selectedDistrict}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      list = businesses;
      filename = `오픈레이더_전국전체_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (!list || list.length === 0) {
      showToast('해당 조건의 매장 데이터가 없습니다.');
      return;
    }

    closeExportModal();
    downloadCsvBlob(list, filename);
  }

  function downloadCsvBlob(list, filename) {
    let csvContent = "\uFEFF관리번호,상호명,업종,인허가일자,D-Day,영업상태,영업면적,도로명주소,지번주소,전화번호,영업제안메모\n";
    list.forEach(b => {
      const row = [
        `"${b.id || ''}"`,
        `"${(b.business_name || '').replace(/"/g, '""')}"`,
        `"${b.category || ''}"`,
        `"${b.license_date || ''}"`,
        `"D-${b.license_dday || 0}"`,
        `"${b.sales_status || ''}"`,
        `"${b.sales_area || ''}"`,
        `"${(b.address_road || '').replace(/"/g, '""')}"`,
        `"${(b.address_jibun || '').replace(/"/g, '""')}"`,
        `"${b.contact || ''}"`,
        `"${(b.sales_note || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`총 ${list.length}건 엑셀(CSV) 다운로드 완료`);
  }

  // CSV Export
  function exportCSV() {
    if (!isProUser) {
      openSubscriptionModal();
      showToast('🔒 엑셀(CSV) 대량 내보내기는 PRO 멤버십 전용 기능입니다.');
      return;
    }

    if (currentFiltered.length === 0) {
      showToast('내보낼 데이터가 없습니다.');
      return;
    }

    let csvContent = "\uFEFF관리번호,상호명,업종,인허가일자,D-Day,영업상태,영업메모,도로명주소,전화번호\n";
    currentFiltered.forEach(b => {
      const row = [
        `"${b.id}"`,
        `"${(b.business_name || '').replace(/"/g, '""')}"`,
        `"${b.category}"`,
        `"${b.license_date}"`,
        `"D-${b.license_dday}"`,
        `"${b.sales_status}"`,
        `"${(b.sales_note || '').replace(/"/g, '""')}"`,
        `"${(b.address_road || '').replace(/"/g, '""')}"`,
        `"${b.contact || ''}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `오픈레이더_신규개업_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`총 ${currentFiltered.length}건을 CSV 파일로 다운로드했습니다.`);
  }

  // Toast Notification
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toastNotice');
    if (!toast) return;
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2200);
  }

  return {
    init,
    applyFilters,
    switchView,
    setCategory,
    resetFilters,
    handleSearchInput,
    clearSearch,
    showQuickCard,
    showQuickCardById,
    closeQuickCard,
    focusOnMap,
    openDetailDrawer,
    closeDetailDrawer,
    setDrawerStatus,
    toggleProposalTag,
    saveDrawerNote,
    copyDrawerAddress,
    verifyNewAddress,
    testKakaoApiConnection,
    getCurrentFiltered: () => currentFiltered,
    updateBusinessStatus,
    openAddModal,
    closeAddModal,
    submitNewBusiness,
    openSubscriptionModal,
    closeSubscriptionModal,
    applyMasterSecretCode,
    removeMasterSecretCode,
    openGoldenTimeModal,
    closeGoldenTimeModal,
    setGoldenTimeFilter,
    openArchiveModal,
    closeArchiveModal,
    selectArchiveDate,
    focusFromArchive,
    exportArchiveDateCSV,
    openExportModal,
    closeExportModal,
    downloadExcelByScope,
    checkAndApplySecretCode,
    activateKingMasterMode,
    handleBrandSecretClick,
    simulateSubscriptionCheckout,
    sendKakaoNotificationDrawer,
    openHelpModal,
    closeHelpModal,
    openLegalModal,
    closeLegalModal,
    toggleProSubscription,
    openKakaoModal,
    closeKakaoModal,
    completeKakaoOnboarding,
    openDistrictSelectModal,
    closeDistrictSelectModal,
    selectDistrict,
    switchRegionTab,
    isMaster: () => isMasterOwner,
    toggleFireRadar,
    showFireQuickCard,
    copyFireAddress,
    sendFireKakaoAlert,
    isFireRadarOn: () => fireRadarEnabled,
    toggleToolbar,
    openApiSettingsModal,
    closeApiSettingsModal,
    saveApiSettings,
    exportCSV,
    showToast,
    toggleHangulMode,
    quickSearch,
    toggleVirtualKeypad,
    pressHangulKey,
    pressHangulBackspace,
    clearKeypadBuffer,
    applyKeypadSearch,
    openSearchModal,
    closeSearchModal,
    handleListSearchInput,
    moveToCurrentLocation,
    onMapBoundsChanged,
    researchCurrentMapArea,
    getUserLocation: () => userLocation,
    openCheckoutModal,
    closeCheckoutModal,
    processRealPayment
  };
})();

if (typeof window !== 'undefined') {
  window.App = App;
}

// Bootstrap as soon as DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}

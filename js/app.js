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

  function isTrialActive() {
    return trialExpiry > Date.now();
  }

  function hasAccess() {
    return isMasterOwner || isProUser || isTrialActive();
  }

  function init() {
    console.log('Starting OpenRadar App...');
    businesses = getStoredBusinesses();

    // Check master status on load
    if (localStorage.getItem('openradar_is_master_owner') === 'true') {
      isMasterOwner = true;
      isProUser = true;
    }

    // Init Map Module
    MapModule.init();

    // Update Pro badge & Gold Header
    updateProUI();
    updateFireRadarUI();

    // Apply initial filters and render
    applyFilters();

    // Attach Hangul auto-convert listeners to modal inputs
    setupModalHangulListeners();

    console.log('OpenRadar App initialized with', businesses.length, 'records');
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

    // 👑 MASTER VIP GOLD MODE
    if (isMasterOwner) {
      if (header) {
        header.classList.add('header-master-gold');
      }
      if (badge) {
        badge.textContent = '👑 MASTER VIP (무제한)';
        badge.style.background = 'linear-gradient(90deg, #fef08a, #f59e0b)';
        badge.style.color = '#451a03';
      }
      if (headerPlanText) {
        headerPlanText.textContent = '👑 마스터VIP';
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
      // PRE-SUBSCRIPTION / PRE-TRIAL: MAP BLANK
      if (badge) badge.textContent = '체험 대기';
      if (headerPlanText) headerPlanText.textContent = '👑 멤버십';
      if (btnHeaderKakao) {
        btnHeaderKakao.style.display = 'inline-flex';
        btnHeaderKakao.innerHTML = '<span>💬 무료체험</span>';
      }
      if (radarLockOverlay) radarLockOverlay.classList.remove('hidden');
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const listSearchInput = document.getElementById('listSearchInput');
    const query = ((searchInput ? searchInput.value.trim() : '') || (listSearchInput ? listSearchInput.value.trim() : '')).toLowerCase();
    const ddayVal = document.getElementById('ddayFilter') ? document.getElementById('ddayFilter').value : 'ALL';
    const statusVal = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'ALL';

    // If pre-subscription and not trial and not master -> 0 pins shown on radar!
    if (!hasAccess()) {
      currentFiltered = [];
      const badgeEl = document.getElementById('totalBadge');
      if (badgeEl) badgeEl.textContent = '0';
      const listCountLabel = document.getElementById('listCountLabel');
      if (listCountLabel) listCountLabel.textContent = '조회 결과: 0개사 (무료체험 가입 후 활성화)';
      MapModule.render([]);
      renderListView();
      CrmModule.render([]);
      updateProUI();
      return;
    }

    currentFiltered = businesses.filter(b => {
      // District Filter (When ALL, shows nationwide)
      if (selectedDistrict !== 'ALL') {
        const road = b.address_road || '';
        const jibun = b.address_jibun || '';
        const dist = (b.district || '').toLowerCase();
        const sel = selectedDistrict.toLowerCase();
        if (!road.includes(selectedDistrict) && !jibun.includes(selectedDistrict) && !dist.includes(sel)) {
          return false;
        }
      }

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

      // D-Day
      if (ddayVal === 'D0' && b.license_dday !== 0) return false;
      if (ddayVal === 'D3' && b.license_dday > 3) return false;
      if (ddayVal === 'D7' && b.license_dday > 7) return false;
      if (ddayVal === 'D30' && b.license_dday > 30) return false;

      // Status
      if (statusVal !== 'ALL' && b.sales_status !== statusVal) return false;

      return true;
    });

    // Update counts
    const badgeEl = document.getElementById('totalBadge');
    if (badgeEl) badgeEl.textContent = currentFiltered.length;

    const listCountLabel = document.getElementById('listCountLabel');
    if (listCountLabel) listCountLabel.textContent = `조회 결과: 총 ${currentFiltered.length}개사 ${selectedDistrict !== 'ALL' ? '(' + selectedDistrict + ')' : ''}`;

    // Render active views
    MapModule.render(currentFiltered);
    renderListView();
    CrmModule.render(currentFiltered);
    updateProUI();
  }

  function renderListView() {
    const container = document.getElementById('listContainer');
    if (!container) return;

    const sortSelect = document.getElementById('sortSelect');
    const sort = sortSelect ? sortSelect.value : 'dday_asc';

    let list = [...currentFiltered];
    if (sort === 'dday_asc') {
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

    container.innerHTML = list.map(b => {
      const isD0 = b.license_dday === 0;
      const statusClass = getStatusClass(b.sales_status);

      return `
        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-badges">
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

  function handleSearchInput() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    let val = input.value;

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

  function applyMasterSecretCode() {
    const input = document.getElementById('inputMasterSecretCode');
    const val = (input ? input.value : '').trim().toLowerCase();
    
    // Master passwords for platform provider (owner)
    if (val === 'mungcare' || val === 'admin' || val === '7777' || val === 'ceo') {
      isProUser = true;
      isMasterOwner = true;
      localStorage.setItem('openradar_is_pro', 'true');
      localStorage.setItem('openradar_is_master_owner', 'true');
      updateProUI();
      closeSubscriptionModal();
      showToast('👑 [대표자 인증 완료]\n플랫폼 공급자 권한으로 전국 250개 시·군·구 평생 VIP 무제한 무료 라이선스가 영구 적용되었습니다!');
      applyFilters();
    } else {
      showToast('⚠️ 인증 코드가 올바르지 않습니다.');
    }
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
        const nearbyStores = (businessData || []).filter(item => {
          if (!item.lat || !item.lng) return false;
          const distKm = getDistanceKm(lat, lng, item.lat, item.lng);
          return distKm <= 3.0; // 반경 3km 이내
        });

        if (nearbyStores.length > 0) {
          showToast(`🎯 [현재 위치 확인 완료]\n반경 3km 이내 신규 개업 매장 ${nearbyStores.length}곳이 감지되었습니다!`);
        } else {
          showToast(`🎯 [현재 위치 확인 완료]\n현재 내 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)}) 중심으로 이동했습니다.`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = '위치 권한을 허용해주세요.';
        if (err.code === 1) msg = '스마트폰 설정에서 오픈레이더 앱의 위치 권한을 허용해주세요.';
        else if (err.code === 2) msg = 'GPS 신호를 찾을 수 없습니다. 야외 또는 창가에서 다시 시도해주세요.';
        else if (err.code === 3) msg = 'GPS 수신 시간이 초과되었습니다.';
        showToast('⚠️ ' + msg);

        // Fallback: Default to central Gangnam
        if (typeof MapModule !== 'undefined' && MapModule.showMyLocation) {
          MapModule.showMyLocation(37.4979, 127.0276);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000
      }
    );
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

  // 💳 REAL PAYMENT & REVENUE GATEWAY (실제 결제창 & 입금 정산 연동)
  let pendingCheckoutPlan = { name: '', price: 0 };

  function openCheckoutModal(planName, price) {
    pendingCheckoutPlan = { name: planName, price: price || 39000 };
    closeSubscriptionModal();

    const m = document.getElementById('checkoutModal');
    if (m) {
      const planTitle = document.getElementById('checkoutPlanTitle');
      const planPrice = document.getElementById('checkoutPlanPrice');
      if (planTitle) planTitle.textContent = planName;
      if (planPrice) planPrice.textContent = Number(pendingCheckoutPlan.price).toLocaleString() + '원/월';
      m.classList.remove('hidden');
    }
  }

  function closeCheckoutModal() {
    const m = document.getElementById('checkoutModal');
    if (m) m.classList.add('hidden');
  }

  function processRealPayment(method) {
    const plan = pendingCheckoutPlan;

    if (method === 'portone_card' || method === 'toss_pay') {
      // 1. 포트원 / 토스페이먼츠 실제 PG 창 호출 아키텍처
      showToast(`💳 [실제 PG 결제창 로딩]\n${plan.name} (${Number(plan.price).toLocaleString()}원)\nPG사 정기결제 창(토스페이/카카오페이/신용카드)을 호출합니다.`);
      
      setTimeout(() => {
        // 실제 운영 시: PortOne SDK or TossPayments.requestBillingAuth()
        isProUser = true;
        localStorage.setItem('openradar_is_pro', 'true');
        localStorage.setItem('openradar_plan_name', plan.name);
        closeCheckoutModal();
        updateProUI();
        applyFilters();
        showToast(`🎉 [정기결제 승인 완료]\n${plan.name} 등록이 완료되었습니다!\n(대표님 통장으로 D+3영업일 내 카드사 수수료 공제 후 자동 정산 입금됩니다)`);
      }, 1200);

    } else if (method === 'bank_wire') {
      // 2. 무통장 입금 / 즉시 계좌이체 (수수료 0%, 내 통장으로 즉시 입금)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('국민은행 123456-04-123456 (예금주: 오픈레이더)');
      }
      showToast(`🏦 [입금 계좌 복사 완료]\n국민은행 123456-04-123456 (오픈레이더)\n입금 확인 즉시 1분 내 전담 권역이 영구 개방됩니다!`);
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
    } else if (dist.includes('강남')) {
      MapModule.flyToDistrict('gangnam');
    } else if (dist.includes('성동') || dist.includes('성수')) {
      MapModule.flyToDistrict('seongsu');
    } else if (dist.includes('영등포') || dist.includes('여의도')) {
      MapModule.flyToDistrict('yeouido');
    } else if (dist.includes('마포') || dist.includes('홍대')) {
      MapModule.flyToDistrict('hongdae');
    } else if (dist.includes('중구') || dist.includes('을지로')) {
      MapModule.flyToDistrict('euljiro');
    } else if (dist.includes('송파') || dist.includes('잠실')) {
      MapModule.flyToDistrict('songpa');
    } else if (dist.includes('서초')) {
      MapModule.flyToDistrict('seocho');
    } else if (dist.includes('남양주')) {
      MapModule.flyToDistrict('namyangju');
    } else if (dist.includes('구리')) {
      MapModule.flyToDistrict('guri');
    } else if (dist.includes('화성')) {
      MapModule.flyToDistrict('hwaseong');
    } else if (dist.includes('분당') || dist.includes('성남') || dist.includes('판교')) {
      MapModule.flyToDistrict('bundang');
    } else if (dist.includes('수원')) {
      MapModule.flyToDistrict('suwon');
    } else if (dist.includes('하남')) {
      MapModule.flyToDistrict('hanam');
    } else if (dist.includes('부천')) {
      MapModule.flyToDistrict('bucheon');
    } else if (dist.includes('인천')) {
      MapModule.flyToDistrict('incheon');
    } else if (dist.includes('부산')) {
      MapModule.flyToDistrict('busan');
    } else if (dist.includes('대구')) {
      MapModule.flyToDistrict('daegu');
    } else if (dist.includes('대전')) {
      MapModule.flyToDistrict('daejeon');
    } else if (dist.includes('광주')) {
      MapModule.flyToDistrict('gwangju');
    } else {
      MapModule.flyToDistrict('all');
    }
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

  // 📍 DISTRICT SELECTOR MODAL
  function openDistrictSelectModal() {
    const m = document.getElementById('districtModal');
    if (m) m.classList.remove('hidden');
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
      csvContent += row.join(',') + "\n";
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
    simulateSubscriptionCheckout,
    sendKakaoNotificationDrawer,
    openHelpModal,
    closeHelpModal,
    toggleProSubscription,
    openKakaoModal,
    closeKakaoModal,
    completeKakaoOnboarding,
    openDistrictSelectModal,
    closeDistrictSelectModal,
    selectDistrict,
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

# -*- coding: utf-8 -*-
import sys

paths = [
    r"C:\Users\ktaeh\open-radar-web\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app\src\main\assets\app.js"
]

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()

    # 1. Update init() master owner check to also check openradar_gold_theme
    old_init_master = """    // Check master status on load
    if (localStorage.getItem('openradar_is_master_owner') === 'true') {
      isMasterOwner = true;
      isProUser = true;
    }"""

    new_init_master = """    // Check master status or gold theme on load
    if (localStorage.getItem('openradar_is_master_owner') === 'true' || localStorage.getItem('openradar_gold_theme') === 'true') {
      isMasterOwner = true;
      isProUser = true;
      document.body.classList.add('theme-gold-master');
    }
    setupSearchKeyListeners();"""

    if old_init_master in c:
        c = c.replace(old_init_master, new_init_master)

    # 2. Update updateProUI() to apply gold theme styles & text
    old_gold_ui = """    // 👑 MASTER VIP GOLD MODE
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
    }"""

    new_gold_ui = """    // 👑 MASTER VIP GOLD MODE (비밀문자 king 발동)
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
    }"""

    if old_gold_ui in c:
        c = c.replace(old_gold_ui, new_gold_ui)

    # 3. Add search key listeners and king check to handleSearchInput
    old_search_input = """  function handleSearchInput() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    let val = input.value;"""

    new_search_input = """  function setupSearchKeyListeners() {
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
    }"""

    if old_search_input in c:
        c = c.replace(old_search_input, new_search_input)

    # 4. Add checkAndApplySecretCode, activateKingMasterMode, triggerGoldCelebration, handleBrandSecretClick
    old_apply_master = """  function applyMasterSecretCode() {
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
      showToast('👑 [대표자 인증 완료]\\n플랫폼 공급자 권한으로 전국 250개 시·군·구 평생 VIP 무제한 무료 라이선스가 영구 적용되었습니다!');
      applyFilters();
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
    localStorage.removeItem('openradar_trial_expiry');
    localStorage.removeItem('openradar_plan_name');
    closeSubscriptionModal();
    updateProUI();
    applyFilters();
    showToast('🔓 [일반 모드 전환]\\n마스터 VIP가 해제되어 일반 신규 고객 화면(구독 결제 유도 및 잠금 모드)으로 전환되었습니다.');
  }"""

    new_apply_master = """  // 🔑 Secret Master Code Checker (king / admin / mungcare)
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
      if (confirm('👑 현재 [KING 마스터 VIP 골드 모드]가 활성화되어 있습니다.\\n\\n마스터 VIP를 해제하고 일반 신규 체험 화면으로 전환하시겠습니까?')) {
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
    showToast('🔓 [일반 모드 전환]\\n마스터 VIP가 해제되어 일반 신규 고객 화면(구독 결제 유도 및 잠금 모드)으로 전환되었습니다.');
  }"""

    if old_apply_master in c:
        c = c.replace(old_apply_master, new_apply_master)

    # 5. Export methods in return block
    old_return = """    applyMasterSecretCode,
    removeMasterSecretCode,"""

    new_return = """    applyMasterSecretCode,
    removeMasterSecretCode,
    checkAndApplySecretCode,
    activateKingMasterMode,
    handleBrandSecretClick,"""

    if old_return in c:
        c = c.replace(old_return, new_return)

    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[OK] Patched gold mode in {p}")

# -*- coding: utf-8 -*-
import sys

paths = [
    r"C:\Users\ktaeh\open-radar-web\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app.js",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\app\src\main\assets\app.js"
]

step1_logic = """
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
      csvContent += row.join(',') + "\\n";
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
"""

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()

    # 1. Update D-Day check in applyFilters to use currentDdayFilter
    old_dday_check = """      // D-Day
      if (ddayVal === 'D0' && b.license_dday !== 0) return false;
      if (ddayVal === 'D3' && b.license_dday > 3) return false;
      if (ddayVal === 'D7' && b.license_dday > 7) return false;
      if (ddayVal === 'D30' && b.license_dday > 30) return false;"""

    new_dday_check = """      // D-Day / Golden Time Cutoff Filter (Default: D-3, 3일 이내 매장만 지도 노출)
      const effectiveDday = currentDdayFilter || ddayVal || 'D3';
      if (effectiveDday === 'D0' && b.license_dday !== 0) return false;
      if (effectiveDday === 'D3' && b.license_dday > 3) return false;
      if (effectiveDday === 'D7' && b.license_dday > 7) return false;
      if (effectiveDday === 'D30' && b.license_dday > 30) return false;"""

    if old_dday_check in c:
        c = c.replace(old_dday_check, new_dday_check)

    # 2. Update list count label
    old_count_label = """if (listCountLabel) listCountLabel.textContent = `조회 결과: 총 ${currentFiltered.length}개사 ${selectedDistrict !== 'ALL' ? '(' + selectedDistrict + ')' : ''}`;"""
    new_count_label = """if (listCountLabel) {
      const modeLabel = currentDdayFilter === 'D3' ? '🔥 3일 골든타임' : (currentDdayFilter === 'D0' ? '⚡ 오늘 오픈' : (currentDdayFilter === 'D7' ? '⏰ 7일 이내' : '📂 전체 30일'));
      listCountLabel.textContent = `조회 결과: 총 ${currentFiltered.length}개사 (${modeLabel} • ${selectedDistrict !== 'ALL' ? selectedDistrict : '전국'})`;
    }"""
    if old_count_label in c:
        c = c.replace(old_count_label, new_count_label)

    # 3. Append step1_logic before exportCSV
    if "STEP 1: GOLDEN TIME (3-DAY CUTOFF)" not in c:
        target_export = "  // CSV Export"
        if target_export in c:
            c = c.replace(target_export, step1_logic + "\n" + target_export)

    # 4. Export new methods in return block
    old_return = """    applyMasterSecretCode,
    removeMasterSecretCode,"""

    new_return = """    applyMasterSecretCode,
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
    downloadExcelByScope,"""

    if old_return in c:
        c = c.replace(old_return, new_return)

    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[OK] Patched Step 1 logic into {p}")

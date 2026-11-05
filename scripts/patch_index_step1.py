# -*- coding: utf-8 -*-
import sys

paths = [
    r"C:\Users\ktaeh\open-radar-web\index.html",
    r"C:\Users\ktaeh\OneDrive\바탕 화면\안티그래비티\open-radar-main\open-radar-main\index.html"
]

golden_time_modal_html = """
    <!-- 🔥 GOLDEN TIME 3-DAY SELECTION MODAL -->
    <div id="goldenTimeModal" class="modal-backdrop hidden">
      <div class="modal-sheet filter-sheet">
        <div class="sheet-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">🔥</span>
            <div>
              <h3 class="sheet-title" style="color: #fef08a;">골든타임 영업 레이더 설정</h3>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">인허가 후 48~72시간(3일) 이내 신규 매장 집중 방문</p>
            </div>
          </div>
          <button onclick="App.closeGoldenTimeModal()" class="close-btn">✕</button>
        </div>

        <div class="filter-sheet-body">
          <div class="goldentime-option" onclick="App.setGoldenTimeFilter('D3')">
            <div>
              <div class="goldentime-option-title" style="color: #fef08a;">
                <span>🔥 3일 골든타임 (D-0 ~ D-3)</span>
                <span style="font-size: 10px; background: rgba(245,158,11,0.25); color: #f59e0b; padding: 2px 6px; border-radius: 4px;">추천</span>
              </div>
              <div class="goldentime-option-desc">인허가 3일 이내 매장만 지도에 노출 (계약 성사율 최고치)</div>
            </div>
            <span style="font-size: 16px;">⚡</span>
          </div>

          <div class="goldentime-option" onclick="App.setGoldenTimeFilter('D0')">
            <div>
              <div class="goldentime-option-title" style="color: #f87171;">
                <span>⚡ 오늘 등록만 (D-0 초긴급)</span>
                <span style="font-size: 10px; background: rgba(239,68,68,0.25); color: #ef4444; padding: 2px 6px; border-radius: 4px;">실시간</span>
              </div>
              <div class="goldentime-option-desc">오늘 실시간으로 인허가 완료된 당일 극초기 매장만 표출</div>
            </div>
            <span style="font-size: 16px;">🚨</span>
          </div>

          <div class="goldentime-option" onclick="App.setGoldenTimeFilter('D7')">
            <div>
              <div class="goldentime-option-title" style="color: #60a5fa;">
                <span>⏰ 최근 7일 이내 (D-7)</span>
              </div>
              <div class="goldentime-option-desc">최근 일주일 이내 신규 인허가 매장까지 탐색 범위 확장</div>
            </div>
            <span style="font-size: 16px;">📅</span>
          </div>

          <div class="goldentime-option" onclick="App.setGoldenTimeFilter('ALL')">
            <div>
              <div class="goldentime-option-title" style="color: #cbd5e1;">
                <span>📂 전체 매장 (30일 보관소 포함)</span>
              </div>
              <div class="goldentime-option-desc">3일이 지난 매장까지 지도 상에 3,500+개 전체 표시</div>
            </div>
            <span style="font-size: 16px;">🌐</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 📅 DATE ARCHIVE CALENDAR MODAL (날짜별 매장 보관소) -->
    <div id="archiveModal" class="modal-backdrop hidden">
      <div class="modal-sheet" style="max-height: 85vh; display: flex; flex-direction: column;">
        <div class="sheet-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📅</span>
            <div>
              <h3 class="sheet-title">인허가 일자별 보관소 (아카이브)</h3>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">3일이 지난 매장도 일자별로 영구 보관되며 언제든 조회 및 CRM 관리 가능</p>
            </div>
          </div>
          <button onclick="App.closeArchiveModal()" class="close-btn">✕</button>
        </div>

        <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">📆 최근 인허가 일자 선택</span>
            <input type="date" id="archiveDirectDatePicker" onchange="App.selectArchiveDate(this.value)" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 11px;" />
          </div>
          <div id="archiveDateScroll" class="archive-date-scroll">
            <!-- Injected dynamically by App.renderArchiveDates() -->
          </div>
        </div>

        <div style="padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; background: rgba(15,23,42,0.4); border-bottom: 1px solid rgba(255,255,255,0.06);">
          <span id="archiveResultCountLabel" style="font-size: 12px; font-weight: 800; color: #38bdf8;">조회 중...</span>
          <button id="btnExportArchiveDate" onclick="App.exportArchiveDateCSV()" style="background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer;">
            📥 이 날짜 엑셀 다운로드
          </button>
        </div>

        <div id="archiveStoresList" style="flex: 1; overflow-y: auto; padding: 14px 16px;">
          <!-- Injected dynamically by App.renderArchiveStores() -->
        </div>
      </div>
    </div>

    <!-- 📥 EXCEL EXPORT MODAL -->
    <div id="exportModal" class="modal-backdrop hidden">
      <div class="modal-sheet filter-sheet">
        <div class="sheet-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📊</span>
            <div>
              <h3 class="sheet-title">신규 매장 엑셀(CSV) 추출</h3>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">원하는 기간 및 지역의 신규 매장 명단을 즉시 다운로드합니다.</p>
            </div>
          </div>
          <button onclick="App.closeExportModal()" class="close-btn">✕</button>
        </div>

        <div class="filter-sheet-body">
          <div class="export-opt-btn" onclick="App.downloadExcelByScope('D0')">
            <span class="export-opt-icon">⚡</span>
            <div>
              <div class="export-opt-title" style="color: #f87171;">오늘 등록(D-0) 신규 매장만 추출</div>
              <div class="export-opt-sub">오늘 실시간으로 인허가 승인된 당일 극초기 매장 엑셀 파일</div>
            </div>
          </div>

          <div class="export-opt-btn" onclick="App.downloadExcelByScope('D3')">
            <span class="export-opt-icon">🔥</span>
            <div>
              <div class="export-opt-title" style="color: #fef08a;">3일 골든타임(D-0 ~ D-3) 매장 추출</div>
              <div class="export-opt-sub">방문 계약 성공률이 가장 높은 3일 이내 매장 집중 명단</div>
            </div>
          </div>

          <div class="export-opt-btn" onclick="App.downloadExcelByScope('DISTRICT')">
            <span class="export-opt-icon">📍</span>
            <div>
              <div class="export-opt-title" id="exportDistrictLabel">현재 선택 지역 매장 추출</div>
              <div class="export-opt-sub">담당 지역의 전체 신규 인허가 매장 엑셀 파일</div>
            </div>
          </div>

          <div class="export-opt-btn" onclick="App.downloadExcelByScope('ALL')">
            <span class="export-opt-icon">🌐</span>
            <div>
              <div class="export-opt-title" style="color: #38bdf8;">전국 전체 3,500+개사 대량 추출</div>
              <div class="export-opt-sub">전국 서울·경기 31개 시·군 등 전체 데이터베이스 원클릭 내보내기</div>
            </div>
          </div>
        </div>
      </div>
    </div>
"""

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()

    # 1. Update map-floating-bar to include Golden Time pill and Archive pill
    old_floating_bar = """            <button id="btnCurrentDistrict" onclick="App.openDistrictSelectModal()" class="map-pill map-pill-primary" title="지역 선택">
              📍 전국 전체 ▾
            </button>
            <button onclick="App.moveToCurrentLocation()" class="map-pill map-pill-location" title="내 현재 GPS 위치로 이동">
              <span>🎯 내위치</span>
            </button>"""

    new_floating_bar = """            <button id="btnCurrentDistrict" onclick="App.openDistrictSelectModal()" class="map-pill map-pill-primary" title="지역 선택">
              📍 전국 전체 ▾
            </button>
            <button id="btnGoldenTimePill" onclick="App.openGoldenTimeModal()" class="map-pill map-pill-goldentime" title="골든타임 필터 (3일 이내 매장만 지도 노출)">
              🔥 3일 골든타임 ▾
            </button>
            <button id="btnArchivePill" onclick="App.openArchiveModal()" class="map-pill map-pill-archive" title="날짜별 매장 아카이브 캘린더">
              📅 날짜별
            </button>
            <button onclick="App.moveToCurrentLocation()" class="map-pill map-pill-location" title="내 현재 GPS 위치로 이동">
              <span>🎯 내위치</span>
            </button>"""

    if old_floating_bar in c:
        c = c.replace(old_floating_bar, new_floating_bar)

    # 2. Update header export button to openExportModal()
    c = c.replace('onclick="App.exportCSV()"', 'onclick="App.openExportModal()"')

    # 3. Append the 3 new modals right before </body>
    if "<!-- 🔥 GOLDEN TIME 3-DAY SELECTION MODAL -->" not in c:
        c = c.replace("</body>", golden_time_modal_html + "\n</body>")

    with open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"[OK] Patched Step 1 HTML into {p}")

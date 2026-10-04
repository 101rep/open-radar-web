// OpenRadar Sales CRM Pipeline Module
const CrmModule = (function() {

  function render(businesses) {
    const kpiTotal = document.getElementById('kpiTotal');
    const kpiUnvisited = document.getElementById('kpiUnvisited');
    const kpiInProgress = document.getElementById('kpiInProgress');
    const kpiWon = document.getElementById('kpiWon');

    if (!kpiTotal) return;

    const total = businesses.length;
    const unvisited = businesses.filter(b => b.sales_status === '미방문').length;
    const inProgress = businesses.filter(b => b.sales_status === '접촉중' || b.sales_status === '방문예정').length;
    const won = businesses.filter(b => b.sales_status === '계약성공').length;

    kpiTotal.textContent = `${total}건`;
    kpiUnvisited.textContent = `${unvisited}건`;
    kpiInProgress.textContent = `${inProgress}건`;
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
    kpiWon.textContent = `${winRate}% (${won}건)`;

    // Group columns
    renderColumn('crmColUnvisited', businesses.filter(b => b.sales_status === '미방문'));
    renderColumn('crmColPlanned', businesses.filter(b => b.sales_status === '방문예정'));
    renderColumn('crmColContacting', businesses.filter(b => b.sales_status === '접촉중'));
    renderColumn('crmColWon', businesses.filter(b => b.sales_status === '계약성공'));
  }

  function renderColumn(elementId, items) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (items.length === 0) {
      el.innerHTML = '<div style="font-size: 11px; color: #64748b; padding: 12px 0; text-align: center;">항목 없음</div>';
      return;
    }

    el.innerHTML = items.map(b => {
      const catInfo = CATEGORY_COLORS[b.category] || { color: '#3b82f6', emoji: '📍' };
      return `
        <div class="biz-card" style="padding: 10px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="badge-dday" style="font-size: 9px;">D-${b.license_dday}</span>
              <span class="badge-cat" style="font-size: 9px;">${b.category}</span>
            </div>
            <span style="font-size: 10px; color: #64748b;">${b.license_date}</span>
          </div>

          <div class="biz-name" onclick="App.openDetailDrawer('${b.id}')" style="font-size: 13px;">
            ${b.business_name}
          </div>

          <div style="font-size: 11px; color: #94a3b8;">
            📍 ${b.address_road}
          </div>

          ${b.sales_note ? `<div class="biz-note-box" style="font-size: 10px; padding: 4px 8px;">💬 ${b.sales_note}</div>` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 4px; border-top: 1px solid #334155;">
            <select onchange="CrmModule.updateStatus('${b.id}', this.value)" class="select-filter" style="font-size: 10px; padding: 3px 6px;">
              <option value="미방문" ${b.sales_status === '미방문' ? 'selected' : ''}>미방문</option>
              <option value="방문예정" ${b.sales_status === '방문예정' ? 'selected' : ''}>방문예정</option>
              <option value="접촉중" ${b.sales_status === '접촉중' ? 'selected' : ''}>접촉중</option>
              <option value="계약성공" ${b.sales_status === '계약성공' ? 'selected' : ''}>계약성공</option>
              <option value="보류" ${b.sales_status === '보류' ? 'selected' : ''}>보류</option>
            </select>
            
            <button class="btn-card-action" onclick="App.openDetailDrawer('${b.id}')" style="font-size: 10px; padding: 3px 8px;">
              상세보기 &gt;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateStatus(id, newStatus) {
    App.updateBusinessStatus(id, newStatus);
  }

  return {
    render,
    updateStatus
  };
})();

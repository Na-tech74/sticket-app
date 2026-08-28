import { getCachedData, showAlert } from './CRUD.js';

// ======================== ESCAPE HTML ========================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ======================== FORMAT DATETIME ========================
function formatDateTime(isoStr) {
    if (!isoStr) return '<span class="text-muted">-</span>';
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('vi-VN');
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

// ======================== LỌC DỮ LIỆU ========================
function getFilteredData() {
    const data = getCachedData();
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const filterCat = document.getElementById('filterCategory').value;
    const filterStatus = document.getElementById('filterStatus').value;

    return data.filter(item => {
        const matchSearch = item.title.toLowerCase().includes(search) ||
            item.fix.toLowerCase().includes(search) ||
            (item.note || '').toLowerCase().includes(search);
        const matchCat = filterCat === 'all' || item.category === filterCat;
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchSearch && matchCat && matchStatus;
    });
}

// ======================== XUẤT CSV ========================
async function exportCSV() {
    const filtered = getFilteredData();
    if (filtered.length === 0) {
        await showAlert('Không có dữ liệu', 'Không có sự cố nào để xuất file CSV.', '<i class="fas fa-folder-open text-warning" style="font-size:48px"></i>');
        return;
    }
    let csv = 'Ngày,Danh mục,Trạng thái,Tiêu đề,Cách sửa,Ghi chú,Sửa lúc\n';
    filtered.forEach(item => {
        const updatedAt = item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : '';
        csv += `"${item.date}","${item.category}","${item.status}","${item.title.replace(/"/g, '""')}","${item.fix.replace(/"/g, '""')}","${(item.note || '').replace(/"/g, '""')}","${updatedAt}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `IT_Issues_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

// ======================== MAP MÀU ========================
function catBadgeClass(cat) {
    const map = { 'Mạng': 'tag-cat-blue', 'Phần cứng': 'tag-cat-red', 'Phần mềm': 'tag-cat-green', 'Khác': 'tag-cat-purple' };
    return map[cat] || 'tag-cat-green';
}

function stBadgeClass(st) {
    const map = { 'Đã xử lý': 'tag-st-green', 'Đang xử lý': 'tag-st-orange', 'Chưa xử lý': 'tag-st-red' };
    return map[st] || 'tag-st-red';
}

// ======================== RENDER BẢNG + THỐNG KÊ ========================
function renderTable() {
    const filtered = getFilteredData();
    filtered.sort((a, b) => b.id - a.id);

    // ===== DESKTOP TABLE =====
    const tbody = document.getElementById('tableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="fas fa-search"></i> Không tìm thấy sự cố nào.</td></tr>';
    } else {
        tbody.innerHTML = filtered.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(item.date)}</td>
                    <td><strong>${escapeHtml(item.title)}</strong></td>
                    <td><div class="fix-text">${escapeHtml(item.fix)}</div></td>
                    <td><span class="badge ${catBadgeClass(item.category)}">${escapeHtml(item.category)}</span></td>
                    <td><span class="badge ${stBadgeClass(item.status)}">${escapeHtml(item.status)}</span></td>
                    <td class="small">${formatDateTime(item.updatedAt)}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editIssue(${item.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteIssue(${item.id})"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
    }

    // ===== MOBILE CARDS =====
    const mobileDiv = document.getElementById('mobileCards');
    if (filtered.length === 0) {
        mobileDiv.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-search"></i> Không tìm thấy sự cố nào.</div>';
    } else {
        mobileDiv.innerHTML = filtered.map((item, index) => `
            <div class="card mb-2 shadow-sm border-0">
                <div class="card-body py-2 px-3">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <span class="text-muted small me-2">#${index + 1}</span>
                            <strong class="mobile-title">${escapeHtml(item.title)}</strong>
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-warning btn-sm py-0 px-2" onclick="editIssue(${item.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm py-0 px-2" onclick="deleteIssue(${item.id})"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div class="d-flex flex-wrap gap-1 mb-1">
                        <span class="badge ${catBadgeClass(item.category)}">${escapeHtml(item.category)}</span>
                        <span class="badge ${stBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
                        <span class="text-muted small"><i class="fas fa-calendar-alt"></i> ${escapeHtml(item.date)}</span>
                    </div>
                    <div class="mobile-fix text-muted small mb-1">${escapeHtml(item.fix)}</div>
                    ${item.updatedAt ? `<div class="text-muted" style="font-size:11px"><i class="fas fa-clock"></i> Sửa lúc: ${formatDateTime(item.updatedAt)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ========== THỐNG KÊ ==========
    const allData = getCachedData();
    const total = allData.length;
    const resolved = allData.filter(i => i.status === 'Đã xử lý').length;
    const pending = allData.filter(i => i.status === 'Đang xử lý').length;
    const unresolved = allData.filter(i => i.status === 'Chưa xử lý').length;

    document.getElementById('stats').innerHTML = `
            <div class="col-6 col-md-3">
                <div class="card text-center border-start border-3 border-primary shadow-sm">
                    <div class="card-body py-2">
                        <div class="fs-3 fw-bold text-primary">${total}</div>
                        <div class="text-muted small"><i class="fas fa-clipboard-list text-primary"></i> Tổng số lỗi</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card text-center border-start border-3 border-success shadow-sm">
                    <div class="card-body py-2">
                        <div class="fs-3 fw-bold text-success">${resolved}</div>
                        <div class="text-muted small"><i class="fas fa-check-circle text-success"></i> Đã xử lý</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card text-center border-start border-3 border-warning shadow-sm">
                    <div class="card-body py-2">
                        <div class="fs-3 fw-bold text-warning">${pending}</div>
                        <div class="text-muted small"><i class="fas fa-clock text-warning"></i> Đang xử lý</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card text-center border-start border-3 border-danger shadow-sm">
                    <div class="card-body py-2">
                        <div class="fs-3 fw-bold text-danger">${unresolved}</div>
                        <div class="text-muted small"><i class="fas fa-times-circle text-danger"></i> Chưa xử lý</div>
                    </div>
                </div>
            </div>
        `;

    // ========== TOP LỖI THƯỜNG GẶP ==========
    const freq = {};
    allData.forEach(item => {
        freq[item.title] = (freq[item.title] || 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topDiv = document.getElementById('topIssues');
    if (sorted.length === 0) {
        topDiv.innerHTML = '<span class="text-muted small">Chưa có dữ liệu để thống kê.</span>';
    } else {
        topDiv.innerHTML = sorted.map(([title, count]) =>
            `<span class="issue-badge">${escapeHtml(title)} <span class="count">${count}</span></span>`
        ).join('');
    }
}

export { renderTable, exportCSV };

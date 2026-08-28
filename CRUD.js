// ======================== DATA ========================
function getData() {
    const raw = localStorage.getItem('itIssues');
    return raw ? JSON.parse(raw) : [];
}
function saveData(data) {
    localStorage.setItem('itIssues', JSON.stringify(data));
}

// ======================== MODAL HELPERS ========================
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
const editModal = new bootstrap.Modal(document.getElementById('editModal'));

function showConfirm(title, message, iconHtml, btnClass) {
    return new Promise(resolve => {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmIcon').innerHTML = iconHtml;
        const okBtn = document.getElementById('confirmOkBtn');
        okBtn.className = `btn px-3 ${btnClass}`;
        okBtn.onclick = () => { confirmModal.hide(); resolve(true); };
        document.getElementById('confirmModal').addEventListener('hidden.bs.modal', function handler() {
            resolve(false);
            document.getElementById('confirmModal').removeEventListener('hidden.bs.modal', handler);
        });
        confirmModal.show();
    });
}

function showAlert(title, message, iconHtml) {
    return new Promise(resolve => {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        document.getElementById('alertIcon').innerHTML = iconHtml;
        document.getElementById('alertModal').addEventListener('hidden.bs.modal', function handler() {
            resolve();
            document.getElementById('alertModal').removeEventListener('hidden.bs.modal', handler);
        });
        alertModal.show();
    });
}

function showEditModal(item) {
    return new Promise(resolve => {
        document.getElementById('editFix').value = item.fix;
        document.getElementById('editNote').value = item.note || '';
        document.getElementById('editStatus').value = item.status;
        const saveBtn = document.getElementById('editSaveBtn');
        const onSave = () => {
            editModal.hide();
            saveBtn.removeEventListener('click', onSave);
            resolve({
                fix: document.getElementById('editFix').value.trim(),
                note: document.getElementById('editNote').value.trim(),
                status: document.getElementById('editStatus').value
            });
        };
        saveBtn.addEventListener('click', onSave);
        document.getElementById('editModal').addEventListener('hidden.bs.modal', function handler() {
            saveBtn.removeEventListener('click', onSave);
            resolve(null);
            document.getElementById('editModal').removeEventListener('hidden.bs.modal', handler);
        });
        editModal.show();
    });
}

// ======================== THÊM LỖI ========================
async function addIssue() {
    const title = document.getElementById('issueTitle').value.trim();
    const date = document.getElementById('issueDate').value;
    const category = document.getElementById('issueCategory').value;
    const status = document.getElementById('issueStatus').value;
    const fix = document.getElementById('issueFix').value.trim();
    const note = document.getElementById('issueNote').value.trim();

    if (!title || !date || !fix) {
        await showAlert('Thiếu thông tin', 'Vui lòng nhập: Tiêu đề, Ngày tháng và Cách sửa!', '<i class="fas fa-exclamation-triangle text-warning" style="font-size:48px"></i>');
        return;
    }

    const data = getData();
    data.push({ id: Date.now(), title, date, category, status, fix, note });
    saveData(data);
    clearForm();
    renderTable();
}

function clearForm() {
    document.getElementById('issueTitle').value = '';
    document.getElementById('issueDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('issueFix').value = '';
    document.getElementById('issueNote').value = '';
    document.getElementById('issueCategory').value = 'Mạng';
    document.getElementById('issueStatus').value = 'Đã xử lý';
}

// ======================== XÓA TẤT CẢ ========================
async function clearAll() {
    const ok = await showConfirm(
        'Xóa tất cả?',
        'Toàn bộ dữ liệu sẽ bị xóa vĩnh viễn. Bạn có chắc không?',
        '<i class="fas fa-trash-alt text-danger" style="font-size:48px"></i>',
        'btn-danger'
    );
    if (!ok) return;
    saveData([]);
    renderTable();
}

// ======================== XÓA 1 LỖI ========================
async function deleteIssue(id) {
    const ok = await showConfirm(
        'Xóa sự cố?',
        'Sự cố này sẽ bị xóa vĩnh viễn.',
        '<i class="fas fa-exclamation-circle text-danger" style="font-size:48px"></i>',
        'btn-danger'
    );
    if (!ok) return;
    let data = getData();
    data = data.filter(item => item.id !== id);
    saveData(data);
    renderTable();
}

// ======================== SỬA LỖI ========================
async function editIssue(id) {
    let data = getData();
    const item = data.find(i => i.id === id);
    if (!item) return;

    const result = await showEditModal(item);
    if (!result) return;

    if (result.fix !== '') item.fix = result.fix;
    item.note = result.note;
    if (['Đã xử lý', 'Đang xử lý', 'Chưa xử lý'].includes(result.status)) {
        item.status = result.status;
    }
    item.updatedAt = new Date().toISOString();

    saveData(data);
    renderTable();
}

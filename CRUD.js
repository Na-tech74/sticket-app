import {
    subscribeIssues, firestoreAddIssue, firestoreUpdateIssue,
    firestoreDeleteIssue, firestoreClearAll
} from './firebase-config.js';

// ======================== DATA (FIRESTORE REAL-TIME) ========================
let cachedData = [];
let unsubscribe = null;

// Bắt đầu lắng nghe dữ liệu real-time. onUpdate() được gọi mỗi khi có thay
// đổi (kể cả thay đổi đang chờ ghi lên server) — dùng để trigger renderTable().
function startListening(onUpdate) {
    stopListening();
    unsubscribe = subscribeIssues(
        data => { cachedData = data; onUpdate(); },
        err => {
            console.error('Lỗi lắng nghe dữ liệu:', err);
            cachedData = [];
            onUpdate();
        }
    );
}

function stopListening() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    cachedData = [];
}

function getCachedData() {
    return cachedData;
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

    const issue = { id: Date.now(), title, date, category, status, fix, note, updatedAt: new Date().toISOString() };
    clearForm();

    // Không await, không tự thêm vào cachedData: Firestore (cache cục bộ đã
    // bật) sẽ tự "echo" ngay thao tác này qua listener onSnapshot gần như
    // tức thì, trước cả khi server xác nhận.
    firestoreAddIssue(issue).catch(err => {
        console.error('Lỗi lưu sự cố:', err);
        showAlert('Lưu thất bại', 'Không thể lưu sự cố lên máy chủ (kiểm tra mạng). Vui lòng thử lại.', '<i class="fas fa-exclamation-triangle text-danger" style="font-size:48px"></i>');
    });
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
    firestoreClearAll().catch(err => {
        console.error('Lỗi xóa tất cả:', err);
        showAlert('Xóa thất bại', 'Không thể xóa dữ liệu trên máy chủ (kiểm tra mạng). Vui lòng thử lại.', '<i class="fas fa-exclamation-triangle text-danger" style="font-size:48px"></i>');
    });
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
    const item = cachedData.find(i => i.id === id);
    if (item && item.docId) {
        firestoreDeleteIssue(item.docId).catch(err => {
            console.error('Lỗi xóa sự cố:', err);
            showAlert('Xóa thất bại', 'Không thể xóa sự cố trên máy chủ (kiểm tra mạng). Vui lòng thử lại.', '<i class="fas fa-exclamation-triangle text-danger" style="font-size:48px"></i>');
        });
    }
}

// ======================== SỬA LỖI ========================
async function editIssue(id) {
    const item = cachedData.find(i => i.id === id);
    if (!item) return;

    const result = await showEditModal(item);
    if (!result) return;

    const fix = result.fix !== '' ? result.fix : item.fix;
    const note = result.note;
    const status = ['Đã xử lý', 'Đang xử lý', 'Chưa xử lý'].includes(result.status) ? result.status : item.status;
    const updatedAt = new Date().toISOString();

    if (item.docId) {
        firestoreUpdateIssue(item.docId, { fix, note, status, updatedAt }).catch(err => {
            console.error('Lỗi cập nhật sự cố:', err);
            showAlert('Cập nhật thất bại', 'Không thể lưu thay đổi lên máy chủ (kiểm tra mạng). Vui lòng thử lại.', '<i class="fas fa-exclamation-triangle text-danger" style="font-size:48px"></i>');
        });
    }
}

export {
    startListening, stopListening, getCachedData,
    addIssue, clearAll, deleteIssue, editIssue,
    showConfirm, showAlert, showEditModal
};

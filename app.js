import {
    loginWithGoogle, loginWithEmail, registerWithEmail,
    logout, onAuthChange
} from './firebase-config.js';
import { startListening, stopListening, addIssue, clearAll, deleteIssue, editIssue } from './CRUD.js';
import { renderTable, exportCSV, showLoadingState } from './helper.js';

// ======================== DOM ========================
const loginPage = document.getElementById('loginPage');
const appContent = document.getElementById('appContent');
const loadingOverlay = document.getElementById('loadingOverlay');
const userEmail = document.getElementById('userEmail');
const loginError = document.getElementById('loginError');

function showLogin() {
    loadingOverlay.classList.add('d-none');
    loginPage.classList.remove('d-none');
    appContent.classList.add('d-none');
}

function showApp() {
    loadingOverlay.classList.add('d-none');
    loginPage.classList.add('d-none');
    appContent.classList.remove('d-none');
}

function showError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('d-none');
}

function hideError() {
    loginError.classList.add('d-none');
}

// ======================== AUTH STATE ========================
onAuthChange((user) => {
    if (user) {
        userEmail.textContent = user.email || user.displayName;
        document.getElementById('issueDate').value = new Date().toISOString().slice(0, 10);
        showApp(); // hiện app ngay — không đợi dữ liệu
        showLoadingState(); // khu thống kê/bảng hiện spinner cho tới khi listener bắn dữ liệu đầu tiên

        // Lắng nghe real-time: renderTable() tự chạy lại mỗi khi có dữ liệu
        // mới (kể cả gần như tức thì từ cache cục bộ / thao tác đang chờ ghi).
        startListening(() => renderTable());
    } else {
        stopListening();
        showLogin();
    }
});

// ======================== LOGIN HANDLERS ========================
document.getElementById('btnGoogleLogin').addEventListener('click', async () => {
    hideError();
    try {
        await loginWithGoogle();
    } catch (err) {
        showError('Đăng nhập Google thất bại: ' + err.message);
    }
});

document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        showError('Vui lòng nhập email và mật khẩu.');
        return;
    }
    try {
        await loginWithEmail(email, password);
    } catch (err) {
        showError('Đăng nhập thất bại: ' + err.message);
    }
});

document.getElementById('btnEmailRegister').addEventListener('click', async () => {
    hideError();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        showError('Vui lòng nhập email và mật khẩu.');
        return;
    }
    if (password.length < 6) {
        showError('Mật khẩu phải từ 6 ký tự.');
        return;
    }
    try {
        await registerWithEmail(email, password);
    } catch (err) {
        showError('Tạo tài khoản thất bại: ' + err.message);
    }
});

document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
});

// ======================== GLOBAL FUNCTIONS (for onclick) ========================
// Không cần await/gọi renderTable() thủ công nữa — listener real-time tự lo.
window.addIssue = () => { addIssue(); };
window.clearAll = () => { clearAll(); };
window.deleteIssue = (id) => { deleteIssue(id); };
window.editIssue = (id) => { editIssue(id); };
window.renderTable = renderTable;
window.exportCSV = exportCSV;

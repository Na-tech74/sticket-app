import {
    loginWithGoogle, loginWithEmail, registerWithEmail,
    logout, onAuthChange
} from './firebase-config.js';
import { getData, refreshData, addIssue, clearAll, deleteIssue, editIssue } from './CRUD.js';
import { renderTable, exportCSV } from './helper.js';

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
onAuthChange(async (user) => {
    if (user) {
        userEmail.textContent = user.email || user.displayName;
        document.getElementById('issueDate').value = new Date().toISOString().slice(0, 10);
        // Chờ tải xong dữ liệu (loadingOverlay vẫn đang hiện) rồi mới render
        // + hiện appContent, để bảng/thống kê/top lỗi xuất hiện cùng một lúc.
        // Bọc try/catch: nếu Firestore lỗi (mạng, rules...), vẫn phải hiện
        // app ra chứ không được kẹt mãi ở màn hình loading.
        try {
            await getData();
        } catch (err) {
            console.error('Lỗi tải dữ liệu:', err);
        }
        renderTable();
        showApp();
    } else {
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
window.addIssue = async () => { await addIssue(); renderTable(); };
window.clearAll = async () => { await clearAll(); renderTable(); };
window.deleteIssue = async (id) => { await deleteIssue(id); renderTable(); };
window.editIssue = async (id) => { await editIssue(id); renderTable(); };
window.renderTable = renderTable;
window.exportCSV = exportCSV;

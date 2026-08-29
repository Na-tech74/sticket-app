# IT Support Issue Tracker

Sổ tay xử lý sự cố IT - ứng dụng web CRUD giúp IT Staff ghi chép, tra cứu và quản lý sự cố một cách nhanh chóng.

## Demo

https://sticket-app.vercel.app

## Screenshots

- Form nhập sự cố mới với các trường bắt buộc
- Bảng hiển thị desktop / card layout trên mobile
- Thống kê tổng quan + top 5 lỗi thường gặp
- Modal xác nhận trước khi xóa
- Đăng nhập bằng Google hoặc Email/Password

## Tech Stack

| Thành phần     | Công nghệ                                |
| -------------- | ---------------------------------------- |
| Frontend       | HTML5, Bootstrap 5.3.3, Font Awesome 6.5.1 |
| JavaScript     | Vanilla ES6+ (ES Modules)                |
| Backend        | Firebase (serverless)                    |
| Database       | Cloud Firestore (real-time)              |
| Authentication | Firebase Auth (Google + Email/Password)  |
| Hosting        | Vercel                                   |

## Tính năng

### CRUD

- **Thêm** sự cố mới: tiêu đề, ngày, danh mục, trạng thái, cách sửa, ghi chú
- **Sửa** sự cố qua modal form (cách sửa, ghi chú, trạng thái)
- **Xóa** 1 sự cố hoặc xóa tất cả (có modal xác nhận)
- Tự động ghi thời gian sửa cuối cùng

### Tìm kiếm & Lọc

- Tìm theo tiêu đề, cách sửa, ghi chú
- Lọc theo danh mục: Mạng, Phần cứng, Phần mềm, Khác
- Lọc theo trạng thái: Đã xử lý, Đang xử lý, Chưa xử lý

### Thống kê

- Tổng số sự cố
- Số lượng đã xử lý / đang xử lý / chưa xử lý
- Top 5 lỗi thường gặp nhất

### Xuất dữ liệu

- Xuất file CSV (UTF-8 BOM, tương thích Excel)
- Bao gồm tất cả trường + thời gian sửa

### Responsive

- **Desktop** (>= 700px): bảng đầy đủ 8 cột
- **Mobile** (< 700px): card layout gọn gàng

### Xác thực

- Đăng nhập bằng Google (OAuth)
- Đăng nhập bằng Email/Password
- Tạo tài khoản mới
- Mỗi user có data riêng, không shared

## Cấu trúc dự án

```
Sticket_App/
├── index.html          # Giao diện chính: Login page + App page + 3 Modals
├── firebase-config.js  # Firebase SDK, Auth helpers, Firestore CRUD
├── CRUD.js             # Business logic, modal helpers, data operations
├── helper.js           # Render table/cards, CSV export, thống kê
├── app.js              # Entry point: auth state, login handlers
├── style.css           # Custom CSS (tag màu, responsive, modal)
├── .env                # Firebase config (local development)
├── .env.example        # Template env file
├── firestore.rules     # Firestore security rules
└── README.md           # Tài liệu dự án
```

## Module Dependency

```
index.html
  └── app.js (entry point)
        ├── firebase-config.js (Auth + Firestore)
        ├── CRUD.js (business logic)
        └── helper.js (UI rendering)
```

## Firestore Structure

```
users/
  └── {uid}/                    # Mỗi user riêng
        └── issues/
              └── {docId}/
                    ├── id: number (Date.now())
                    ├── title: string
                    ├── date: string (YYYY-MM-DD)
                    ├── category: string (Mạng|Phần cứng|Phần mềm|Khác)
                    ├── status: string (Đã xử lý|Đang xử lý|Chưa xử lý)
                    ├── fix: string
                    ├── note: string
                    └── updatedAt: string (ISO timestamp)
```

## Responsive Breakpoints

| Breakpoint       | Behavior                                    |
| ---------------- | ------------------------------------------- |
| >= 700px         | Bảng 8 cột, form 2 cột                     |
| < 700px          | Card layout, form full width, font-size nhỏ |

## Hướng dẫn cài đặt

### Yêu cầu

- Tài khoản Firebase (miễn phí)
- Tài khoản Vercel (miễn phí)

### Bước 1: Clone & cấu hình

```bash
git clone <repo-url>
cd Sticket_App
```

### Bước 2: Firebase Setup

1. Tạo project tại https://console.firebase.google.com

2. Bật **Authentication**:
   - Sign-in method > Google > Enable > Save
   - Sign-in method > Email/Password > Enable > Save

3. Tạo **Firestore Database**:
   - Chọn **Firestore Database** > **Create database**
   - Chọn **Start in test mode** (cho phép read/write tự do)
   - Chọn region gần bạn (asia-southeast1 recommended)
   - Click **Enable**

4. Cập nhật **Firestore Rules** (tab Rules):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/issues/{issueId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. Thêm **Authorized domain**:
   - Authentication > Settings > Authorized domains > Add domain
   - Thêm domain Vercel (ví dụ: `sticket-app.vercel.app`)

6. Lấy config:
   - Project Settings > General > Your apps > Web app > Firebase SDK snippet > Config

### Bước 3: Cập nhật config

Thay `firebaseConfig` trong `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Bước 4: Deploy lên Vercel

```bash
git add .
git commit -m "feat: initial commit"
git push origin main
```

Vercel sẽ tự động deploy. Mỗi lần push code mới sẽ tự build lại.

## Troubleshooting

### Dữ liệu không lưu khi refresh

1. Kiểm tra Firestore Database đã được tạo chưa (Firebase Console > Firestore Database)
2. Kiểm tra Firestore Rules có đúng không (tab Rules)
3. Mở Console (F12) xem có lỗi nào không
4. Kiểm tra tab Network trong DevTools, xem request Firestore có trả về 200 không

### Đăng nhập không hoạt động

1. Đảm bảo Google và Email/Password đã Enable trong Firebase Authentication
2. Kiểm tra Authorized Domain đã包含 domain hiện tại chưa

## Tác giả

Designed by **Nam Nguyen**

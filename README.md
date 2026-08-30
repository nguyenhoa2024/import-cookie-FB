# FB Cookie Manager

Chrome Manifest V3 extension for locally managing cookies on `facebook.com`.

## 🇻🇳 HƯỚNG DẪN CÀI ĐẶT

> **Dành cho Google Chrome trên Windows/macOS.** Bản GitHub này cài bằng **Load unpacked**.

### 1. Tải extension

Mở repository:

**https://github.com/nguyenhoa2024/import-cookie-FB**

Bấm:

**Code → Download ZIP**

### 2. Giải nén

Chuột phải file ZIP → **Extract All / Giải nén tất cả**.

Sau khi giải nén, thư mục extension phải có file:

```text
manifest.json
```

Ví dụ:

```text
import-cookie-FB-main/
├── manifest.json
├── README.md
└── src/
    ├── background.js
    ├── popup.html
    ├── popup.css
    └── popup.js
```

⚠️ Khi chọn thư mục ở bước tiếp theo, phải chọn **thư mục chứa trực tiếp `manifest.json`**, không chọn file ZIP và không chọn riêng thư mục `src`.

### 3. Mở Chrome Extensions

Trên Chrome nhập:

```text
chrome://extensions
```

Nhấn **Enter**.

### 4. Bật Chế độ nhà phát triển

Bật **Developer mode / Chế độ nhà phát triển** ở góc trên bên phải.

### 5. Cài extension

Bấm **Load unpacked / Tải tiện ích đã giải nén**.

Chọn thư mục:

```text
import-cookie-FB-main
```

Thư mục này phải chứa `manifest.json` ngay bên trong.

Nếu cài thành công, Chrome sẽ hiển thị **FB Cookie Manager** trong danh sách extensions.

### 6. Ghim extension

Bấm biểu tượng **🧩 Extensions** trên thanh Chrome → tìm **FB Cookie Manager** → bấm **📌 Pin / Ghim**.

### 7. Mở extension

Mở tab Facebook, sau đó bấm biểu tượng **FB Cookie Manager** trên thanh công cụ Chrome.

## 🔄 Cập nhật phiên bản mới

Nếu extension đã được cài bằng **Load unpacked**:

1. Tải/giải nén phiên bản mới.
2. Mở `chrome://extensions`.
3. Tìm **FB Cookie Manager**.
4. Bấm **Reload 🔄**.

Nếu đổi sang thư mục mới, dùng **Load unpacked** và chọn thư mục mới có `manifest.json`.

## ❗ Xử lý lỗi thường gặp

### `Tệp kê khai bị thiếu hoặc không thể đọc được`

Kiểm tra thư mục bạn chọn có:

```text
manifest.json
```

Nếu cấu trúc là:

```text
import-cookie-FB-main/
└── import-cookie-FB-main/
    └── manifest.json
```

thì phải chọn thư mục **bên trong** có `manifest.json`.

### Extension không thay đổi sau khi cập nhật

Vào:

```text
chrome://extensions
```

→ **FB Cookie Manager** → **Reload 🔄**.

Nếu vẫn còn bản cũ, Remove extension rồi Load unpacked lại thư mục mới.

## 🔐 Bảo mật

Extension hoạt động cục bộ và không gửi dữ liệu cookie lên máy chủ từ xa. Không chia sẻ cookie/session hoặc file export chứa cookie cho người khác.

## Features

- Quản lý cookie cục bộ.
- Tìm kiếm cookie.
- Xóa cookie.
- Export danh sách cookie JSON.
- Reload tab đang hoạt động.
- Không sử dụng analytics hoặc máy chủ upload cookie.

## Scope

Extension được giới hạn trong phạm vi Facebook domains được khai báo trong `manifest.json`.

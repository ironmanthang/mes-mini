# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Quản lý Yêu cầu Sản xuất (Production Request)

### 1. Ca kiểm thử số: TC-PR-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Yêu cầu sản xuất (Production Request) |
| **Tên ca kiểm thử** | Tạo mới Yêu cầu sản xuất thành công (Gửi ngay lập tức) |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | - Hệ thống đã khởi tạo Master Data (Sản phẩm có sẵn BOM).<br>- Người dùng đăng nhập với quyền `manager` (có quyền tạo PR). |
| **Các bước thực hiện** | 1. Gửi request `POST /api/production-requests`.<br>2. Payload gồm: `productId` của Laptop X1 Pro, `quantity: 100`, `asDraft: false`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created.<br>- Production Request `status` phải là `PENDING` (do đủ nguyên vật liệu trong kho). |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-PR-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Yêu cầu sản xuất (Production Request) |
| **Tên ca kiểm thử** | Từ chối tạo Yêu cầu sản xuất với số lượng bằng 0 |
| **Loại kiểm thử** | Black-box / Boundary (Negative) |
| **Tiền điều kiện** | - Người dùng đăng nhập với quyền `manager`. |
| **Các bước thực hiện** | 1. Gửi request `POST /api/production-requests`.<br>2. Payload gồm: `productId` hợp lệ, `quantity: 0`, `asDraft: true`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 400 Bad Request.<br>- Error message: `"quantity" must be greater than or equal to 1`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |


---

### 3. Ca kiểm thử số: TC-PR-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Yêu cầu sản xuất (Production Request) |
| **Tên ca kiểm thử** | Từ chối tạo Yêu cầu sản xuất với sản phẩm không có BOM |
| **Loại kiểm thử** | Black-box / Negative |
| **Tiền điều kiện** | - Người dùng đăng nhập với quyền `manager`.<br>- Sản phẩm tồn tại nhưng không có BOM. |
| **Các bước thực hiện** | 1. Gửi request `POST /api/production-requests`.<br>2. Payload gồm: `productId` của sản phẩm không có BOM, `quantity: 10`, `asDraft: true`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 400 Bad Request.<br>- Error message: `Cannot create Production Request: Product has no Bill of Materials (BOM).` |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

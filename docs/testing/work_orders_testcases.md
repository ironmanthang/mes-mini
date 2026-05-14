# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Quản lý Lệnh sản xuất (Work Order)

### 1. Ca kiểm thử số: TC-WO-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Lệnh sản xuất (Work Order) |
| **Tên ca kiểm thử** | Tạo mới Work Order thành công (DRAFT) |
| **Loại kiểm thử** | Black-box / Happy Path (Positive) |
| **Tiền điều kiện** | - Tồn tại 1 Production Request ở trạng thái `APPROVED`.<br>- Người dùng có đủ quyền quản lý và vận hành Work Order. |
| **Các bước thực hiện** | 1. Gửi request tạo Work Order (DRAFT) từ PR đã duyệt qua API `POST /api/work-orders`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created.<br>- Work Order được tạo với Code duy nhất.<br>- Trạng thái Work Order là `DRAFT`.<br>- `productionRequestId` được lưu chính xác. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-WO-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Lệnh sản xuất (Work Order) |
| **Tên ca kiểm thử** | Chặn hoàn thành Work Order khi Material Request chưa ISSUED |
| **Loại kiểm thử** | Black-box / State Transition (Negative) |
| **Tiền điều kiện** | - Tồn tại 1 WO ở trạng thái `IN_PROGRESS`.<br>- WO này có 1 Material Request đang ở trạng thái `PENDING` (chưa xuất kho nguyên vật liệu).<br>- WO đã được nhập đầy đủ `laborCost` và `overheadCost`. |
| **Các bước thực hiện** | 1. Gửi request chuyển đổi trạng thái Work Order sang `COMPLETED`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 400 Bad Request.<br>- Lỗi cho biết Work Order không thể hoàn thành vì `Material Request` chưa `ISSUED`.<br>- Trạng thái WO giữ nguyên `IN_PROGRESS`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 3. Ca kiểm thử số: TC-WO-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Lệnh sản xuất (Work Order) |
| **Tên ca kiểm thử** | Hủy Work Order đang sản xuất (IN_PROGRESS) và luồng ảnh hưởng |
| **Loại kiểm thử** | Black-box / State Transition |
| **Tiền điều kiện** | - Tồn tại 1 WO ở trạng thái `IN_PROGRESS` (chưa sinh ra thành phẩm nào).<br>- Có 1 PR liên kết đang ở trạng thái `IN_PROGRESS` (không có WO nào khác liên kết tới PR này đang `IN_PROGRESS`).<br>- WO có 1 Material Request đang `PENDING`. |
| **Các bước thực hiện** | 1. Gửi request huỷ Work Order (có gửi kèm `cancellationReason`). |
| **Kết quả mong đợi** | - API trả về mã HTTP 200 OK.<br>- WO trở thành `CANCELLED`.<br>- Material Request liên kết tự động chuyển sang `CANCELLED`.<br>- Trạng thái PR liên kết lùi về `APPROVED`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

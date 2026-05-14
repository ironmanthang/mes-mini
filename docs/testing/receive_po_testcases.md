# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Nhập kho linh kiện (Receive PO)

---

### 1. Ca kiểm thử số: TC-RCV-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Nhập kho đơn mua hàng (Purchase Order Receive) |
| **Tên ca kiểm thử** | Nhập kho một phần thành công (Partial Receipt) |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | Có 1 PO ở trạng thái `ORDERED` chứa linh kiện A (số lượng đặt: 100). |
| **Các bước thực hiện** | 1. Gọi API `POST /api/purchase-orders/{id}/receive` với payload chứa linh kiện A, `initialQuantity: 40`, `warehouseId: 1`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 200 OK.<br>- Trạng thái PO trở thành `RECEIVING`.<br>- `quantityReceived` tăng thêm 40.<br>- Hệ thống tạo mới 1 `ComponentLot`.<br>- Tồn kho tăng và ghi nhận `InventoryTransaction` loại `IMPORT_PO`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-RCV-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Nhập kho đơn mua hàng (Purchase Order Receive) |
| **Tên ca kiểm thử** | Nhập đủ số lượng còn lại và tự động cập nhật PR |
| **Loại kiểm thử** | Black-box / Happy Path (Traceability) |
| **Tiền điều kiện** | PO đang ở trạng thái `RECEIVING` (còn thiếu 60). PO này có liên kết với 1 PR đang ở trạng thái `WAITING_MATERIAL`. |
| **Các bước thực hiện** | 1. Gọi API `POST /api/purchase-orders/{id}/receive` với payload chứa linh kiện A, `initialQuantity: 60`, `warehouseId: 1`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 200 OK.<br>- Trạng thái PO trở thành `COMPLETED`.<br>- `quantityReceived` đạt 100.<br>- Trạng thái PR liên kết tự động chuyển từ `WAITING_MATERIAL` sang `PENDING`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 3. Ca kiểm thử số: TC-RCV-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Nhập kho đơn mua hàng (Purchase Order Receive) |
| **Tên ca kiểm thử** | Từ chối nhập kho khi PO ở trạng thái không hợp lệ |
| **Loại kiểm thử** | Black-box / Negative (Validation) |
| **Tiền điều kiện** | Có 1 PO đang ở trạng thái `APPROVED` (chưa chuyển sang `ORDERED`). |
| **Các bước thực hiện** | 1. Gọi API `POST /api/purchase-orders/{id}/receive` với payload hợp lệ cho PO đang ở trạng thái không hợp lệ. |
| **Kết quả mong đợi** | - API trả về mã HTTP 400 Bad Request.<br>- Hệ thống báo lỗi trạng thái PO không hợp lệ.<br>- Không có thay đổi tồn kho hay trạng thái PO. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

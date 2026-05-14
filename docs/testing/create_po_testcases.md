# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Quản lý Đơn mua hàng (Purchase Order)

### 1. Ca kiểm thử số: TC-PO-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Đơn mua hàng (Purchase Order) - API Tạo mới |
| **Tên ca kiểm thử** | Tạo mới Đơn mua hàng độc lập (Independent PO) thành công |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | - Đã có Master Data (Supplier, Component, Warehouse).<br>- Tài khoản `purchaser` có quyền tạo PO. |
| **Các bước thực hiện** | 1. Gửi request `POST /api/purchase-orders` với body hợp lệ gồm: `supplierId`, `warehouseId`, `status: "PENDING"`, và mảng `details` chứa `componentId`, `quantity`, `unitPrice`.<br>2. Không truyền trường `productionRequestId` trong mảng `details`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created.<br>- Mã PO được tự động sinh với định dạng `PO-YYYY-NNN`.<br>- Dữ liệu PO được lưu vào DB với `productionRequestId` là `null`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-PO-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Đơn mua hàng (Purchase Order) - API Tạo mới |
| **Tên ca kiểm thử** | Tạo mới Đơn mua hàng liên kết với Yêu cầu sản xuất (PR) |
| **Loại kiểm thử** | Black-box / Happy Path (MTO/Traceability) |
| **Tiền điều kiện** | - Có sẵn một PR đang ở trạng thái hợp lệ để mua hàng (VD: `WAITING_MATERIAL`).<br>- `componentId` truyền vào phải nằm trong cấu trúc BOM (Bill of Materials) của PR đó. |
| **Các bước thực hiện** | 1. Gửi request `POST /api/purchase-orders` với body hợp lệ.<br>2. Trong mảng `details`, truyền vào giá trị `productionRequestId` trỏ tới ID của PR hợp lệ. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created.<br>- Line items trong DB lưu chính xác `productionRequestId`.<br>- Mối quan hệ Link giữa PO và PR được thiết lập thành công. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 3. Ca kiểm thử số: TC-PO-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Đơn mua hàng (Purchase Order) - API Tạo mới |
| **Tên ca kiểm thử** | Báo lỗi khi Component trong PO không thuộc BOM của PR liên kết |
| **Loại kiểm thử** | Black-box / Negative (Validation) |
| **Tiền điều kiện** | - Có sẵn PR hợp lệ.<br>- Lựa chọn một `componentId` hoàn toàn không thuộc BOM của PR này. |
| **Các bước thực hiện** | 1. Gửi request `POST /api/purchase-orders`.<br>2. Trong mảng `details`, gán `productionRequestId` của PR, nhưng sử dụng `componentId` không nằm trong BOM của PR. |
| **Kết quả mong đợi** | - API trả về HTTP `400 Bad Request`.<br>- Thông báo lỗi chỉ rõ component không khớp với BOM của PR.<br>- Đơn mua hàng không được lưu vào DB. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

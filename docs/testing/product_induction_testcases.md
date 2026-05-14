# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Nhập kho thành phẩm sau QC (Product Induction)

### 1. Ca kiểm thử số: TC-IND-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Nhập kho thành phẩm sau QC (Product Induction) |
| **Tên ca kiểm thử** | Induct thành công lô serial PASSED_QC vào SALES warehouse |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data: user có quyền `WH_INDUCT`, warehouse master, product master.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: WO có cấu hình `targetSalesWarehouseId` và `targetErrorWarehouseId` hợp lệ.<br>- Có ít nhất một `ProductInstance` trạng thái `PASSED_QC` thuộc WO trên. |
| **Các bước thực hiện** | - Gọi `POST /api/warehouse-ops/product-induction` với body `{ "serialNumbers": ["<SN-PASSED-1>"] }`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 200 OK với `totalInducted = 1`.<br>- Trạng thái Instance trở thành `IN_STOCK_SALES` với `warehouseId` chính xác.<br>- Hệ thống ghi nhận `receivedAt` và tạo `InventoryTransaction` loại `IMPORT_PRODUCTION`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-IND-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Nhập kho thành phẩm sau QC (Product Induction) |
| **Tên ca kiểm thử** | Induct thành công batch hỗn hợp PASSED_QC và FAILED_QC |
| **Loại kiểm thử** | Black-box / Happy Path (Routing Rule) |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: WO có đủ `targetSalesWarehouseId` và `targetErrorWarehouseId` còn tồn tại.<br>- Có hai instance hợp lệ: một `PASSED_QC`, một `FAILED_QC`, đều thuộc các WO có cấu hình kho đích hợp lệ. |
| **Các bước thực hiện** | - Gọi `POST /api/warehouse-ops/product-induction` với body `{ "serialNumbers": ["<SN-PASSED-1>", "<SN-FAILED-1>"] }`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 200 OK với cả hai serial trong danh sách `inducted`.<br>- Serial `PASSED_QC` trở thành `IN_STOCK_SALES`.<br>- Serial `FAILED_QC` trở thành `IN_STOCK_ERROR`.<br>- `InventoryTransaction` loại `IMPORT_PRODUCTION` được tạo cho mỗi cái. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 3. Ca kiểm thử số: TC-IND-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Nhập kho thành phẩm sau QC (Product Induction) |
| **Tên ca kiểm thử** | Từ chối toàn bộ batch khi có serial không tồn tại (all-or-nothing) |
| **Loại kiểm thử** | Black-box / Negative (Atomicity) |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: có một instance hợp lệ trạng thái `PASSED_QC` (serial thật).<br>- Chuẩn bị thêm một serial giả không tồn tại trong DB. |
| **Các bước thực hiện** | - Gọi `POST /api/warehouse-ops/product-induction` với body `{ "serialNumbers": ["<SN-REAL-PASSED>", "<SN-NOT-FOUND>"] }`. |
| **Kết quả mong đợi** | - API trả về `400 Bad Request` với lỗi: serial not found.<br>- Atomic rollback: serial hợp lệ vẫn giữ nguyên trạng thái cũ (`PASSED_QC`).<br>- Không có transaction `IMPORT_PRODUCTION` nào được tạo. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

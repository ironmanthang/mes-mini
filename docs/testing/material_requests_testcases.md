# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Yêu cầu xuất vật tư cho sản xuất (Material Request)

### 1. Ca kiểm thử số: TC-MR-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Yêu cầu xuất vật tư cho sản xuất (Material Request) |
| **Tên ca kiểm thử** | Tạo Material Request và validate đủ tồn kho thành công |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data: user có quyền `MR_CREATE`, `MR_APPROVE`, `product`, `component`, `warehouse`.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: một `Production Request` ở trạng thái `APPROVED`, một `Work Order` liên kết ở trạng thái `IN_PROGRESS`.<br>- Test file tự tạo tồn kho và `ComponentLot` đủ số lượng theo nhu cầu BOM của WO trong kho `COMPONENT`. |
| **Các bước thực hiện** | - Gọi `POST /api/warehouse-ops/material-requests` với body `{ "workOrderId": <woId> }`.<br>- Lấy `requestId` từ response, gọi `PUT /api/warehouse-ops/material-requests/{id}/validate` với body `{ "warehouseId": <componentWarehouseId> }`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created; MR `status` là `PENDING`.<br>- MR details được tự động sinh từ BOM snapshot/fulfillment của WO.<br>- API validate trả về mã HTTP 200 OK, `canIssue = true`, tất cả các dòng có `missingQuantity = 0`.<br>- Chưa tạo `InventoryTransaction`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-MR-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Yêu cầu xuất vật tư cho sản xuất (Material Request) |
| **Tên ca kiểm thử** | Complete Material Request thành công với lot mapping chính xác |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: WO ở trạng thái `IN_PROGRESS`, MR tương ứng ở trạng thái `PENDING`.<br>- Có đủ `ComponentLot` trong đúng kho `COMPONENT`; tổng `consumedLots` cho từng `componentId` bằng đúng số lượng yêu cầu của từng dòng MR. |
| **Các bước thực hiện** | - Gọi `PUT /api/warehouse-ops/material-requests/{id}/complete` với body gồm `warehouseId` và `consumedLots` hợp lệ (có thể chia một component qua nhiều lot). |
| **Kết quả mong đợi** | - API trả về mã HTTP 200 OK; trạng thái MR trở thành `ISSUED` kèm `completedAt`, `completedById`.<br>- `componentStock` và `ComponentLot.currentQuantity` bị trừ.<br>- `InventoryTransaction` loại `EXPORT_PRODUCTION` được tạo cho mỗi lot. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 3. Ca kiểm thử số: TC-MR-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Yêu cầu xuất vật tư cho sản xuất (Material Request) |
| **Tên ca kiểm thử** | Từ chối complete khi lot không đủ số lượng và giữ nguyên dữ liệu |
| **Loại kiểm thử** | Black-box / Negative (Validation/Atomicity) |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: WO `IN_PROGRESS`, MR `PENDING`.<br>- Chuẩn bị `consumedLots` có ít nhất một lot thiếu số lượng thực tế so với lượng yêu cầu gửi lên. |
| **Các bước thực hiện** | - Gọi `PUT /api/warehouse-ops/material-requests/{id}/complete` với `consumedLots` có một lot không đủ tồn (`currentQuantity < quantity` gửi). |
| **Kết quả mong đợi** | - API trả về `400 Bad Request` với lỗi: lot không đủ số lượng.<br>- Trạng thái MR giữ nguyên `PENDING`.<br>- Không có thay đổi tồn kho/lot và không tạo `InventoryTransaction` mới (atomic rollback). |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

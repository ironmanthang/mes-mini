# Bảng Đặc Tả Ca Kiểm Thử (Test Cases)
## Tính năng: Kiểm tra chất lượng thành phẩm (Quality Control)

### 1. Ca kiểm thử số: TC-QC-01
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Kiểm tra chất lượng thành phẩm (Quality Control) |
| **Tên ca kiểm thử** | Ghi nhận QC đạt với đầy đủ inspection points |
| **Loại kiểm thử** | Black-box / Happy Path |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data: user có quyền `QC_CREATE`, `product`, `checklist`.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: WO/Batch có `ProductInstance` ở trạng thái `PENDING_QC` và checklist đã có inspection points đầy đủ.<br>- WO của batch có `laborCost` và `overheadCost` hợp lệ để không chặn tiến trình tính chi phí khi QC hoàn tất batch. |
| **Các bước thực hiện** | - Gọi `POST /api/quality` với `serialNumber` của instance `PENDING_QC`.<br>- Gửi `inspectionResults` bao phủ toàn bộ `inspectionPointId` yêu cầu của checklist, tất cả `passed = true`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created.<br>- `result` là `PASSED` và `instanceStatus` là `PASSED_QC`.<br>- Bản ghi `QualityCheck` và `inspectionResults` được tạo thành công.<br>- Trạng thái instance chỉ đổi sang `PASSED_QC` (chưa nhập kho). |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 2. Ca kiểm thử số: TC-QC-02
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Kiểm tra chất lượng thành phẩm (Quality Control) |
| **Tên ca kiểm thử** | Áp dụng quy tắc One Fail = Total Fail |
| **Loại kiểm thử** | Black-box / Happy Path (Business Rule) |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: một `ProductInstance` khác ở trạng thái `PENDING_QC`, có checklist hợp lệ. |
| **Các bước thực hiện** | - Gọi `POST /api/quality` cho serial của instance `PENDING_QC`.<br>- Gửi đủ toàn bộ inspection points nhưng có ít nhất một điểm `passed = false`. |
| **Kết quả mong đợi** | - API trả về mã HTTP 201 Created.<br>- `result` là `FAILED` và `instanceStatus` là `FAILED_QC`.<br>- Kết quả cuối cùng được hệ thống tự suy ra theo quy tắc 'One Fail = Total Fail'. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

---

### 3. Ca kiểm thử số: TC-QC-03
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tính năng** | Kiểm tra chất lượng thành phẩm (Quality Control) |
| **Tên ca kiểm thử** | Từ chối QC khi thiếu inspection points bắt buộc |
| **Loại kiểm thử** | Black-box / Negative (Validation) |
| **Tiền điều kiện** | - Chỉ dùng dữ liệu seed chung cho master data.<br>- Test file tự tạo dữ liệu nghiệp vụ riêng: một `ProductInstance` ở trạng thái `PENDING_QC` với checklist có nhiều inspection points. |
| **Các bước thực hiện** | - Gọi `POST /api/quality` nhưng chỉ gửi một phần `inspectionResults` (thiếu ít nhất một `inspectionPointId` bắt buộc). |
| **Kết quả mong đợi** | - API trả về `400 Bad Request` với lỗi: thiếu inspection points.<br>- Không tạo bản ghi QC; trạng thái instance giữ nguyên `PENDING_QC`. |
| **Kết quả thực tế** | Khớp với kết quả mong đợi. |

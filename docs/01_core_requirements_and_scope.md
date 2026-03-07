**Đề tài đề xuất việc phát triển một hệ thống quản lý sản xuất (MES) rút gọn phù hợp với các doanh nghiệp điện tử nhỏ (gồm các thành phẩm trên nền tảng web và mobile app). Hệ thống hỗ trợ quản lý toàn bộ quy trình sản xuất từ khâu tiếp nhận đơn hàng, hoạch định nguyên vật liệu, thực hiện lệnh sản xuất, kiểm soát chất lượng cho đến tính toán chi phí sản xuất. Hệ thống cung cấp khả năng theo dõi tiến độ và tồn kho theo thời gian thực, giúp nhà quản lý ra quyết định kịp thời và chính xác. Với việc tích hợp quét mã QR và truy cập trên thiết bị di động, hệ thống giúp đơn giản hóa việc nhập liệu tại xưởng và nâng cao khả năng truy xuất nguồn gốc. Giải pháp hướng đến mục tiêu giảm lãng phí, nâng cao năng suất và tối ưu hóa hiệu quả vận hành trong quy trình sản xuất cho các doanh nghiệp. Lĩnh vực lựa chọn áp dụng là sản xuất thiết bị điện tử.**

# Mục tiêu đề tài (Small-Scale Electronics Assembly Factory)
Dựa trên việc xác định các bất cập trong phương thức quản lý thủ công và nhu cầu thực tiễn của các doanh nghiệp nhỏ, đề tài xác định mục tiêu tổng quát và các mục tiêu cụ thể như sau:

## Mục tiêu tổng quát
Nghiên cứu quy trình nghiệp vụ sản xuất và xây dựng hệ thống "MES Rút gọn" (Lite MES) hoạt động trên nền tảng Web. Hệ thống hướng tới việc số hóa toàn diện quy trình từ tiếp nhận đơn hàng, hoạch định vật tư đến nhập kho thành phẩm, tạo ra môi trường làm việc số hóa tập trung, giúp nhà quản lý giám sát hoạt động nhà xưởng theo thời gian thực và tối ưu hóa hiệu quả vận hành.

## Mục tiêu cụ thể
Để hiện thực hóa mục tiêu tổng quát, nhóm thực hiện tập trung giải quyết các nhiệm vụ cụ thể sau:

1. **Số hóa và Tự động hóa quy trình nghiệp vụ:**
    - Chuyển đổi hoàn toàn các quy trình quản lý thủ công (giấy tờ, Excel rời rạc) sang hệ thống phần mềm tập trung.
    - Xây dựng quy trình khép kín: Quản lý đơn hàng -> Phân tích nhu cầu vật tư -> Lập Lệnh sản xuất (Work Order) -> Cấp phát vật tư -> Nhập kho thành phẩm.

2. **Thiết lập các Trạm làm việc kỹ thuật số (Digital Workstations):**
    - Xây dựng các giao diện Web tối ưu hóa cho các máy tính hoặc máy tính bảng đặt tại xưởng sản xuất.
    - Cho phép nhân viên kho, tổ trưởng sản xuất và nhân viên QC thực hiện các tác vụ nhập liệu, báo cáo tiến độ và ghi nhận kết quả kiểm tra ngay tại vị trí làm việc thay vì phải tổng hợp báo cáo vào cuối ngày.

3. **Tích hợp công nghệ Định danh và Mã vạch (Barcode):**
    - Tích hợp tính năng sinh mã và in tem Barcode/QR Code định danh cho từng lô nguyên liệu, bán thành phẩm và thành phẩm.
    - Hỗ trợ kết nối với các thiết bị đọc mã vạch (Barcode Scanner) để thực hiện thao tác xuất/nhập kho và xác nhận công đoạn nhanh chóng, chính xác, giảm thiểu sai sót do nhập liệu thủ công.

4. **Giám sát thời gian thực (Real-time Monitoring):**
    - Cung cấp các bảng điều khiển (Dashboard) trực quan hiển thị trạng thái tức thời của sản xuất (tiến độ đơn hàng, năng suất dây chuyền, tỷ lệ hàng lỗi).
    - Hỗ trợ nhà quản lý nắm bắt tình hình hoạt động của nhà máy mọi lúc, mọi nơi thông qua trình duyệt web.

5. **Xây dựng kiến trúc hệ thống hiện đại và tối ưu:**
    - Phát triển hệ thống dựa trên các công nghệ Web hiện đại (Frontend: ReactJS, Backend: NodeJS, Database: PostgreSQL) đảm bảo hiệu năng cao, khả năng xử lý dữ liệu lớn và dễ dàng mở rộng chức năng trong tương lai.
    - Thiết kế giao diện người dùng (UI/UX) thân thiện, đơn giản, phù hợp với trình độ công nghệ của nhân sự tại các doanh nghiệp sản xuất quy mô nhỏ.

# Phạm vi đề tài
Để đảm bảo tính khả thi trong khuôn khổ Đồ án chuyên ngành, cũng như phù hợp với đặc thù nguồn lực hạn chế của các DNVVN, nhóm thực hiện tập trung giải quyết các bài toán cốt lõi nhất tại phân xưởng sản xuất (Shop-floor). Phạm vi cụ thể được xác định như sau:

## Phạm vi chức năng
Hệ thống tập trung hiện thực hóa quy trình nghiệp vụ khép kín "Từ Đơn hàng đến Nhập kho thành phẩm" (Order to Stock), bao gồm 04 phân hệ chức năng chính:

1. **Phân hệ Quản lý Đơn hàng và Hoạch định vật tư:**
    - Tiếp nhận và quản lý thông tin đơn hàng từ bộ phận kinh doanh.
    - Phân tích nhu cầu nguyên vật liệu dựa trên Định mức nguyên vật liệu (BOM) và tồn kho khả dụng.
    - Lập yêu cầu nhập kho vật tư để phục vụ sản xuất.

2. **Phân hệ Quản lý Lệnh sản xuất (Work Order):**
    - Chuyển đổi yêu cầu sản xuất thành các Lệnh sản xuất (Work Order) chi tiết.
    - Thiết lập và quản lý các lô sản xuất (Production Batches).
    - Phân công lệnh sản xuất xuống từng dây chuyền/tổ đội cụ thể.

3. **Phân hệ Quản lý Kho và Vật tư:**
    - Quản lý quy trình Nhập - Xuất - Tồn cho nguyên liệu, bán thành phẩm và thành phẩm.
    - Hỗ trợ tạo và in tem nhãn mã vạch (Barcode/QR) định danh cho đối tượng quản lý.
    - Thực hiện các giao dịch kho thông qua giao diện Web kết nối với thiết bị đọc mã vạch (Barcode Scanner).

4. **Phân hệ Thực thi sản xuất và Kiểm soát chất lượng (QC):**
    - Ghi nhận sản lượng hoàn thành thực tế tại từng công đoạn thông qua các trạm làm việc (Workstation) đặt tại xưởng.
    - Thực hiện quy trình kiểm tra chất lượng (QC Check): ghi nhận kết quả Đạt/Không đạt và phân loại sản phẩm trước khi nhập kho.

## Phạm vi người dùng
Hệ thống được thiết kế để phục vụ hai nhóm đối tượng chính thông qua trình duyệt Web:

1. **Nhóm Quản lý và Văn phòng (Back-office Users):**
    - Đối tượng: Quản trị viên hệ thống (Admin), Trưởng bộ phận sản xuất, Quản lý kho, Nhân viên kinh doanh,...
    - Tác vụ: Thiết lập hệ thống, lập kế hoạch sản xuất, duyệt đơn hàng, xem báo cáo thống kê và giám sát tiến độ tổng thể.

2. **Nhóm Tác nghiệp tại xưởng (Shop-floor Users):**
    - Đối tượng: Trưởng dây chuyền (Line Leader), Nhân viên kho, Nhân viên KCS/QC.
    - Tác vụ: Sử dụng các máy tính hoặc máy tính bảng (Web Terminal) đặt tại xưởng để quét mã vạch, xác nhận hoàn thành công đoạn và ghi nhận kết quả kiểm tra.

## Phạm vi công nghệ
Hệ thống được xây dựng hoàn toàn trên nền tảng Web (Web-based Application) với các công nghệ:

- **Frontend:** Sử dụng thư viện ReactJS để xây dựng giao diện người dùng tương tác cao, hỗ trợ Responsive (hiển thị tốt trên cả PC và Tablet).
- **Backend:** Sử dụng NodeJS và Framework Express để xây dựng các API xử lý nghiệp vụ.
- **Cơ sở dữ liệu:** Sử dụng PostgreSQL (RDBMS).
- **Hạ tầng:** Hệ thống hoạt động trên môi trường mạng nội bộ (LAN) hoặc Cloud Server, người dùng truy cập thông qua trình duyệt Web tiêu chuẩn (Chrome, Edge, Firefox).

## Các giới hạn của đề tài
Đề tài xác định rõ các giới hạn sau để tập trung nguồn lực vào các chức năng cốt lõi:

- Không phát triển ứng dụng di động (Native Mobile App): Hệ thống không bao gồm phiên bản ứng dụng cài đặt riêng cho Android/iOS. Có thể tạo 1 app nhỏ phục vụ mục đích quét mã QR.
- Không bao gồm các nghiệp vụ tài chính - kế toán chuyên sâu: Chỉ tính toán chi phí sản xuất trực tiếp ước tính, không xử lý hạch toán thuế hay công nợ.
- Không quản lý nhân sự (HRM) và tính lương: Chỉ quản lý danh sách nhân viên phục vụ mục đích phân quyền và giao việc.
- Không kết nối phần cứng tự động (IoT/SCADA): Dữ liệu sản xuất được nhập liệu bởi con người, chưa kết nối trực tiếp để lấy tín hiệu từ cảm biến máy móc (PLC).

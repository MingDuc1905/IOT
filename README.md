
## ĐỀ TÀI: HỆ THỐNG IOT GIÁM SÁT ÁP SUẤT ĐƯỜNG ỐNG CẤP NƯỚC VÀ CẢNH BÁO BẤT THƯỜNG

---

##  Giới Thiệu Đề Tài
Hệ thống IoT giám sát áp suất đường ống cấp nước theo thời gian thực nhằm phát hiện sớm các hiện tượng bất thường như vỡ đường ống, rò rỉ nước, quá áp hoặc mất áp lực nguồn cấp trong các tòa nhà, nhà máy và khu dân cư.

###  Các Tính Năng Nổi Bật:
1. **Giám sát thời gian thực:** Hiển thị giá trị áp suất tức thời và vẽ biểu đồ biến thiên liên tục theo thời gian.
2. **Cảnh báo bất thường đa cấp độ:**
   - Cảnh báo áp suất cao (High Pressure) – nguy cơ bục vỡ do búa nước.
   - Cảnh báo áp suất thấp (Low Pressure) – mất nước nguồn cấp hoặc rò rỉ chậm.
   - Cảnh báo giảm áp nhanh kéo dài (Rapid Pressure Drop) – thuật toán tính đạo hàm dP/dt giúp phân biệt giữa mở vòi nước thông thường và sự cố bục vỡ lớn.
3. **Quản lý nhật ký & Tiến trình xử lý (Incident Ticket):** Ghi lại chính xác vị trí đo (Node ID), thời điểm xảy ra sự cố và cho phép kỹ thuật viên cập nhật tiến trình khắc phục (Chờ tiếp nhận $\to$ Đang kiểm tra $\to$ Đã giải quyết).
4. **Kiến trúc mở rộng đa điểm:** Thiết kế đường truyền sẵn sàng quản lý nhiều trạm đo (Multi-node) trong khuôn viên lớn; đồ án triển khai thực nghiệm 1 trạm đo mẫu (PoC Node).
5. **Mô hình thực nghiệm chi phí thấp & siêu an toàn:** Mô hình thủy lực sử dụng xi-lanh nén khí/nước nhỏ gọn, không nguy cơ rò nước ra bàn máy tính khi thuyết minh.

---

## Danh Mục Linh Kiện Thực Tế Đã Trang Bị (BOM Thực Nghiệm)
- **Bộ điều khiển:** Kit NodeMCU Lua Wi-Fi V3 ESP8266 CH340 cổng USB Type-C.
- **Cảm biến áp suất:** MPS20N0040D-D dạng chip DIP 6 chân (Dải đo áp suất khí/chất lỏng: 0 ~ 40 kPa, tương đương 0 ~ 0.4 Bar / 0.4 atm). Cầu trở Wheatstone ngõ ra vi sai mili-vôn.
- **Module giao tiếp/khuếch đại ADC (bắt buộc):** Module ADC 24-bit chuyên dụng HX710B (hàn sẵn cảm biến MPS20N0040D-S) với Gain cố định 128, giao tiếp số qua chân DOUT (D2) và SCK (D1).
- **Mô hình tạo áp lực:** Xi-lanh y tế (50ml – 100ml) + ống ti-ô mềm dẫn khí/nước cắm vào đầu vòi kim loại/nhựa của cảm biến.
- **Dây dẫn & Kết nối:** Dây cắm Testboard Đực - Cái 20cm (40 sợi).
- **Nguồn cấp:** Cáp Type-C cắm cổng USB máy tính (5V DC cấp cho ESP8266).
- **Cảnh báo tại chỗ & từ xa:** Đèn LED trạng thái trên ESP8266 + Web Dashboard + Hệ thống vé sự cố (Incident Tickets).

---

##  Cấu Trúc Thư Mục
```text
d:\IOT\
├── đồ án/
│   ├── firmware/            # Code nạp ESP8266/ESP32 (Arduino C++)
│   ├── web/                 # Giao diện Web Dashboard & Quản lý Ticket
│   ├── hardware/            # Sơ đồ mạch HX710B & nối dây
│   └── docs/                # Báo cáo Word & Slide bảo vệ
├── AGENTS.md                # Quy chuẩn hoạt động cho Agent
└── README.md                # Tài liệu hướng dẫn này

# Không đẩy lên git (xem .gitignore): LT/, TH/, claude plan/, tabler_official/, file cá nhân
```

---

## Hướng Dẫn Vận Hành & Thử Nghiệm Mô Hình
1. **Nạp Firmware:** Mở mã nguồn trong `đồ án/firmware/` bằng Arduino IDE, cấu hình Wi-Fi và nạp vào ESP8266/ESP32.
2. **Khởi động Web Dashboard:** Mở file `đồ án/web/index.html` trên trình duyệt để theo dõi áp suất và danh sách sự cố.
3. **Kịch bản thực nghiệm:**
   - **Áp suất ổn định:** Đẩy pít-tông xi-lanh lên mức ~0.25 Bar $\to$ Hệ thống báo trạng thái bình thường (Xanh).
   - **Sử dụng nước thông thường:** Kéo nhẹ pít-tông $\to$ Áp suất giảm nhẹ rồi ổn định $\to$ Không kích hoạt báo động sai.
   - **Giả lập bục vỡ ống:** Rút nhanh pít-tông $\to$ Áp suất tụt dốc liên tục về 0 $\to$ Kích hoạt cảnh báo đỏ và tự động phát hành Ticket sự cố trên Web Dashboard.

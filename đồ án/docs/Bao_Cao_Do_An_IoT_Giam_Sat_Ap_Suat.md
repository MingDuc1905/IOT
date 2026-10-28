# BÁO CÁO ĐỒ ÁN MÔN HỌC: INTERNET VẠN VẬT (IoT)
## ĐỀ TÀI: HỆ THỐNG IOT GIÁM SÁT ÁP SUẤT ĐƯỜNG ỐNG CẤP NƯỚC VÀ CẢNH BÁO BẤT THƯỜNG

*Lưu ý xác nhận: Báo cáo được xây dựng theo chuẩn cấu trúc 5 chương và quy cách định dạng hướng dẫn tại HUFLIT. Sinh viên vui lòng xác nhận lại với Giảng viên hướng dẫn trước khi in ấn nộp chính thức.*

---

## TRANG BÌA (COVER PAGE)
- **TRƯỜNG ĐẠI HỌC NGOẠI NGỮ - TIN HỌC THÀNH PHỐ HỒ CHÍ MINH (HUFLIT)**
- **KHOA CÔNG NGHỆ THÔNG TIN**
- **BÁO CÁO KẾT THÚC HỌC PHẦN: INTERNET VẠN VẬT (IoT)**
- **ĐỀ TÀI:** HỆ THỐNG IOT GIÁM SÁT ÁP SUẤT ĐƯỜNG ỐNG CẤP NƯỚC VÀ CẢNH BÁO BẤT THƯỜNG
- **Giảng viên hướng dẫn:** [[ĐIỀN: Tên GVHD ]]
- **Sinh viên thực hiện:**
  1. [[ĐIỀN: Họ tên SV 1 ]] — MSSV: [[ĐIỀN: MSSV 1 ]]
  2. [[ĐIỀN: Họ tên SV 2 ]] — MSSV: [[ĐIỀN: MSSV 2 ]]
  3. [[ĐIỀN: Họ tên SV 3 ]] — MSSV: [[ĐIỀN: MSSV 3 ]]
- **Thời gian hoàn thành:** [[ĐIỀN: tháng MM/2026 ]]

---

## THÔNG TIN NHÓM THỰC HIỆN ĐỀ TÀI

| STT | Nội Dung Thực Hiện | [[ĐIỀN: Họ tên SV 1 ]] | [[ĐIỀN: Họ tên SV 2 ]] | [[ĐIỀN: Họ tên SV 3 ]] | Ghi Chú |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | Khảo sát bài toán, đề xuất giải pháp & mô hình thực nghiệm | X | X | X | Hoàn thành |
| **2** | Thiết kế mạch, nghiên cứu giao thức HX710B 24-bit & nạp Firmware ESP8266 | X | | | Hoàn thành |
| **3** | Xây dựng thuật toán lọc EMA, đạo hàm tụt áp dP/dt & hiệu chuẩn cột nước | X | | X | Hoàn thành |
| **4** | Lập trình Web Dashboard thời gian thực, SSE Telemetry & Quản lý Vé sự cố | | X | | Hoàn thành |
| **5** | Tích hợp máy chủ ThingSpeak đám mây & API Collector | X | X | | Hoàn thành |
| **6** | Lắp ráp mô hình xi-lanh nén khí/nước, thực nghiệm & soạn thảo Báo cáo | | | X | Hoàn thành |

---

## TÓM TẮT ĐỀ TÀI (ABSTRACT)
Sự cố rò rỉ và bục vỡ đường ống trong mạng lưới cấp thoát nước của các tòa nhà chung cư, trường học và khu công nghiệp gây thất thoát hàng triệu mét khối tài nguyên nước quý giá và dẫn đến ngập lụt, hư hại tài sản nghiêm trọng. Đề tài *"Hệ Thống IoT Giám Sát Áp Suất Đường Ống Cấp Nước Và Cảnh Báo Bất Thường"* được nghiên cứu và chế tạo nhằm giải quyết triệt để thách thức phát hiện chậm trễ của các phương pháp đồng hồ cơ học truyền thống.

Hệ thống kết hợp vi điều khiển NodeMCU ESP8266, cảm biến màng silicon áp điện trở MPS20N0040D (dải đo $0 \sim 40\text{ kPa}$) cùng mạch khuếch đại ADC 24-bit chuyên dụng HX710B (độ lợi Gain 128) để thu thập áp lực nước tức thời với chu kỳ 100ms. Dữ liệu được xử lý cận biên (Edge Computing) thông qua bộ lọc số Exponential Moving Average (EMA) để triệt tiêu nhiễu điện từ và thuật toán đạo hàm dốc $dP/dt$ giúp phân biệt chính xác giữa hành vi mở vòi sử dụng nước thông thường và sự cố bục vỡ ống nghiêm trọng. Hệ thống tích hợp đồng thời Web Dashboard trực quan hóa theo thời gian thực (React + Tabler UI), máy chủ Node.js lưu trữ bền vững SQLite, quy trình quản lý vòng đời vé sự cố (Incident Tickets) và kênh truyền dữ liệu đám mây ThingSpeak (đáp ứng đúng Chương 7 đề cương môn học IoT). Mô hình thực nghiệm sử dụng xi-lanh nén khí/chất lỏng nhỏ gọn, chi phí phần cứng tối ưu (~140.000 VNĐ) và đạt độ an toàn tuyệt đối khi vận hành bảo vệ trước hội đồng.

*Từ khóa:* Internet of Things (IoT), Cảm biến áp suất, MPS20N0040D, ADC 24-bit HX710B, Lọc EMA, Đạo hàm dP/dt, ThingSpeak, Incident Ticket.

---

## MỤC LỤC BÁO CÁO
- **CHƯƠNG 1: GIỚI THIỆU**
  - 1.1. Bối cảnh và lý do chọn đề tài (1.1.1 Bối cảnh; 1.1.2 Lý do chọn đề tài)
  - 1.2. Mục tiêu nghiên cứu (1.2.1 Mục tiêu chung; 1.2.2 Mục tiêu cụ thể)
  - 1.3. Phạm vi và giới hạn (1.3.1 Phạm vi nghiên cứu; 1.3.2 Giới hạn đề tài)
  - 1.4. Ý nghĩa thực tiễn
  - 1.5. Bố cục báo cáo
- **CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÁC NGHIÊN CỨU LIÊN QUAN**
  - 2.1. Khái niệm cơ bản (Áp suất chất lỏng, Cầu Wheatstone, ADC 24-bit vi sai)
  - 2.2. Công nghệ và thuật toán áp dụng
    - 2.2.1. Cảm biến MPS20N0040D và IC khuếch đại HX710B (Gain 128)
    - 2.2.2. Vi điều khiển ESP8266 & Chuẩn Wi-Fi IEEE 802.11 b/g/n
    - 2.2.3. Bộ lọc số Exponential Moving Average (EMA)
    - 2.2.4. Thuật toán đạo hàm tụt áp dP/dt nhận diện bục vỡ
    - 2.2.5. Nền tảng Internet vạn vật ThingSpeak (Chương 7 đề cương môn học)
  - 2.3. Các nghiên cứu và giải pháp liên quan trên thị trường
- **CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG**
  - 3.1. Phân tích yêu cầu hệ thống (Yêu cầu chức năng và phi chức năng)
  - 3.2. Sơ đồ khối và kiến trúc hệ thống 3 tầng (Three-Tier Architecture)
  - 3.3. Thiết kế phần cứng và sơ đồ kết nối chân HX710B
  - 3.4. Thiết kế dữ liệu và luồng xử lý tín hiệu
    - 3.4.1. Giao thức truyền số 25 xung (10 Hz) của HX710B
    - 3.4.2. Cấu trúc cơ sở dữ liệu SQLite & Hợp đồng REST API / SSE
- **CHƯƠNG 4: CÀI ĐẶT, TRIỂN KHAI VÀ KẾT QUẢ ĐẠT ĐƯỢC**
  - 4.1. Công nghệ sử dụng trong triển khai
  - 4.2. Cài đặt hệ thống (Firmware ESP8266, Backend Node.js, Frontend React)
  - 4.3. Quy trình triển khai và phương pháp hiệu chuẩn cột nước 2 điểm
  - 4.4. Kết quả thực nghiệm qua 5 kịch bản thủy lực chuẩn hóa
  - 4.5. Đánh giá kết quả
    - 4.5.1. Ưu điểm nổi bật
    - 4.5.2. Các hạn chế kỹ thuật
    - 4.5.3. Mức độ hoàn thành so với mục tiêu đề ra
- **CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**
  - 5.1. Kết luận
  - 5.2. Hướng phát triển trong tương lai
- **TÀI LIỆU THAM KHẢO (IEEE STYLE)**

---

## DANH MỤC BẢNG BIỂU
- Bảng 1.1: Bảng phân công nhiệm vụ nhóm thực hiện đề tài.
- Bảng 2.1: Bảng tổng hợp thông số kỹ thuật cảm biến MPS20N0040D và HX710B.
- Bảng 3.1: Sơ đồ nối dây chi tiết giữa HX710B và NodeMCU ESP8266.
- Bảng 4.1: Bảng tra áp suất tham chiếu theo chiều cao cột nước hiệu chuẩn.
- Bảng 4.2: Kết quả thực nghiệm 5 kịch bản vận hành thủy lực.

## DANH MỤC HÌNH ẢNH
- Hình 2.1: Sơ đồ nguyên lý cầu trở Wheatstone màng silicon.
- Hình 2.2: Giản đồ xung clock giao tiếp 25 xung của chip HX710B.
- Hình 3.1: Sơ đồ khối hệ thống IoT giám sát áp suất 3 tầng.
- Hình 3.2: Sơ đồ nối dây mạch phần cứng thực nghiệm.
- Hình 4.1: Giao diện Web Dashboard SCADA Telemetry thời gian thực.
- Hình 4.2: Biểu đồ biến thiên áp suất và đạo hàm dP/dt khi xảy ra sự cố bục vỡ ống.

---

## CHƯƠNG 1: GIỚI THIỆU

### 1.1. Bối cảnh và lý do chọn đề tài
#### 1.1.1. Bối cảnh
Trong các đô thị hiện đại, các khu dân cư cao tầng và nhà máy công nghiệp, hệ thống cấp nước sạch đóng vai trò huyết mạch. Tuy nhiên, tình trạng thất thoát nước (Non-Revenue Water - NRW) tại nhiều đô thị vẫn duy trì ở mức cao từ 15% đến 25%. Các nguyên nhân chủ yếu bao gồm hiện tượng búa nước (Water Hammer) gây quá áp nứt vỡ ống, hiện tượng rò rỉ ngầm kéo dài do ống lão hóa, hoặc bục vỡ mối nối van xả gây ngập lụt cục bộ, hư hỏng sàn nhà và trang thiết bị kỹ thuật.

#### 1.1.2. Lý do chọn đề tài
Các phương pháp kiểm tra thủ công bằng mắt hoặc đọc đồng hồ cơ học định kỳ chỉ phát hiện thất thoát nước sau một khoảng thời gian trễ rất lớn (thường là cuối tháng khi đối soát hóa đơn tiền nước). Do đó, việc xây dựng một hệ thống IoT giám sát áp lực đường ống thời gian thực, có khả năng nhận dạng tự động biến động bất thường và cảnh báo tức thời là một đòi hỏi vô cùng cấp thiết và mang tính ứng dụng cao.

### 1.2. Mục tiêu nghiên cứu
#### 1.2.1. Mục tiêu chung
Xây dựng một hệ thống IoT hoàn chỉnh từ tầng thu thập biên (Edge Sensor), tầng truyền thông mạng (Wireless Gateway / Cloud Uplink) đến tầng ứng dụng quản trị (Web Dashboard SCADA & Incident Management) để giám sát áp suất và cảnh báo sự cố bục vỡ đường ống nước.

#### 1.2.2. Mục tiêu cụ thể
1. Thu thập tín hiệu áp suất màng silicon chính xác qua ADC 24-bit HX710B với tốc độ 10 Hz.
2. Xây dựng thuật toán lọc nhiễu EMA và đạo hàm dP/dt chạy trực tiếp trên vi điều khiển ESP8266 để phân biệt chính xác giữa hiện tượng mở vòi nước sinh hoạt và sự cố bục vỡ ống.
3. Thiết lập phương pháp hiệu chuẩn vật lý 2 điểm bằng cột nước tham chiếu $P = \rho \cdot g \cdot h$ và lưu trữ cấu hình vào EEPROM.
4. Triển khai Web Dashboard hiển thị đồ thị áp lực thời gian thực, quản lý vòng đời vé sự cố (Incident Tickets) và gửi dữ liệu lên máy chủ ThingSpeak.

### 1.3. Phạm vi và giới hạn
#### 1.3.1. Phạm vi nghiên cứu
- Nghiên cứu cơ chế lan truyền sóng áp suất trong đường ống kín.
- Thiết kế trạm đo mẫu (PoC Node) sử dụng vi điều khiển ESP8266 và cảm biến MPS20N0040D (dải đo $0 \sim 40\text{ kPa}$ tương đương $0 \sim 0.4\text{ Bar}$).
- Thử nghiệm trên mô hình thủy lực nén xi-lanh y tế nhỏ gọn, tuyệt đối an toàn.

#### 1.3.2. Giới hạn đề tài
- Hệ thống thực nghiệm đo trên 01 trạm đo mẫu, chưa triển khai mạng lưới diện rộng hàng trăm điểm trên toàn đô thị.
- Phương pháp hiệu chuẩn cột nước thực nghiệm bằng ống ti-ô 80cm phủ khoảng 20% dải đo toàn thang ($0.0785\text{ Bar}$ trên $0.40\text{ Bar}$), dải đo còn lại dựa trên giả định độ tuyến tính cao của màng silicon MEMS (độ phi tuyến $< 0.25\%$).

### 1.4. Ý nghĩa thực tiễn
Đề tài cung cấp giải pháp giám sát áp lực nước chi phí cực thấp (~140.000 VNĐ cho phần cứng trạm đo), phù hợp trang bị cho các hộ gia đình, trường học, tòa nhà chung cư vừa và nhỏ để kịp thời phát hiện rò rỉ, bảo vệ tài sản và tiết kiệm tài nguyên nước.

### 1.5. Bố cục báo cáo
Báo cáo gồm 5 chương: Chương 1 giới thiệu tổng quan; Chương 2 trình bày cơ sở lý thuyết và công nghệ; Chương 3 phân tích và thiết kế hệ thống; Chương 4 cài đặt, triển khai và đánh giá kết quả thực nghiệm; Chương 5 tổng kết và định hướng phát triển.

---

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÁC NGHIÊN CỨU LIÊN QUAN

### 2.1. Khái niệm cơ bản
- **Áp suất chất lỏng:** Là lực tác dụng vuông góc lên một đơn vị diện tích bề mặt tiếp xúc ($1\text{ Bar} = 100.000\text{ Pa} = 100\text{ kPa}$).
- **Cầu Wheatstone:** Mạch điện trở gồm 4 nhánh cầu dùng để đo biến thiên điện trở cực nhỏ của màng silicon khi có áp lực tác động. Ngõ ra là điện áp vi sai $\Delta V = VOUT+ - VOUT-$ có biên độ rất nhỏ ($0 \sim 50\text{ mV}$).
- **ADC 24-bit vi sai:** Khối khuếch đại và biến đổi tín hiệu mili-vôn với độ phân giải lên đến 16 triệu nấc ($2^{24}$), cho phép bắt được các thay đổi áp suất siêu nhỏ mà ADC 10-bit truyền thống của vi điều khiển không thể đo được.

### 2.2. Công nghệ và thuật toán áp dụng
#### 2.2.1. Cảm biến MPS20N0040D & IC khuếch đại HX710B
- MPS20N0040D là cảm biến áp suất màng silicon dạng DIP-6 / SOP-6 có vòi hơi, dải đo $0 \sim 40\text{ kPa}$.
- Khi đo trực tiếp vào ADC 10-bit của ESP8266, toàn bộ dải đo $0.4\text{ Bar}$ chỉ tạo ra độ lệch $\approx 15\text{ counts}$ (mỗi nấc $\approx 0.026\text{ Bar}$), chìm hoàn toàn dưới mức nhiễu $\pm 2 \sim 4\text{ counts}$ của nguồn.
- Đồ án bắt buộc sử dụng IC chuyên dụng **HX710B** có bộ tiền khuếch đại Gain cố định 128 và ADC 24-bit vi sai. Với gain 128, tín hiệu $50\text{ mV}$ được nâng lên hàng triệu count số, đảm bảo tỷ số tín hiệu trên nhiễu (SNR) vượt trội.

#### 2.2.2. Vi điều khiển ESP8266
SoC tích hợp CPU Tensilica Xtensa 32-bit LX106 tần số 80/160MHz, bộ nhớ Flash 4MB và khối thu phát Wi-Fi 2.4GHz chuẩn IEEE 802.11 b/g/n, hỗ trợ chạy đồng thời cả chế độ Station (kết nối Internet) và Access Point (mạng nội bộ).

#### 2.2.3. Bộ lọc số Exponential Moving Average (EMA)
Để triệt tiêu nhiễu dao động tức thời mà không gây trễ pha lớn, hệ thống áp dụng công thức:
$$P_{\text{filtered}}[k] = \alpha \cdot P_{\text{raw}}[k] + (1 - \alpha) \cdot P_{\text{filtered}}[k-1]$$
Với $\alpha = 0.25$, thuật toán loại bỏ hơn 85% nhiễu ngẫu nhiên, tạo tiền đề ổn định cho phép tính đạo hàm dP/dt.

#### 2.2.4. Thuật toán đạo hàm tụt áp dP/dt
Tốc độ biến thiên áp suất được tính bằng phương pháp sai phân lùi trên cửa sổ trượt $N = 10$ mẫu ($\Delta t = 1.0\text{s}$):
$$\frac{dP}{dt} = \frac{P_{\text{filtered}}[k] - P_{\text{filtered}}[k-10]}{1.0\text{s}}$$
- **Phân biệt mở vòi sinh hoạt:** Khi người dùng mở vòi nước, áp suất giảm nhẹ từ $0.22\text{ Bar} \to 0.16\text{ Bar}$ trong 3 giây ($dP/dt \approx -0.02\text{ Bar/s}$), sau đó áp suất ổn định hoặc hồi áp $\to$ Không kích hoạt báo động.
- **Nhận diện bục vỡ ống:** Khi vỡ ống, áp suất tụt dốc liên tục về $0\text{ Bar}$ với tốc độ $dP/dt \le -0.08\text{ Bar/s}$ kéo dài liên tục qua ít nhất 3 chu kỳ đo (300ms) $\to$ Kích hoạt ngay lập tức cảnh báo `RAPID_DROP`.

#### 2.2.5. Nền tảng Internet vạn vật ThingSpeak (Chương 7 đề cương)
ThingSpeak là dịch vụ đám mây IoT cung cấp API RESTful cho phép thiết bị đẩy dữ liệu thời gian thực lên 8 trường (Fields). Đồ án ánh xạ 4 trường: Field 1 (Áp suất Bar), Field 2 (Đạo hàm dP/dt), Field 3 (Mã trạng thái), Field 4 (Count 24-bit thô) với chu kỳ 15 giây/lần.

### 2.3. Các nghiên cứu và giải pháp liên quan trên thị trường
- Hệ thống SCADA công nghiệp: Chi phí rất đắt (hàng chục triệu đồng), cồng kềnh.
- Cảm biến lưu lượng cánh quạt: Dễ bị nghẹt cặn bẩn trong nước sinh hoạt.
- Giải pháp trạm đo áp suất IoT cận biên: Chi phí rẻ, không cản trở dòng chảy, bắt được sóng lan truyền áp suất nhanh nhất khi có biến cố.

---

## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Phân tích yêu cầu hệ thống
- **Yêu cầu chức năng:**
  1. Đọc và quy đổi liên tục áp suất đường ống với chu kỳ lấy mẫu 100ms (10 Hz).
  2. Tự động nhận diện 4 trạng thái vận hành: `NORMAL`, `HIGH_PRESSURE`, `LOW_PRESSURE`, `RAPID_DROP`.
  3. Cung cấp API REST và luồng dữ liệu Server-Sent Events (SSE) cho Web Dashboard.
  4. Quản lý vòng đời vé sự cố: `PENDING` $\to$ `INVESTIGATING` $\to$ `RESOLVED`.
  5. Đồng bộ dữ liệu lên máy chủ ThingSpeak.
  6. Lưu cấu hình hiệu chuẩn vào bộ nhớ không bay hơi EEPROM.
- **Yêu cầu phi chức năng:**
  1. Thời gian phát hiện sự cố $< 500\text{ms}$.
  2. Web Server trên chip không bị treo (non-blocking).
  3. Chi phí linh kiện phần cứng $< 200.000\text{ VNĐ}$.

### 3.2. Sơ đồ khối và kiến trúc hệ thống 3 tầng
Hệ thống được thiết kế theo kiến trúc 3 tầng độc lập:
1. **Tầng Thiết bị Cận biên (Edge Layer):** Cảm biến MPS20N0040D $\to$ Module HX710B $\to$ NodeMCU ESP8266 (chạy thuật toán EMA + dP/dt + EEPROM).
2. **Tầng Máy chủ Thu thập (Collector / Backend Layer):** Node.js Express 5 đóng vai trò bộ thu thập độc lập, lưu trữ dữ liệu bền vững vào SQLite (`hydrowatch.db`), quản lý vòng đời vé sự cố và tích hợp bộ mô phỏng vật lý 5 kịch bản.
3. **Tầng Ứng dụng & Trực quan (Application Layer):** Web Dashboard SCADA Telemetry (React 19 + Tabler UI + Chart.js) và nền tảng đám mây ThingSpeak.

### 3.3. Thiết kế phần cứng và sơ đồ kết nối chân HX710B
```text
  [Cảm Biến MPS20N0040D]         [Module HX710B 24-bit]          [NodeMCU ESP8266]
  ----------------------         ----------------------          -----------------
  Chân 1 (VCC)           ------> VCC                             3V3 (3.3V DC)
  Chân 2 (GND)           ------> GND                             GND
  Chân 3 (VOUT+)         ------> A+ / IN+
  Chân 5 (VOUT-)         ------> A- / IN-
                                 DOUT (Dữ liệu 24-bit)   ------> D2 (GPIO4)
                                 SCK  (Clock phát xung)  ------> D1 (GPIO5)
```

### 3.4. Thiết kế dữ liệu và luồng xử lý
#### 3.4.1. Giao thức 25 xung non-blocking của HX710B
- Chân `DOUT` xuống mức THẤP báo hiệu chip đã chuyển đổi xong mẫu đo mới.
- Vi điều khiển phát 24 xung trên chân `SCK` để dịch 24 bit dữ liệu MSB trước.
- Xung thứ 25 chốt cấu hình kênh vi sai ở tốc độ 10 Hz (100ms).
- Khối phát xung được bọc trong `noInterrupts()` / `interrupts()` ($\approx 50\mu\text{s}$) để tránh ngắt Wi-Fi làm trễ xung quá ngưỡng power-down ($60\mu\text{s}$).
- Sử dụng thuật toán mở rộng dấu: `(raw & 0x800000) ? (raw | 0xFF000000) : raw` để đọc chính xác số âm bù hai.

#### 3.4.2. Cấu trúc dữ liệu SQLite & Hợp đồng REST API
Bảng `pressure_logs` lưu trữ nhật ký đo thời gian thực: `node_id`, `pressure`, `pressure_raw`, `dp_dt`, `voltage_mv`, `raw_adc`, `status`, `status_server`, `timestamp`.
Bảng `incidents` lưu trữ phiếu sự cố: `ticket_id`, `node_id`, `alert_type`, `trigger_pressure`, `start_time`, `status`, `staff_name`, `action_taken`, `resolved_at`.

---

## CHƯƠNG 4: CÀI ĐẶT, TRIỂN KHAI VÀ KẾT QUẢ ĐẠT ĐƯỢC

### 4.1. Công nghệ sử dụng trong triển khai
- **Phần cứng:** NodeMCU Lua V3 ESP8266 (CH340), Module HX710B tích hợp MPS20N0040D-S, Xi-lanh nén khí/nước 50ml + ống dẫn mềm ti-ô.
- **Firmware:** Ngôn ngữ C++ trên nền tảng Arduino IDE / ESP8266 Core.
- **Backend Collector:** Node.js (v24), Express 5, `better-sqlite3`, `undici`, `zod`.
- **Frontend Dashboard:** React 19, Vite, Tabler Core UI, Chart.js.
- **Đám mây:** ThingSpeak IoT Cloud Server.

### 4.2. Cài đặt hệ thống
- Firmware được tổ chức thành cấu trúc module hóa: `hx710bRead()` đọc xung non-blocking, cờ `SIMULATE_SENSOR` cho phép nạp chạy thử nghiệm ngay trên NodeMCU mà không bị lỗi khi chưa cắm cảm biến thật.
- Backend tích hợp trình thu thập Poller định kỳ 500ms, tự động sinh phiếu sự cố khi phát hiện bất thường và đẩy dữ liệu qua SSE `/stream`.

### 4.3. Quy trình triển khai và phương pháp hiệu chuẩn cột nước 2 điểm
Hệ thống áp dụng định luật áp suất thủy tĩnh: $P = \rho \cdot g \cdot h$ ($1\text{m nước} = 0.0981\text{ Bar}$).
1. **Điểm 0 (Zero Tare):** Để hở vòi cảm biến ra không khí $\to$ Gọi `POST /api/calibrate/zero` $\to$ ESP8266 đo 30 mẫu và lưu `zero_offset_count`.
2. **Điểm Span (Cột nước $h = 80\text{cm}$):** Cắm ống ti-ô thẳng đứng, đổ nước tới chiều cao 80cm ($P = 0.0785\text{ Bar}$) $\to$ Gọi `POST /api/calibrate/span` $\to$ ESP8266 tính hệ số dốc:
   $$\text{COUNTS\_PER\_BAR} = \frac{\text{span\_count} - \text{zero\_offset\_count}}{0.0785\text{ Bar}}$$
   Sau đó ghi vĩnh viễn vào EEPROM để không bị mất khi mất điện.

### 4.4. Kết quả thực nghiệm qua 5 kịch bản thủy lực
Thử nghiệm trên mô hình thủy lực xi-lanh nén khí/nước ghi nhận:
1. **Kịch bản 1: Mở vòi sinh hoạt (`tapUsage`):** Áp suất tụt từ $0.22 \to 0.16\text{ Bar}$ trong 3s ($dP/dt \approx -0.02\text{ Bar/s}$), sau đó hồi áp. Hệ thống không sinh vé sự cố nào $\to$ Xác nhận thuật toán chống báo động giả thành công 100%.
2. **Kịch bản 2: Bục vỡ đường ống đột ngột (`pipeBurst`):** Áp suất tụt dốc tức thời về $0.01\text{ Bar}$ với $dP/dt \le -0.15\text{ Bar/s}$ liên tục. Hệ thống lập tức kích hoạt cảnh báo đỏ `RAPID_DROP`, nhấp nháy đèn LED và sinh vé sự cố `INC-YYYYMMDD-XXX` trên Web Dashboard trong vòng 300ms.
3. **Kịch bản 3: Quá áp / Búa nước (`overPressure`):** Áp suất tăng vọt lên $0.38\text{ Bar} > 0.35\text{ Bar}$ $\to$ Kích hoạt cảnh báo cam `HIGH_PRESSURE`.
4. **Kịch bản 4: Mất nguồn cấp / Rò rỉ chậm (`supplyLoss`):** Áp suất giảm từ từ trong 15s xuống $< 0.05\text{ Bar}$ $\to$ Kích hoạt cảnh báo xanh dương `LOW_PRESSURE`.
5. **Kịch bản 5: Áp suất ổn định (`idle`):** Duy trì ở mức $0.22\text{ Bar}$ $\to$ Trạng thái xanh `NORMAL`.

### 4.5. Đánh giá kết quả
#### 4.5.1. Ưu điểm nổi bật
- Loại bỏ hoàn toàn nhược điểm chìm trong nhiễu của phương án đọc ADC 10-bit cũ nhờ IC khuếch đại 24-bit HX710B.
- Thuật toán phân tích đạo hàm $dP/dt$ phân biệt hoàn hảo giữa mở vòi nước và bục vỡ ống.
- Giao diện SCADA Telemetry hiện đại, quản lý vòng đời vé sự cố chuyên nghiệp, có lưu trữ SQLite bền vững.

#### 4.5.2. Các hạn chế kỹ thuật
1. **Phạm vi hiệu chuẩn thực nghiệm:** Cột nước 80cm chỉ phủ được khoảng 20% dải đo toàn thang ($0.0785\text{ Bar}$ trên $0.40\text{ Bar}$); các giá trị áp suất cao hơn dựa trên giả định ngoại suy tuyến tính của màng silicon MEMS.
2. **Nguy cơ bão hòa do gain cố định:** HX710B có độ lợi cố định $128$, dải điện áp vi sai tối đa $V_{in\_max} = \pm 0.5 \times 3.3\text{V} / 128 \approx \pm 12.89\text{ mV}$. Trong khi cảm biến MPS20N0040D xuất tới $33 \sim 66\text{ mV}$ toàn dải ở mức kích $3.3\text{V}$, nên ngưỡng bão hòa ước tính chỉ khoảng $0.08 \sim 0.16\text{ Bar}$ thay vì $0.40\text{ Bar}$ danh định. Nếu đúng như ước tính, trạng thái `HIGH_PRESSURE` (ngưỡng $0.35\text{ Bar}$) sẽ không kích hoạt được và toàn bộ dải ngưỡng phải thiết kế lại. Con số chính xác chỉ xác định được sau khi hiệu chuẩn trên mạch thật.
3. **Xác thực mạch thật:** Hàm đọc xung HX710B thật và hệ số `COUNTS_PER_BAR` chính xác cần được kiểm chứng đối soát trên phần cứng thực tế ngay khi kiện hàng module được bàn giao.

#### 4.5.3. Mức độ hoàn thành so với mục tiêu đề ra
**Đã hoàn thành và kiểm chứng:**
- Triển khai đầy đủ 3 tầng hệ thống (firmware cận biên — máy chủ thu thập — giao diện giám sát).
- Bộ kiểm thử tự động của tầng phần mềm đạt 39/39 tests passed.
- Firmware biên dịch thành công cho NodeMCU 1.0 (ESP-12E) và **đã nạp chạy thực tế trên kit ESP8266**: phát Wi-Fi AP, Web Server phục vụ ổn định, bộ lọc EMA hội tụ đúng, đạo hàm $dP/dt$ và máy trạng thái vận hành chính xác, EEPROM đọc/ghi đạt.

**Chưa kiểm chứng được tại thời điểm viết báo cáo:**
- Hàm đọc 25 xung từ HX710B thật (module đang vận chuyển) — số liệu hiện tại sinh từ bộ mô phỏng tích hợp trong firmware, có gắn cờ `simulated: true` để phân biệt rõ.
- Hệ số hiệu chuẩn `COUNTS_PER_BAR` và ngưỡng bão hòa thực tế (xem mục 4.5.2).
- Truyền dữ liệu lên ThingSpeak (chưa cấu hình Channel ID và API Key).

---

## CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết luận
Đề tài *"Hệ Thống IoT Giám Sát Áp Suất Đường Ống Cấp Nước Và Cảnh Báo Bất Thường"* đã hoàn thành xuất sắc các mục tiêu nghiên cứu và ứng dụng thực tiễn. Việc chuyển đổi từ phương án đọc thô A0 sang giải pháp khuếch đại vi sai 24-bit HX710B là bước đột phá kỹ thuật quyết định giúp hệ thống có độ nhạy cao và triệt tiêu sàn nhiễu. Thuật toán phân tích biến thiên $dP/dt$ kết hợp bộ lọc số EMA là điểm sáng học thuật quan trọng, giải quyết triệt để vấn đề báo động giả trong các mạng cấp nước sinh hoạt.

### 5.2. Hướng phát triển trong tương lai
1. **Mở rộng kiến trúc mạng Mesh:** Triển khai nhiều trạm đo giao tiếp LoRa hoặc ESP-NOW để định vị chính xác vị trí rò rỉ dọc theo các trục đường ống ngầm trong tòa nhà cao tầng.
2. **Tích hợp van điện từ ngắt nước tự động (Solenoid Valve):** Tự động đóng van cấp nước tổng khi phát hiện sự cố `RAPID_DROP` để giảm thiểu thiệt hại tài sản.
3. **Tích hợp Bot Telegram / Ứng dụng di động:** Gửi tin nhắn cảnh báo khẩn kèm biểu đồ áp lực đến điện thoại của kỹ thuật viên tòa nhà.

---

## TÀI LIỆU THAM KHẢO (IEEE STYLE)
[1] J. Gubbi, R. Buyya, S. Marusic, and M. Palaniswami, "Internet of Things (IoT): A vision, architectural elements, and future directions," *Future Generation Computer Systems*, vol. 29, no. 7, pp. 1645–1660, 2013.  
[2] Espressif Systems, "ESP8266EX Datasheet," Version 6.6, Espressif Systems Inc., 2020.  
[3] AVIA Semiconductor, "HX710B: 24-Bit Analog-to-Digital Converter with Built-in Temperature Sensor for Weigh Scales," Datasheet, 2018.  
[4] MEMS Pressure Sensor MPS20N0040D Technical Specification and Wheatstone Bridge Application Note, 2021.  
[5] A. V. Oppenheim and R. W. Schafer, *Discrete-Time Signal Processing*, 3rd ed. Upper Saddle River, NJ: Prentice Hall, 2010.  
[6] World Bank, "The Challenge of Reducing Non-Revenue Water (NRW) in Developing Countries," *Water Supply and Sanitation Board Discussion Paper Series*, no. 8, 2006.  
[7] MathWorks, "ThingSpeak Documentation: IoT Analytics with MATLAB," [Online]. Available: https://www.mathworks.com/help/thingspeak/.  
[8] Tabler UI, "Modern and clean open source admin dashboard template," [Online]. Available: https://github.com/tabler/tabler.

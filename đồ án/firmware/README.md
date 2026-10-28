# HƯỚNG DẪN VẬN HÀNH & NẠP FIRMWARE ESP8266 (WATER PRESSURE NODE)

Tài liệu hướng dẫn cấu hình, nạp firmware, thiết lập kênh ThingSpeak và hiệu chuẩn cảm biến thuộc đồ án: **Hệ Thống IoT Giám Sát Áp Suất Đường Ống Cấp Nước Và Cảnh Báo Bất Thường**.

---

## 1. Yêu Cầu Môi Trường (Arduino IDE)
1. Cài đặt **Arduino IDE** (phiên bản 2.x hoặc 1.8.x).
2. Cài đặt gói hỗ trợ vi điều khiển **ESP8266**:
   - Vào `File` $\to$ `Preferences`.
   - Tại ô **Additional Boards Manager URLs**, dán đường dẫn:  
     `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
   - Vào `Tools` $\to$ `Board` $\to$ `Boards Manager...`, tìm từ khóa `esp8266` và bấm **Install**.
3. Cài đặt Driver chip nạp **CH340** (nếu máy tính chưa nhận cổng COM khi cắm cáp USB Type-C).

---

## 2. Cấu Hình Nạp Trong Arduino IDE
- **Board:** `NodeMCU 1.0 (ESP-12E Module)`
- **Upload Speed:** `115200`
- **CPU Frequency:** `80 MHz` (hoặc `160 MHz`)
- **Flash Size:** `4MB (FS:2MB OTA:~1019KB)`
- **Port:** Chọn đúng cổng `COM` tương ứng của kit NodeMCU (kiểm tra trong Device Manager).

---

## 3. Sơ Đồ Nối Dây Phần Cứng Thực Tế (Module HX710B 24-bit)

Module HX710B đã hàn sẵn cảm biến MPS20N0040D-S, giao tiếp số qua 2 chân:
```text
  [Module HX710B + MPS20N0040D]           [Kit NodeMCU ESP8266]
  -----------------------------           ---------------------
  VCC / VDD                       ------> 3V3 (3.3V DC)
  GND                             ------> GND (G)
  DOUT (Data Out)                 ------> D2 (GPIO4)
  SCK  (Serial Clock)             ------> D1 (GPIO5)
```
*Lưu ý:* Tuyệt đối không cắm vào chân Analog A0 vì tín hiệu vi sai của cầu trở đã được HX710B khuếch đại (Gain 128) và chuyển đổi số 24-bit trước khi truyền sang ESP8266.

---

## 4. Chế Độ Thử Nghiệm: Cờ `SIMULATE_SENSOR`

Trong file `water_pressure_node.ino`:
```cpp
#define SIMULATE_SENSOR 1  // 1 = Bật giả lập trong firmware | 0 = Đọc phần cứng thật
```

### Khi nào dùng `SIMULATE_SENSOR = 1`?
- **Khi chưa có module phần cứng HX710B trong tay:** Bạn có thể nạp ngay vào kit NodeMCU có sẵn hôm nay.
- Firmware sẽ tự sinh dữ liệu theo 5 kịch bản thủy lực chuẩn hóa, kiểm chứng toàn bộ: Wi-Fi, Web Server, bộ lọc EMA, đạo hàm $dP/dt$, phát hiện bục vỡ ống và LED cảnh báo.
- **Dấu hiệu nhận biết:** Serial in banner cảnh báo mỗi 10 giây, Web Server hiện dải băng màu cam, đèn LED nháy đôi mỗi 2 giây.

### Chuẩn bị Demo & Bảo Vệ Đồ Án (QUAN TRỌNG):
- Khi module HX710B về và cắm vào mạch thật, **BẮT BUỘC** sửa dòng định nghĩa thành:
  ```cpp
  #define SIMULATE_SENSOR 0
  ```
  Sau đó nạp lại vào ESP8266 để hệ thống đọc giá trị đo thực tế từ cảm biến!

---

## 5. Kiểm Thử Khi Chưa Có Module HX710B

Đặt `#define SIMULATE_SENSOR 1` rồi nạp vào NodeMCU. Firmware sẽ tự sinh số liệu theo 5 kịch bản thủy lực, chạy qua **đúng** đường lọc EMA → đạo hàm `dP/dt` → máy trạng thái như dữ liệu thật.

Cách này kiểm chứng được: Wi-Fi AP, Web Server, lọc EMA, tính `dP/dt`, máy trạng thái 4 trạng thái, đèn LED, lưu/đọc EEPROM, uplink ThingSpeak.

**Không kiểm được:** hàm `hx710bRead()` đọc 25 xung — phần này chỉ xác nhận được khi cắm module HX710B thật.

> **Ghi chú:** đã cân nhắc mô phỏng trên Wokwi nhưng **không khả thi**. Trang
> https://docs.wokwi.com/getting-started/supported-hardware liệt kê các vi điều khiển
> được hỗ trợ gồm AVR, ESP32 và biến thể, STM32, RP2040/RP2350 — **không có ESP8266**.
> Wokwi có sẵn linh kiện `wokwi-hx711` nhưng không có board ESP8266 nào để ghép vào.

---

## 6. Hướng Dẫn Thiết Lập Kênh ThingSpeak (Chương 7 Đề Cương IoT)

Đề cương môn học Internet Vạn Vật yêu cầu lưu trữ và trực quan hóa dữ liệu trên máy chủ đám mây ThingSpeak.

### Các bước thiết lập:
1. Đăng ký tài khoản miễn phí tại: https://thingspeak.com
2. Tạo kênh mới (**New Channel**) với cấu hình 4 trường (Fields):
   - **Channel Name:** `HydroWatch - IoT Water Pressure`
   - **Field 1:** `Pressure (Bar)` — Áp suất đường ống
   - **Field 2:** `dP/dt (Bar/s)` — Tốc độ biến thiên áp suất
   - **Field 3:** `State Code` — Mã trạng thái (0: NORMAL, 1: HIGH, 2: LOW, 3: RAPID_DROP, 4: FAULT)
   - **Field 4:** `Raw Count 24-bit` — Giá trị số thô từ HX710B
3. Ghi nhận Channel ID: `[[ĐIỀN: Channel ID ]]`
4. Vào tab **API Keys**, sao chép chuỗi **Write API Key**.
5. Dán vào biến `THINGSPEAK_API_KEY` ở đầu file [water_pressure_node.ino](file:///d:/IOT/đồ án/firmware/water_pressure_node/water_pressure_node.ino):
   ```cpp
   const char* STA_SSID = "Tên_WiFi_Nhà_Bạn";
   const char* STA_PASS = "Mật_Khẩu_WiFi";
   const char* THINGSPEAK_API_KEY = "DÁN_KEY_VÀO_ĐÂY";
   ```
6. Khi kết nối Wi-Fi thành công, ESP8266 sẽ tự động gửi dữ liệu lên ThingSpeak mỗi 15 giây/lần.

---

## 7. Quy Trình Hiệu Chuẩn Cột Nước 2 Điểm & Lưu EEPROM

### Nguyên lý:
Áp suất cột nước thẳng đứng: $P = \rho \cdot g \cdot h = 1000 \cdot 9.81 \cdot \frac{h(\text{cm})}{100} \text{ (Pa)} = 0.0981 \cdot \frac{h(\text{cm})}{100} \text{ (Bar)}$.

| Chiều cao cột nước $h$ | Áp suất tương ứng (Bar) | Ghi chú |
| :---: | :---: | :--- |
| **50 cm** | $0.0491\text{ Bar}$ | Cột nước tối thiểu |
| **80 cm** | $0.0785\text{ Bar}$ | Mức chuẩn khuyên dùng trong phòng thí nghiệm |
| **100 cm (1 mét)** | $0.0981\text{ Bar}$ | Dễ đo bằng thước dây |
| **150 cm (1.5 mét)** | $0.1472\text{ Bar}$ | Độ chính xác cao nhất |

### Các bước thực hiện:
1. **Bước 1 (Hiệu chuẩn điểm 0 - Zero Tare):**
   - Để hở vòi cảm biến ra không khí.
   - Gửi yêu cầu HTTP POST:
     ```bash
     curl -X POST http://192.168.4.1/api/calibrate/zero
     ```
   - ESP8266 sẽ lấy trung bình 30 mẫu và lưu `zero_offset_count`.
2. **Bước 2 (Hiệu chuẩn điểm Span bằng cột nước):**
   - Cắm ống ti-ô vào vòi cảm biến, dựng thẳng đứng và đổ nước tới chiều cao $h$ (ví dụ 80 cm).
   - Gửi yêu cầu HTTP POST:
     ```bash
     curl -X POST http://192.168.4.1/api/calibrate/span -H "Content-Type: application/json" -d "{\"height_cm\": 80}"
     ```
   - ESP8266 sẽ tự động tính:
     $$\text{COUNTS\_PER\_BAR} = \frac{\text{span\_count} - \text{zero\_offset\_count}}{0.0981 \times (80 / 100)}$$
   - Thông số được ghi vĩnh viễn vào **EEPROM**, không bị mất khi mất điện hoặc khởi động lại.
3. **Kiểm tra thông số hiện tại:**
   ```bash
   curl http://192.168.4.1/api/calibrate
   ```

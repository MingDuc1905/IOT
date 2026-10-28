# HƯỚNG DẪN LẮP RÁP, NẠP FIRMWARE & HIỆU CHUẨN KHI MODULE HX710B VỀ

Tài liệu hướng dẫn thao tác thực nghiệm từng bước dành cho thành viên nhóm khi nhận được module **HX710B tích hợp sẵn cảm biến MPS20N0040D-S**.

---

## 1. SƠ ĐỒ ĐẤU NỐI DÂY 4 CHÂN CHUẨN

Module HX710B đã hàn sẵn cảm biến áp suất MPS20N0040D-S ở mặt trên, ngõ ra gồm 4 chân cắm chuẩn 2.54mm. Sử dụng 4 sợi dây cắm Testboard Đực - Cái (Male - Female) 20cm nối vào Kit NodeMCU Lua V3 ESP8266:

```text
  ┌───────────────────────────────┐                  ┌───────────────────────────────┐
  │ Module HX710B + MPS20N0040D-S │                  │      NodeMCU ESP8266 V3       │
  ├───────────────────────────────┤                  ├───────────────────────────────┤
  │ VCC / VDD (Nguồn 3.3V)        │ ───────────────> │ 3V3 (Chân nguồn 3.3V)         │
  │ GND (Nối đất)                 │ ───────────────> │ G / GND (Chân nối đất)        │
  │ DOUT (Dữ liệu 24-bit ra)      │ ───────────────> │ D2 (GPIO4 - Input)            │
  │ SCK / CLK (Xung clock vào)    │ ───────────────> │ D1 (GPIO5 - Output)           │
  └───────────────────────────────┘                  └───────────────────────────────┘
```

> **CẢNH BÁO:**
> 1. Cấp đúng nguồn `3V3`, **không cắm vào chân 5V / VIN** để tránh sốc áp làm hỏng ngõ vào logic của ESP8266.
> 2. Tuyệt đối **không cắm vào chân Analog A0** vì module HX710B đã chuyển đổi toàn bộ tín hiệu vi sai sang số 24-bit qua giao thức 2 dây DOUT/SCK.

---

## 2. CHUYỂN FIRMWARE SANG CHẾ ĐỘ PHẦN CỨNG THẬT & NẠP BOARD

### Bước 2.1: Chuyển cờ `SIMULATE_SENSOR` về `0`
Mở file `đồ án/firmware/water_pressure_node/water_pressure_node.ino`, tại dòng 53:
```cpp
// ĐỔI TỪ 1 THÀNH 0 ĐỂ ĐỌC CẢM BIẾN THẬT:
#define SIMULATE_SENSOR    0
```

### Bước 2.2: Lệnh nạp qua Arduino CLI (hoặc Arduino IDE)
1. Cắm cáp USB Type-C nối NodeMCU vào máy tính.
2. Kiểm tra cổng COM nhận diện:
   ```bash
   "C:\Program Files\Arduino CLI\arduino-cli.exe" board list
   ```
   *(Ví dụ phát hiện cổng `COM5` tương ứng chip nạp CH340).*
3. Biên dịch và nạp firmware:
   ```bash
   "C:\Program Files\Arduino CLI\arduino-cli.exe" compile --fqbn esp8266:esp8266:nodemcuv2 "D:\IOT\đồ án\firmware\water_pressure_node"
   "C:\Program Files\Arduino CLI\arduino-cli.exe" upload -p COM5 --fqbn esp8266:esp8266:nodemcuv2 "D:\IOT\đồ án\firmware\water_pressure_node"
   ```

---

## 3. KIỂM TRA TÍN HIỆU SỐNG (LIVE SIGNAL CHECK)

1. Mở Serial Monitor với tốc độ baud `115200`:
   ```bash
   "C:\Program Files\Arduino CLI\arduino-cli.exe" monitor -p COM5 -c baudrate=115200
   ```
2. **Hiện tượng bình thường:**
   - Dòng log in ra: `[DATA] Count: ... | V_diff: ... mV | P: ... Bar | Trạng thái: NORMAL`.
   - Dùng ngón tay bóp nhẹ vào đầu vòi cao su hoặc thổi nhẹ: Giá trị `Count` phải **tăng giảm tức thời**.
3. **Hiện tượng bất thường & Cách xử lý:**
   - Nếu xuất hiện cảnh báo `[CẢNH BÁO KHẨN] SENSOR_FAULT (Mất kết nối HX710B)`: Kiểm tra xem dây `DOUT` (D2) và `SCK` (D1) có bị cắm lộn cho nhau không.
   - Nếu giá trị `Count` đứng im không đổi: Kiểm tra lại tiếp xúc chân nguồn `3V3` và `GND`.

---

## 4. QUY TRÌNH HIỆU CHUẨN CỘT NƯỚC VẬT LÝ 2 ĐIỂM (LƯU EEPROM)

Cơ sở khoa học: Áp suất thủy tĩnh $P = \rho \cdot g \cdot h = 0.0981 \cdot \frac{h(\text{cm})}{100}\text{ (Bar)}$.

### Bảng tra áp suất tham chiếu chuẩn:
| Chiều cao cột nước $h$ | Áp suất thủy tĩnh tương ứng ($P_{\text{span}}$) | Mức độ phù hợp |
| :---: | :---: | :--- |
| **50 cm** | $0.0491\text{ Bar}$ | Mức tối thiểu cho phép |
| **80 cm** | **$0.0785\text{ Bar}$** | **Mức chuẩn khuyến nghị thực nghiệm** |
| **100 cm (1.0m)** | $0.0981\text{ Bar}$ | Đo dễ dàng bằng thước cuộn |
| **150 cm (1.5m)** | $0.1472\text{ Bar}$ | Độ chính xác cao nhất trong phòng lab |

### Các bước thực hiện hiệu chuẩn:
1. **Bước 1: Hiệu chuẩn điểm không (Zero Tare):**
   - Rút ống ti-ô ra khỏi vòi, để hở cảm biến hoàn toàn trong không khí tự nhiên.
   - Gửi yêu cầu Zero Tare:
     ```bash
     curl -X POST http://192.168.4.1/api/calibrate/zero
     ```
   - ESP8266 sẽ tự động đo 30 mẫu tĩnh và lưu `zero_offset_count`.
2. **Bước 2: Hiệu chuẩn điểm Span (với cột nước 80cm):**
   - Cắm ống ti-ô mềm trong suốt vào vòi cảm biến, dùng băng keo dán ống thẳng đứng theo mép tường hoặc thước dây.
   - Đổ nước sạch vào ống đến vạch đúng **80 cm**.
   - Gửi yêu cầu Span:
     ```bash
     curl -X POST http://192.168.4.1/api/calibrate/span -H "Content-Type: application/json" -d "{\"height_cm\": 80}"
     ```
   - ESP8266 tính toán hệ số $\text{COUNTS\_PER\_BAR} = \frac{\text{span\_count} - \text{zero\_offset\_count}}{0.0785}$ và **ghi vĩnh viễn vào EEPROM**.
3. **Bước 3: Kiểm tra thông số đã lưu:**
   ```bash
   curl http://192.168.4.1/api/calibrate
   ```
   Xác nhận trường `"calibrated": true` và giá trị `counts_per_bar` hợp lệ.

---

## 5. THỬ NGHIỆM ĐỐI SOÁT HIỆN TƯỢNG BÃO HÒA GAIN 128 (BẮT BUỘC)

### Vấn đề kỹ thuật:
- Chip HX710B có độ lợi khuếch đại cố định cực lớn ($\text{Gain} = 128$).
- Dải điện áp ngõ vào vi sai tối đa trước khi bão hòa (Full-scale differential input):
  $$V_{\text{in\_max}} = \pm \frac{0.5 \times V_{\text{REF}}}{128} \approx \pm \frac{1.65\text{V}}{128} \approx \pm 12.89\text{ mV}$$
- Trong khi đó, cảm biến MPS20N0040D khi đạt áp suất cực đại $40\text{ kPa}$ ($0.40\text{ Bar}$) xuất điện áp vi sai $50\text{ mV} \sim 100\text{ mV}$ (thông số datasheet ở mức kích thích $5\text{V}$; hạ nguồn kích xuống $3.3\text{V}$ thì tỉ lệ còn khoảng $33\text{ mV} \sim 66\text{ mV}$).

- **Ước lượng ngưỡng bão hòa** — lấy $12.89\text{ mV}$ chia cho độ nhạy toàn dải rồi nhân với $0.40\text{ Bar}$:

  | Độ nhạy toàn dải giả định | Ngưỡng bão hòa ước tính |
  | :--- | :--- |
  | $33\text{ mV}$ (kích $3.3\text{V}$, cận trên) | $\dfrac{12.89}{33} \times 0.40 \approx \mathbf{0.16\ Bar}$ |
  | $50\text{ mV}$ (datasheet, cận dưới) | $\dfrac{12.89}{50} \times 0.40 \approx \mathbf{0.10\ Bar}$ |
  | $66\text{ mV}$ (kích $3.3\text{V}$, cận dưới) | $\dfrac{12.89}{66} \times 0.40 \approx \mathbf{0.08\ Bar}$ |

  Vậy ngưỡng bão hòa **ước tính nằm trong khoảng $0.08 \sim 0.16\text{ Bar}$**.

> ⚠️ **ĐÂY CHỈ LÀ ƯỚC LƯỢNG LÝ THUYẾT.** Độ nhạy thực tế của từng con cảm biến sai lệch đáng kể so với datasheet, và module combo bán sẵn vẫn được dùng rộng rãi trong thực tế — nên con số thật chỉ biết được sau khi đo. **Bắt buộc chạy quy trình ở mục dưới để xác định ngưỡng thật.**

### ⚠️ CẢNH BÁO THIẾT KẾ — PHẢI XEM LẠI NGƯỠNG SAU KHI HIỆU CHUẨN

Nếu ngưỡng bão hòa thật rơi vào khoảng ước tính trên thì **thiết kế ngưỡng hiện tại không còn hợp lệ**:

| Thông số hiện tại | Giá trị | Hệ quả nếu bão hòa ở ~$0.15\text{ Bar}$ |
| :--- | :--- | :--- |
| `P_MIN_THRESH` | $0.05\text{ Bar}$ | Vẫn đo được, không ảnh hưởng |
| `P_MAX_THRESH` | $0.35\text{ Bar}$ | ❌ Nằm trên vùng bão hòa → **`HIGH_PRESSURE` không bao giờ kích hoạt được** |
| Mức nền 5 kịch bản mô phỏng | $0.22\text{ Bar}$ | ❌ Nằm trên vùng bão hòa → đồ thị kịch kim, $dP/dt \approx 0$, **`RAPID_DROP` cũng hỏng theo** |

**Sau khi có số đo bão hòa thật, bắt buộc rà lại và điều chỉnh đồng bộ ở 3 nơi:**
1. `đồ án/firmware/water_pressure_node/water_pressure_node.ino` — `P_MIN_THRESH`, `P_MAX_THRESH`, `DROP_THRESH`
2. `đồ án/web/server/config.js` — bộ ngưỡng mặc định phía server
3. `đồ án/web/server/services/simulator.js` — các mốc áp suất của 5 kịch bản

**Chưa đo xong thì CHƯA được sửa ngưỡng** — con số mới cũng chỉ là đoán tiếp.

### Quy trình kiểm tra thực nghiệm:
1. Nối ống ti-ô vào đầu xi-lanh y tế 50ml.
2. Đẩy pít-tông từ từ từ vạch 50ml xuống 40ml, 30ml, 20ml, 10ml để tăng dần áp lực.
3. Quan sát giá trị `Count` trên Serial Monitor:
   - **Nếu Count tăng đều đặn theo hành trình nén:** Mạch hoạt động hoàn hảo trong toàn dải đo.
   - **Nếu Count dừng lại ở giá trị tối đa (khoảng 8.388.607) và không tăng thêm dù tiếp tục nén:** Mạch đã chạm ngưỡng bão hòa.
4. **Ghi lại số đo vào bảng sau** (điền khi làm thật, không điền trước):

   | Vạch xi-lanh | Count đọc được | Áp suất quy đổi (Bar) | Còn tăng? |
   | :---: | :---: | :---: | :---: |
   | 50 ml | | | |
   | 40 ml | | | |
   | 30 ml | | | |
   | 20 ml | | | |
   | 10 ml | | | |

   **Ngưỡng bão hòa đo được: `[[ĐIỀN: ... Bar]]`**

5. **Biện pháp xử lý nếu bị bão hòa:**
   - Ghi nhận trung thực vào mục `4.5.2 Hạn chế kỹ thuật` của Báo cáo đồ án, theo mẫu: *Do độ lợi Gain 128 cố định của HX710B, dải đo tuyến tính thực tế của trạm đo là $0 \sim X\text{ Bar}$ thay vì $0 \sim 0.40\text{ Bar}$ theo danh định của cảm biến.*
   - **Thay số $X$ bằng giá trị đo thật, không dùng số ước lượng ở trên.**
   - Rà lại và điều chỉnh bộ ngưỡng ở 3 nơi đã liệt kê trong phần Cảnh báo thiết kế.
   - Nếu dải thực tế hẹp hơn dải sinh hoạt dân dụng ($0.05 \sim 0.25\text{ Bar}$) thì nêu rõ trong báo cáo rằng mô hình chỉ minh hoạ nguyên lý, chưa đáp ứng dải áp thực tế của mạng cấp nước — **không được tô hồng**.

---

## 6. CHẠY THỰC NGHIỆM 5 KỊCH BẢN & GHI HÌNH DEMO

Sử dụng xi-lanh nén khí để giả lập và ghi lại số liệu đo thực tế:
1. **Kịch bản 1 (Mở vòi nước sinh hoạt):** Rút nhẹ pít-tông để áp suất giảm nhẹ từ $0.22 \to 0.16\text{ Bar}$ trong 3s rồi giữ nguyên $\to$ Xác nhận Web Dashboard không báo động bục vỡ.
2. **Kịch bản 2 (Bục vỡ đường ống):** Kéo giật nhanh pít-tông về vị trí 0ml $\to$ Xác nhận còi/đèn LED bật sáng và Web Dashboard tự động sinh vé sự cố `RAPID_DROP`.
3. **Kịch bản 3 (Quá áp / Búa nước):** Nén mạnh pít-tông vượt ngưỡng $P_{\max} = 0.35\text{ Bar}$ $\to$ Xác nhận cảnh báo cam `HIGH_PRESSURE`.
4. **Kịch bản 4 (Mất nguồn cấp / Rò rỉ chậm):** Kéo từ từ pít-tông trong 15s xuống dưới $0.05\text{ Bar}$ $\to$ Xác nhận cảnh báo `LOW_PRESSURE`.
5. **Kịch bản 5 (Ổn định bình thường):** Giữ pít-tông ở mức $0.22\text{ Bar}$ $\to$ Trạng thái xanh `NORMAL`.

Chụp ảnh mô hình thực tế và quay video ngắn (~1 phút) ghi lại quá trình giật pít-tông và giao diện Web Dashboard phản ứng để lưu vào thư mục `đồ án/docs/` phục vụ buổi bảo vệ đồ án!

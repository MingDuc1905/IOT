# BẢNG THÔNG SỐ KỸ THUẬT & DANH MỤC LINH KIỆN (BOM PHẦN CỨNG)
**Dự Án:** Hệ thống IoT Giám sát Áp suất và Cảnh báo Bất thường  
**Môn học:** Internet Vạn Vật (IoT)  
**Cập nhật lần cuối:** 2026-10-25  

---

## 1. BẢNG TỔNG HỢP LINH KIỆN THỰC TẾ

| STT | Tên Linh Kiện | Model / Thông Số Kỹ Thuật | Số Lượng | Trạng Thái | Vai Trò Trong Đồ Án |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | Kit Vi điều khiển | **NodeMCU Lua V3 ESP8266 (CH340, USB Type-C)** | 1 | Đã có | Khối xử lý trung tâm (Edge Processing), chạy thuật toán EMA + $dP/dt$, phát Wi-Fi / Web Server. |
| **2** | Cảm biến áp suất rời | **MPS20N0040D-D (DIP 6 chân, có vòi hơi)** | 1 | Đã có | Dải $0 \sim 40\text{ kPa}$ ($0 \sim 0.4\text{ Bar}$). Cầu trở Wheatstone. Đóng vai trò linh kiện dự phòng/đối chứng. |
| **3** | Mạch ADC & Cảm biến hàn sẵn | **Module HX710B + MPS20N0040D-S (24-bit ADC)** | 1 | Bắt buộc — Đang vận chuyển | Khuếch đại tín hiệu vi sai mili-vôn ($0 \sim 50\text{mV}$) với Gain cố định 128 sang số 24-bit, giao tiếp số qua `DOUT` (D2) và `SCK` (D1). |
| **4** | Gói điện trở cắm | **Gói trở 100 con (0Ω – 680Ω)** | 1 gói | Đã có | Dự phòng thực nghiệm (không dùng cho mạch cảm biến này vì HX710B đọc trực tiếp cầu vi sai, không cần phân áp). |
| **5** | Dây cắm mạch | **Dây cắm Testboard Đực - Cái (Male - Female) 20cm** | 40 sợi | Đã có | Kết nối giữa NodeMCU và module HX710B / Breadboard. |
| **6** | Mô hình cơ khí áp lực | **Xi-lanh y tế (50ml – 100ml) + Ống dẫn mềm ti-ô** | 1 bộ | Đã có / Mua ngoài | Giả lập áp suất nén khí/chất lỏng trong đường ống kín, mô phỏng các trạng thái vận hành và hiệu chuẩn cột nước. |
| **7** | Dây nạp & cấp nguồn | **Cáp USB Type-C** | 1 | Đã có | Cấp nguồn 5V DC và nạp firmware từ máy tính vào NodeMCU ESP8266. |

---

## 2. CHI TIẾT SƠ ĐỒ CHÂN CẢM BIẾN ÁP SUẤT MPS20N0040D (DIP-6)

### 2.1. Cấu Trúc Chân & Cầu Trở Wheatstone
Nhìn từ mặt trên (Top View, có vòi nhô lên, dấu chấm chỉ chân số 1):
```text
           [Vòi Hơi Cảm Biến]
           ┌──────────────┐
  (1) VCC  │ ●  1      6  │  NC (6)
  (2) GND  │    2      5  │  VOUT- (5)
 (3) VOUT+ │    3      4  │  NC / Pin nội bộ (4)
           └──────────────┘
```

- **Chân 1 (VCC / V+):** Cấp nguồn kích thích cầu trở ($3.3\text{V} \sim 5\text{V}$ DC). Nối chân `3V3` hoặc `E+` của HX710B.
- **Chân 2 (GND / V-):** Chân nối đất. Nối chân `GND` hoặc `E-` của HX710B.
- **Chân 3 (VOUT+):** Tín hiệu ngõ ra cực dương của cầu trở ($A+$ / $IN+$).
- **Chân 4 (NC):** Không nối.
- **Chân 5 (VOUT-):** Tín hiệu ngõ ra cực âm của cầu trở ($A-$ / $IN-$).
- **Chân 6 (NC):** Không nối.

### 2.2. Đặc Tính Tín Hiệu & Trở Kháng
- Trở kháng ngõ vào / ngõ ra: $4\text{ k}\Omega \sim 6\text{ k}\Omega$.
- Điện áp ngõ ra vi sai toàn dải (Full Scale): $\Delta V = VOUT+ - VOUT- \approx 50\text{mV} \sim 100\text{mV}$ khi ở $40\text{ kPa}$ (0.4 Bar).
- Khi không có áp suất (0 kPa): $VOUT+ \approx VOUT- \approx \frac{VCC}{2}$ (khoảng $1.65\text{V}$).

---

## 3. ĐỐI CHIẾU PHƯƠNG ÁN ĐẤU NỐI VÀO ESP8266

### 3.1. Phương Án A (ĐÃ THỬ NGHIỆM — THẤT BẠI KỸ THUẬT)
- **Đấu nối thử nghiệm:** Nối trực tiếp $VOUT+$ vào chân `A0` của ESP8266.
- **Phân tích nguyên nhân thất bại:**
  - Ngõ ra toàn dải của cảm biến chỉ khoảng $50\text{ mV}$.
  - NodeMCU V3 có mạch phân áp đầu vào $0 \sim 3.3\text{V} \to 0 \sim 1.0\text{V}$ cấp cho ADC 10-bit nội.
  - Độ phân giải tương đương: $3.3\text{V} / 1023 \approx 3.22\text{ mV/count}$.
  - Toàn bộ dải làm việc $0 \sim 0.40\text{ Bar}$ chỉ trải dài trên: $50\text{ mV} / 3.22\text{ mV} \approx 15\text{ counts}$ ($\approx 0.026\text{ Bar/count}$).
  - Ngưỡng áp suất thấp $P_{\min} = 0.05\text{ Bar}$ chỉ cách điểm không **vỏn vẹn 2 counts**, trong khi mức nhiễu ngẫu nhiên của ADC ESP8266 thường dao động $\pm 2 \sim 4\text{ counts}$.
  - **Kết luận:** Tín hiệu bị chìm hoàn toàn dưới sàn nhiễu, thuật toán đạo hàm $dP/dt$ chỉ đo được nhiễu, không thể phân biệt bục vỡ ống. Phương án A bị loại bỏ hoàn toàn.

### 3.2. Phương Án B (CHUẨN ĐỒ ÁN CHÍNH THỨC — MODULE HX710B 24-BIT)
Module HX710B khuếch đại vi sai với độ lợi Gain cố định 128 và chuyển đổi sang tín hiệu số 24-bit:
```text
  [Cảm Biến MPS20N0040D]         [Module HX710B 24-bit]          [NodeMCU ESP8266]
  ----------------------         ----------------------          -----------------
  Chân 1 (VCC)           ------> VCC / E+                        3V3
  Chân 2 (GND)           ------> GND / E-                        GND
  Chân 3 (VOUT+)         ------> A+ / IN+
  Chân 5 (VOUT-)         ------> A- / IN-
                                 DOUT (Data)             ------> D2 (GPIO4)
                                 SCK  (Clock)            ------> D1 (GPIO5)
```
- **Ưu điểm vượt trội:**
  1. Gain 128 nâng biên độ $50\text{ mV}$ lên $6.4\text{V}$ (bão hòa nội bộ theo dải tham chiếu), cho ra hàng triệu count phân giải.
  2. Tốc độ lấy mẫu cố định 10 Hz (100ms/chu kỳ chuyển đổi), khớp chính xác với chu kỳ lấy mẫu 100ms của firmware.
  3. Giao tiếp số 2 dây loại bỏ hoàn toàn sai số đường truyền và suy hao điện áp.

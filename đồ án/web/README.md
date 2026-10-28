# HydroWatch V2 &mdash; Web Dashboard &amp; Backend Quản Trị Sự Cố Áp Suất Nước IoT

Hệ thống Web Dashboard thời gian thực và máy chủ thu thập dữ liệu (Collector) thuộc đồ án: **Hệ Thống IoT Giám Sát Áp Suất Đường Ống Cấp Nước Và Cảnh Báo Bất Thường**.

---

## 🏗️ 1. Kiến Trúc Hệ Thống 3 Tầng (Three-Tier Architecture)

```text
┌────────────────────────┐      HTTP GET /api/data      ┌───────────────────────────────────┐
│  Trạm Đo Cận Biên      │ ◄────────── poll 500ms ───────│  Máy Chủ Thu Thập (Backend Node)   │
│  ESP8266 + MPS20N0040D │                               │  (Node.js v24 + Express 5)        │
│  Lọc EMA + dP/dt       │                               │  ├─ Poller Service                │
└────────────────────────┘                               │  ├─ Classifier (Đối chiếu cận biên)│
            ▲                                            │  ├─ Incident Lifecycle Service    │
            │                                            │  ├─ Physical Simulator (5 kịch bản)│
┌────────────────────────┐                               │  └─ SQLite File (hydrowatch.db)   │
│  Mô Hình Xi-lanh Nén   │                               └─────────────────┬─────────────────┘
│  Khí / Nước An Toàn   │                                                  │
└────────────────────────┘                                      REST + SSE │ (/stream)
                                                                           ▼
                                                         ┌───────────────────────────────────┐
                                                         │  Giao Diện Điều Hành (Frontend)   │
                                                         │  React 19 + Vite + Tabler Core    │
                                                         │  Dark Mode chuẩn SCADA Telemetry  │
                                                         └───────────────────────────────────┘
```

### Điểm nổi bật về kiến trúc:
1. **Thu thập dữ liệu liên tục & Bền vững:** Backend Express đóng vai trò Collector độc lập, tự động lưu dữ liệu vào SQLite (`hydrowatch.db`). Dữ liệu và vé sự cố được bảo toàn nguyên vẹn ngay cả khi người dùng đóng trình duyệt hoặc tải lại trang (F5).
2. **Loại trừ lỗi CORS & Trực tiếp:** Toàn bộ liên lạc tới vi điều khiển ESP8266 đi qua Backend Collector, tránh lỗi mixed-content và chặn CORS của trình duyệt.
3. **Cơ chế đối chiếu cận biên (Edge vs Server Redundancy):** Thuật toán phân loại 4 trạng thái (`NORMAL`, `HIGH_PRESSURE`, `LOW_PRESSURE`, `RAPID_DROP`) chạy đồng thời ở cả Firmware ESP8266 và Backend. Nếu có sự sai lệch giữa hai bên, hệ thống đánh dấu viền vàng cảnh báo trên bảng nhật ký.
4. **Server-Sent Events (SSE):** Cập nhật đồ thị và chỉ số áp suất tức thời qua kết nối `/stream`, tiết kiệm băng thông và giảm tải cho vi điều khiển.
5. **Mô phỏng vật lý chân thực (Simulator):** Tích hợp sẵn 5 kịch bản thủy lực pít-tông nén khí, tính toán ngược ra điện áp mili-vôn và giá trị ADC 10-bit thực tế của ESP8266.

---

## 🚀 2. Hướng Dẫn Vận Hành (1 Lệnh Duy Nhất)

### Cài đặt thư viện:
```bash
cd "d:\IOT\đồ án\web"
npm install
```

### Chạy hệ thống (Chạy đồng thời Backend :4000 và Frontend :5173):
```bash
npm run dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)
- **Kiểm tra trạng thái kết nối:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

### Chạy kiểm thử tự động (TDD Unit & Integration Tests):
```bash
npm test
```

### Kiểm tra cú pháp & Build ứng dụng:
```bash
npm run lint
npm run build
```

---

## 📡 3. Bảng Đặc Tả REST API & SSE Endpoints

| Phương thức | Endpoint | Chức năng |
| :---: | :--- | :--- |
| `GET` | `/api/live?node_id=NODE-01` | Lấy mẫu đo mới nhất và 120 điểm lịch sử gần nhất phục vụ vẽ đồ thị Chart.js ban đầu. |
| `GET` | `/stream` | Luồng Server-Sent Events (SSE) đẩy mẫu đo (`sample`), sự cố mới (`incident`) và trạng thái (`status`). |
| `GET` | `/api/incidents?status=&node_id=` | Lấy danh sách phiếu sự cố đường ống. |
| `PATCH` | `/api/incidents/:ticket_id` | Cập nhật tiến trình: `PENDING` $\to$ `INVESTIGATING` $\to$ `RESOLVED`. Yêu cầu ghi rõ biện pháp khắc phục. |
| `GET` | `/api/incidents/export.csv` | Xuất danh sách sự cố ra file CSV chuẩn RFC 4180 có UTF-8 BOM cho Excel tiếng Việt. |
| `GET` | `/api/logs?limit=100&offset=0` | Lấy danh sách nhật ký đo đạc phân trang server-side, lọc theo trạng thái và thời gian. |
| `DELETE`| `/api/logs?node_id=` | Xóa nhật ký đo (có xác nhận modal trên giao diện). |
| `GET` | `/api/logs/export.csv` | Xuất toàn bộ nhật ký telemetry ra file CSV. |
| `GET/PUT`| `/api/settings` | Đọc và cấu hình tham số hệ thống: địa chỉ ESP8266, chu kỳ đọc và các ngưỡng cảnh báo. |
| `GET` | `/api/health` | Kiểm tra kết nối ESP8266, trạng thái SQLite, thời gian hoạt động. |
| `POST` | `/api/sim`, `/api/sim/stop` | Bật/tắt 5 kịch bản mô phỏng thuyết trình. |

---

## 🧪 4. Danh Sách 5 Kịch Bản Mô Phỏng Thuyết Trình

Khi không có sẵn mạch phần cứng ESP8266, giảng viên hoặc sinh viên có thể chuyển sang chế độ mô phỏng trực tiếp tại tab **Cấu hình**:

1. **Kịch bản 1: Mở vòi nước sinh hoạt (`tapUsage`)**
   - *Hành vi:* Áp suất giảm nhẹ từ $0.22\text{ Bar} \to 0.16\text{ Bar}$ trong 3s ($dP/dt \approx -0.02\text{ Bar/s}$), sau đó ổn định và hồi áp.
   - *Kết quả:* Không kích hoạt cảnh báo, **không sinh vé sự cố nào** (chứng minh thuật toán chống báo động giả thành công).
2. **Kịch bản 2: Bục vỡ đường ống đột ngột (`pipeBurst`)**
   - *Hành vi:* Pít-tông rút nhanh, áp suất tụt dốc liên tục về $0.01\text{ Bar}$ với $dP/dt \le -0.08\text{ Bar/s}$ liên tục.
   - *Kết quả:* Kích hoạt cảnh báo đỏ `RAPID_DROP`, tự động sinh mã vé sự cố `INC-YYYYMMDD-XXX` trên bảng sự cố.
3. **Kịch bản 3: Quá áp / Búa nước (`overPressure`)**
   - *Hành vi:* Áp lực nén tăng vọt lên $0.38\text{ Bar} > 0.35\text{ Bar}$ ($P_{\max}$).
   - *Kết quả:* Kích hoạt cảnh báo cam `HIGH_PRESSURE`.
4. **Kịch bản 4: Mất nguồn cấp / Rò rỉ chậm (`supplyLoss`)**
   - *Hành vi:* Áp suất giảm từ từ trong 15 giây xuống dưới $0.05\text{ Bar}$ ($P_{\min}$).
   - *Kết quả:* Kích hoạt cảnh báo xanh dương `LOW_PRESSURE`.
5. **Trạng thái ổn định (`idle`):** Duy trì áp suất chuẩn $0.22\text{ Bar}$ với nhiễu ngẫu nhiên Gauss nhẹ.

---

## 🎨 5. Quy Chuẩn Giao Diện Tabler (Lưu Ý Kỹ Thuật)

Giao diện được xây dựng bám sát 100% mẫu chính thức `tabler_official/preview/pages/uptime.astro`:
- **Chế độ tối (Dark Mode):** Cấu hình `data-bs-theme="dark"` trực tiếp trên thẻ `<html>` trong `index.html`.
- **Hệ màu Tabler Tokens:** Toàn bộ badge sử dụng biến thể nhạt chính thức của Tabler Palette (`bg-red-lt`, `bg-orange-lt`, `bg-green-lt`, `bg-azure-lt`, `bg-blue-lt`). Tuyệt đối không dùng class Bootstrap `-subtle` (đã kiểm chứng bằng script tự động).
- **Phản hồi di động (Responsive):** Bảng dữ liệu ứng dụng `table-mobile-md` kết hợp thuộc tính `data-label` trên từng thẻ `<td>`, tự động xếp hàng dọc trên màn hình điện thoại 375px mà không bị cuộn ngang.

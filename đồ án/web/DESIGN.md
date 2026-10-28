# Design System: Tabler IoT HydroWatch Dashboard

## 1. Visual Theme & Atmosphere
- **Phong cách:** Industrial IoT Telemetry & Control Cockpit (Density 7/10, Variance 5/10, Motion 5/10).
- **Không gian thị giác:** Giao diện tối màu chuyên nghiệp (Deep Dark Slate), tương phản cao nhưng không chói mắt, lấy cảm hứng từ các trạm điều hành SCADA và trung tâm giám sát mạng lưới cấp thoát nước đô thị.
- **Trải nghiệm:** Bố cục dạng thẻ (Cards) vững chắc, đường viền mảnh (1px), không đổ bóng neon lòe loẹt, hiển thị dữ liệu áp lực nước chân thực và đáng tin cậy.

## 2. Color Palette & Roles (Tabler Official Tokens)
- **Canvas Base Dark** (`#0f172a` / `#182433`) &mdash; Bề mặt nền chính của ứng dụng.
- **Surface Card Dark** (`#1a2234` / `#1e293b`) &mdash; Bề mặt nền của tất cả các thẻ KPI, bảng biểu và modal.
- **Card Border Subtitle** (`rgba(255, 255, 255, 0.08)`) &mdash; Đường viền phân cách cấu trúc 1px chuẩn Tabler.
- **Primary Blue Accent** (`#206bc4`) &mdash; Màu nhận diện chính, áp suất hiện tại, nút hành động chính (Primary CTA).
- **Success Emerald** (`#2fb344`) &mdash; Trạng thái bình thường (`NORMAL`), chỉ số an toàn, phiếu đã giải quyết (`RESOLVED`).
- **Danger Rose/Red** (`#d63939`) &mdash; Cảnh báo bục vỡ đường ống (`RAPID_DROP`), phiếu sự cố chờ tiếp nhận (`PENDING`), nút xóa.
- **Warning Amber/Orange** (`#f76707`) &mdash; Cảnh báo quá áp (`HIGH_PRESSURE`), tiến trình đang kiểm tra (`INVESTIGATING`).
- **Azure Info** (`#4299e1`) &mdash; Cảnh báo mất áp (`LOW_PRESSURE`), thông tin trạm đo.
- **Muted Steel** (`#6c7a91`) &mdash; Nhãn phụ (`subheader`), metadata, đơn vị đo.
- **Text Primary Light** (`#ffffff` / `#f8fafc`) &mdash; Tiêu đề, số liệu chính.

## 3. Typography Rules
- **Font chữ chính:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` (Bộ font chuẩn mực của Tabler Core).
- **Scale tỷ lệ phân cấp:**
  - `page-title`: 1.5rem (24px), font-weight 700, màu trắng.
  - `page-pretitle`: 0.625rem (10px), font-weight 700, tracking-wider, in hoa, màu xám phụ (`text-secondary`).
  - `h1`: 1.75rem (28px), font-weight 800, số liệu áp suất.
  - `subheader`: 0.75rem (12px), font-weight 700, tracking-wider, in hoa.
  - `card-title`: 1.0rem (16px), font-weight 600.
  - `body / table`: 0.875rem (14px), font-weight 400 - 500.
  - `monospace`: `SFMono-Regular, Menlo, Monaco, Consolas, monospace` cho địa chỉ IP, giá trị ADC và mã vé sự cố `INC-YYYYMMDD-XXX`.

## 4. Component Stylings (Tabler Native Specs)
- **Top Navbar:**
  - Lớp: `navbar navbar-expand-md navbar-dark d-print-none sticky-top`.
  - Thương hiệu: Biểu tượng giọt nước trong `avatar avatar-sm bg-blue-lt` + huy hiệu `badge bg-blue`.
  - Menu: Các thẻ `nav-link` có icon 18px và title, tab đang chọn có gạch chân hoặc `active`.
  - Trạng thái kết nối: `status-dot status-dot-animated bg-green` nhấp nháy chu kỳ 1.5s khi online.
- **Metric Cards (KPIs):**
  - Khung: `card card-sm`, bo góc `border-radius: 4px`, viền `1px solid rgba(255,255,255,0.08)`.
  - Thanh trạng thái màu trên đỉnh thẻ: `card-status-top bg-blue`, `bg-cyan`, `bg-green`, `bg-red`.
  - Khối Avatar: `avatar avatar-md bg-blue-lt`, `bg-cyan-lt`, `bg-green-lt`, `bg-red-lt` chứa icon Tabler 28px.
  - Chỉ số: `h1 mb-0 fw-bold` đi kèm đơn vị `fs-4 text-secondary`.
- **Chart Card:**
  - Đồ thị thời gian thực 2 trục Y (Trái: Áp suất 0 - 0.45 Bar, Phải: dP/dt -0.25 - +0.25 Bar/s).
  - Vùng diện tích áp suất phủ màu gradient nhẹ (`rgba(32, 107, 196, 0.15)` xuống `0.02`), đường dP/dt nét đứt đỏ cảnh báo.
- **Incident & Logs Data Tables:**
  - Lớp: `table table-vcenter card-table table-hover table-striped text-nowrap`.
  - Header: Chữ in hoa, nền tối nhẹ, viền phân cách 1px.
  - Badges trạng thái: `badge bg-danger-subtle text-danger`, `badge bg-warning-subtle text-warning`, `badge bg-success-subtle text-success`.
  - Thao tác: Nút bấm nhỏ `btn btn-outline-primary btn-sm` mở modal cập nhật.
- **Modal Popup:**
  - Lớp: `modal modal-blur fade show` kết hợp `backdrop-filter: blur(4px)`.
  - Form: `form-label` phía trên, `form-control` hoặc `form-select` có focus ring xanh Tabler `border-color: #206bc4`.

## 5. Anti-Patterns (Bị Nghiêm Cấm Tuyệt Đối)
- CẤM sử dụng màu đen thuần (`#000000`).
- CẤM các hiệu ứng đổ bóng phát sáng neon tím/hồng kiểu AI sci-fi rẻ tiền.
- CẤM đặt tên class CSS tùy tiện, ad-hoc ngoài chuẩn Tabler.
- CẤM số liệu giả lập bịa đặt không có ý nghĩa vật lý (Áp suất phải nằm trong dải thực tế $0 \sim 0.4\text{ Bar}$ của cảm biến MPS20N0040D).
- CẤM làm hỏng tính năng phản hồi trên thiết bị di động (Responsive).

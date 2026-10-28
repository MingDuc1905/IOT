/**
 * =========================================================================================
 * ĐỒ ÁN MÔN HỌC: INTERNET VẠN VẬT (IoT)
 * ĐỀ TÀI: HỆ THỐNG IOT GIÁM SÁT ÁP SUẤT ĐƯỜNG ỐNG CẤP NƯỚC VÀ CẢNH BÁO BẤT THƯỜNG
 * =========================================================================================
 * Vi điều khiển: NodeMCU Lua V3 ESP8266 (CH340 - USB Type-C)
 * Cảm biến: Cầu trở Wheatstone MPS20N0040D (0 ~ 40 kPa = 0 ~ 0.4 Bar)
 * Mạch khuếch đại & ADC: HX710B 24-bit chuyên dụng (Gain 128, giao tiếp số 25 xung 10 Hz)
 * Thuật toán: Lọc số EMA (alpha=0.25) + Đạo hàm dP/dt phát hiện bục vỡ ống
 * Lưu trữ: EEPROM lưu trữ thông số hiệu chuẩn cột nước 2 điểm
 * Đám mây: Uplink ThingSpeak thời gian thực (đáp ứng Chương 7 đề cương môn học IoT)
 * Web Server: Tích hợp REST API, SSE telemetry và Dashboard trực tiếp trên chip
 * =========================================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <EEPROM.h>

// -----------------------------------------------------------------------------------------
// 1. CẤU HÌNH HỆ THỐNG & ĐỊNH DANH TRẠM ĐO (NODE CONFIGURATION)
// -----------------------------------------------------------------------------------------
const char* NODE_ID        = "NODE-01";
const char* AP_SSID        = "ESP8266_WATER_MONITOR";
const char* AP_PASS        = "12345678";   // Mật khẩu Wi-Fi Access Point

// Cấu hình Wi-Fi trạm Client (STA) để kết nối Internet và gửi dữ liệu lên ThingSpeak
const char* STA_SSID       = "";           // Để trống nếu dùng chế độ Access Point
const char* STA_PASS       = "";

// Cấu hình Uplink ThingSpeak (Chương 7 đề cương môn học IoT)
// Để trống mặc định; firmware sẽ tự động bỏ qua nếu chưa cấu hình Write API Key
const char* THINGSPEAK_API_KEY = "";
const unsigned long THINGSPEAK_INTERVAL = 15000; // 15 giây/lần (Free tier rate limit)

ESP8266WebServer server(80);

// -----------------------------------------------------------------------------------------
// 2. CHÂN PHẦN CỨNG & CỜ THỬ NGHIỆM
// -----------------------------------------------------------------------------------------
#define PIN_HX_DOUT        D2              // GPIO4 - Chân nhận dữ liệu 24-bit từ HX710B
#define PIN_HX_SCK         D1              // GPIO5 - Chân phát xung clock điều khiển HX710B
#define PIN_LED            LED_BUILTIN     // GPIO2 trên NodeMCU (Active LOW)

/**
 * CỜ KIỂM THỬ KHI CHƯA CẮM MẠCH HX710B:
 * 1 = BẬT bộ sinh số giả lập trong firmware (test trực tiếp trên NodeMCU thật)
 * 0 = ĐỌC phần cứng thật qua chuỗi 25 xung HX710B
 * LƯU Ý: Khi nộp đồ án hoặc bảo vệ chính thức, đặt cờ này về 0!
 */
#define SIMULATE_SENSOR    0
const bool IS_SIMULATED    = (SIMULATE_SENSOR != 0);

// -----------------------------------------------------------------------------------------
// 3. THÔNG SỐ VẬT LÝ & NGƯỠNG CẢNH BÁO
// -----------------------------------------------------------------------------------------
const float P_SENSOR_MAX   = 0.40f;        // Đơn vị: Bar (40 kPa)
const float P_MIN_THRESH   = 0.05f;        // Ngưỡng áp suất thấp (Bar) - rò rỉ / mất nguồn
const float P_MAX_THRESH   = 0.35f;        // Ngưỡng áp suất cao (Bar) - quá áp / búa nước
const float DROP_THRESH    = -0.08f;       // Tốc độ tụt dốc kích hoạt cảnh báo vỡ (Bar/giây)
const float EMA_ALPHA      = 0.25f;        // Hệ số lọc số Exponential Moving Average

// Ước lượng lý thuyết counts/Bar dùng khi mô phỏng hoặc trước khi hiệu chuẩn cột nước
const float THEORETICAL_COUNTS_PER_BAR = 5000000.0f; // ~2.000.000 counts trên dải 0.40 Bar

// -----------------------------------------------------------------------------------------
// 4. MÁY TRẠNG THÁI HỆ THỐNG (STATE MACHINE)
// -----------------------------------------------------------------------------------------
enum SystemState {
  STATE_NORMAL = 0,
  STATE_HIGH_PRESSURE,
  STATE_LOW_PRESSURE,
  STATE_RAPID_DROP,
  STATE_SENSOR_FAULT
};

const char* StateNames[] = {
  "NORMAL",
  "HIGH_PRESSURE",
  "LOW_PRESSURE",
  "RAPID_DROP",
  "SENSOR_FAULT"
};

// -----------------------------------------------------------------------------------------
// 5. CẤU TRÚC EEPROM LƯU THÔNG SỐ HIỆU CHUẨN
// -----------------------------------------------------------------------------------------
#define EEPROM_SIZE        64
#define EEPROM_MAGIC       0x48583731      // Mã nhận diện dữ liệu hợp lệ: 'HX71'

struct CalibrationData {
  uint32_t magic;
  int32_t  zero_offset;
  float    counts_per_bar;
  uint32_t calib_timestamp;
};

// -----------------------------------------------------------------------------------------
// 6. BIẾN TOÀN CỤC & BỘ NHỚ LỊCH SỬ ĐẠO HÀM (dP/dt)
// -----------------------------------------------------------------------------------------
int32_t raw_count           = 0;           // Giá trị nguyên 24-bit bù hai
float   diff_mv             = 0.0f;        // Điện áp vi sai quy đổi ước tính (mV)
int32_t zero_offset_count   = 0;           // Điểm không (Zero Tare)
float   COUNTS_PER_BAR      = 0.0f;        // Hệ số dốc hiệu chuẩn (0.0f = chưa hiệu chuẩn)
bool    is_calibrated       = false;
bool    sensor_ok           = true;
int     hx_error_count      = 0;           // Đếm số chu kỳ mất tín hiệu DOUT

float   pressure_raw        = 0.0f;        // Bar (trước lọc)
float   pressure_filtered   = 0.0f;        // Bar (sau lọc EMA)
float   dp_dt               = 0.0f;        // Bar / giây
SystemState current_state   = STATE_NORMAL;

#define HIST_SIZE           10             // Bộ đệm 10 mẫu (10 x 100ms = 1.0 giây)
float   pressure_history[HIST_SIZE];
int     hist_idx            = 0;
bool    hist_filled         = false;
int     rapid_drop_counter  = 0;

unsigned long last_sample_time     = 0;
unsigned long last_report_time     = 0;
unsigned long last_thingspeak_time = 0;
unsigned long last_calib_warn_time = 0;
unsigned long last_sim_warn_time   = 0;
const unsigned long SAMPLE_INTERVAL = 100; // 100ms (10 Hz khớp chuẩn HX710B)
const unsigned long REPORT_INTERVAL = 500;

unsigned long incident_count       = 0;
char last_incident_time[32]        = "Chưa ghi nhận";
char last_incident_type[32]        = "NONE";
unsigned long thingspeak_fail_count = 0;

// Khai báo trước các hàm
void evaluateSystemState();
void triggerIncident(const char* type);
void evaluateLedPattern();

// -----------------------------------------------------------------------------------------
// 7. BỘ GIẢ LẬP FIRMWARE (DÙNG KHI SIMULATE_SENSOR = 1)
// -----------------------------------------------------------------------------------------
struct SimStep {
  const char* phase;
  float from;
  float to;
  float seconds;
};

// 5 Kịch bản chuẩn hóa khớp 100% với Backend simulator.js
char active_sim_scenario[24] = "idle";
unsigned long sim_scenario_start_time = 0;
int sim_step_idx = 0;
unsigned long sim_step_start_time = 0;
float sim_base_pressure = 0.22f;

void startSimScenario(const char* name) {
  strncpy(active_sim_scenario, name, sizeof(active_sim_scenario) - 1);
  sim_scenario_start_time = millis();
  sim_step_start_time = millis();
  sim_step_idx = 0;
  Serial.print(F("[SIM-FW] Kích hoạt kịch bản: "));
  Serial.println(name);
}

void stopSimScenario() {
  strncpy(active_sim_scenario, "idle", sizeof(active_sim_scenario) - 1);
  sim_step_idx = 0;
  sim_base_pressure = 0.22f;
  Serial.println(F("[SIM-FW] Dừng kịch bản, quay về trạng thái idle"));
}

bool simulatedRead(int32_t &out) {
  unsigned long now = millis();
  float elapsed_step_sec = (now - sim_step_start_time) / 1000.0f;

  if (strcmp(active_sim_scenario, "tapUsage") == 0) {
    // Kịch bản 1: Mở vòi sinh hoạt (tụt nhẹ từ 0.22 xuống 0.16 Bar rồi hồi áp)
    if (sim_step_idx == 0) { // steady 0.22 in 4s
      sim_base_pressure = 0.22f;
      if (elapsed_step_sec >= 4.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 1) { // ramp 0.22 -> 0.16 in 3s
      float p = elapsed_step_sec / 3.0f;
      if (p > 1.0f) p = 1.0f;
      sim_base_pressure = 0.22f + p * (0.16f - 0.22f);
      if (elapsed_step_sec >= 3.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 2) { // steady 0.16 in 6s
      sim_base_pressure = 0.16f;
      if (elapsed_step_sec >= 6.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 3) { // ramp 0.16 -> 0.22 in 4s
      float p = elapsed_step_sec / 4.0f;
      if (p > 1.0f) p = 1.0f;
      sim_base_pressure = 0.16f + p * (0.22f - 0.16f);
      if (elapsed_step_sec >= 4.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else {
      sim_base_pressure = 0.22f;
    }
  } else if (strcmp(active_sim_scenario, "pipeBurst") == 0) {
    // Kịch bản 2: Bục vỡ ống (tụt dốc liên tục về 0.01 Bar)
    if (sim_step_idx == 0) { // steady 0.30 in 2s
      sim_base_pressure = 0.30f;
      if (elapsed_step_sec >= 2.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 1) { // ramp 0.30 -> 0.01 in 1.0s (dP/dt ≈ -0.29 Bar/s)
      float p = elapsed_step_sec / 1.0f;
      if (p > 1.0f) p = 1.0f;
      sim_base_pressure = 0.30f + p * (0.01f - 0.30f);
      if (elapsed_step_sec >= 1.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else {
      sim_base_pressure = 0.01f;
    }
  } else if (strcmp(active_sim_scenario, "overPressure") == 0) {
    // Kịch bản 3: Quá áp / Búa nước (vọt lên 0.38 Bar)
    if (sim_step_idx == 0) { // steady 0.22 in 3s
      sim_base_pressure = 0.22f;
      if (elapsed_step_sec >= 3.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 1) { // ramp 0.22 -> 0.38 in 5s
      float p = elapsed_step_sec / 5.0f;
      if (p > 1.0f) p = 1.0f;
      sim_base_pressure = 0.22f + p * (0.38f - 0.22f);
      if (elapsed_step_sec >= 5.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 2) { // steady 0.38 in 8s
      sim_base_pressure = 0.38f;
      if (elapsed_step_sec >= 8.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 3) { // ramp 0.38 -> 0.22 in 4s
      float p = elapsed_step_sec / 4.0f;
      if (p > 1.0f) p = 1.0f;
      sim_base_pressure = 0.38f + p * (0.22f - 0.38f);
      if (elapsed_step_sec >= 4.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else {
      sim_base_pressure = 0.22f;
    }
  } else if (strcmp(active_sim_scenario, "supplyLoss") == 0) {
    // Kịch bản 4: Mất nguồn cấp (tụt dần về 0.03 Bar trong 15s)
    if (sim_step_idx == 0) {
      sim_base_pressure = 0.20f;
      if (elapsed_step_sec >= 3.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else if (sim_step_idx == 1) {
      float p = elapsed_step_sec / 15.0f;
      if (p > 1.0f) p = 1.0f;
      sim_base_pressure = 0.20f + p * (0.03f - 0.20f);
      if (elapsed_step_sec >= 15.0f) { sim_step_idx++; sim_step_start_time = now; }
    } else {
      sim_base_pressure = 0.03f;
    }
  } else {
    // idle
    sim_base_pressure = 0.22f;
  }

  // Thêm nhiễu ngẫu nhiên thực tế (±0.0015 Bar) để bộ lọc EMA có việc hoạt động
  float noise = ((float)random(-15, 16)) / 10000.0f;
  float sim_p = sim_base_pressure + noise;
  if (sim_p < 0.0f) sim_p = 0.0f;
  if (sim_p > P_SENSOR_MAX * 1.2f) sim_p = P_SENSOR_MAX * 1.2f;

  // Tính ngược ra count 24-bit bằng hệ số hiệu chuẩn hoặc hệ số lý thuyết
  float factor = (COUNTS_PER_BAR > 0.0f) ? COUNTS_PER_BAR : THEORETICAL_COUNTS_PER_BAR;
  out = zero_offset_count + (int32_t)(sim_p * factor);
  sensor_ok = true;
  return true;
}

// -----------------------------------------------------------------------------------------
// 8. ĐẶC TẢ GIAO THỨC ĐỌC HX710B (25 XUNG NON-BLOCKING)
// -----------------------------------------------------------------------------------------
/**
 * Đọc dữ liệu từ HX710B theo đúng datasheet:
 * - DOUT xuống LOW: dữ liệu 24-bit đã sẵn sàng
 * - 24 xung SCK: đọc 24 bit MSB trước
 * - Xung thứ 25: chọn kênh vi sai, tốc độ 10 Hz
 * - Mở rộng dấu 24-bit sang 32-bit có dấu
 * - CẤM busy-wait: trả về false ngay nếu DOUT đang HIGH
 */
bool hx710bRead(int32_t &out) {
#if SIMULATE_SENSOR
  return simulatedRead(out);
#else
  // Kiểm tra chân DOUT mà KHÔNG busy-wait để tránh treo Web Server
  if (digitalRead(PIN_HX_DOUT) == HIGH) {
    hx_error_count++;
    if (hx_error_count > 30) { // ~3 giây không có phản hồi
      sensor_ok = false;
      current_state = STATE_SENSOR_FAULT;
    }
    return false;
  }

  hx_error_count = 0;
  sensor_ok = true;

  uint32_t raw = 0;
  noInterrupts(); // Khóa ngắt cục bộ để chuỗi xung không bị trễ quá 50µs
  for (uint8_t i = 0; i < 24; i++) {
    digitalWrite(PIN_HX_SCK, HIGH);
    delayMicroseconds(1);
    raw = (raw << 1) | digitalRead(PIN_HX_DOUT);
    digitalWrite(PIN_HX_SCK, LOW);
    delayMicroseconds(1);
  }

  // Xung thứ 25: chốt kênh vi sai và tốc độ 10 Hz
  digitalWrite(PIN_HX_SCK, HIGH);
  delayMicroseconds(1);
  digitalWrite(PIN_HX_SCK, LOW);
  interrupts(); // Mở lại ngắt

  // Mở rộng dấu 24-bit sang 32-bit (2's complement)
  if (raw & 0x800000) {
    out = (int32_t)(raw | 0xFF000000);
  } else {
    out = (int32_t)raw;
  }

  return true;
#endif
}

// -----------------------------------------------------------------------------------------
// 9. QUẢN LÝ LƯU TRỮ EEPROM & HIỆU CHUẨN CỘT NƯỚC
// -----------------------------------------------------------------------------------------
void loadCalibrationFromEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  CalibrationData data;
  EEPROM.get(0, data);

  if (data.magic == EEPROM_MAGIC && data.counts_per_bar > 0.0f) {
    zero_offset_count = data.zero_offset;
    COUNTS_PER_BAR = data.counts_per_bar;
    is_calibrated = true;
    Serial.println(F("[EEPROM] Đã tải thông số hiệu chuẩn thành công:"));
    Serial.print(F("         - Zero Tare: ")); Serial.println(zero_offset_count);
    Serial.print(F("         - Counts/Bar: ")); Serial.println(COUNTS_PER_BAR, 1);
  } else {
    zero_offset_count = 0;
    COUNTS_PER_BAR = 0.0f;
    is_calibrated = false;
    Serial.println(F("[EEPROM] Chưa có dữ liệu hiệu chuẩn hợp lệ trong bộ nhớ."));
  }
}

void saveCalibrationToEEPROM() {
  CalibrationData data;
  data.magic = EEPROM_MAGIC;
  data.zero_offset = zero_offset_count;
  data.counts_per_bar = COUNTS_PER_BAR;
  data.calib_timestamp = millis();
  EEPROM.put(0, data);
  EEPROM.commit();
  is_calibrated = true;
  Serial.println(F("[EEPROM] Đã lưu thông số hiệu chuẩn vào EEPROM!"));
}

/**
 * Hiệu chuẩn điểm không (Zero Tare) tự động khi khởi động
 * Lấy trung bình 30 mẫu HX710B khi không có áp lực nén
 */
void calibrateZeroTare() {
  Serial.println(F("[CALIB] Đang lấy mẫu Tare điểm 0 (30 mẫu)..."));
  int64_t sum = 0;
  int count = 0;
  unsigned long start = millis();

  while (count < 30 && (millis() - start < 4000)) {
    int32_t val;
    if (hx710bRead(val)) {
      sum += val;
      count++;
      delay(30);
    }
    yield();
  }

  if (count > 0) {
    zero_offset_count = (int32_t)(sum / count);
    Serial.print(F("[CALIB] Zero Tare hoàn tất: "));
    Serial.println(zero_offset_count);
  } else {
    Serial.println(F("[CALIB] Cảnh báo: Không thể đọc HX710B để Tare!"));
  }

  // Khởi tạo bộ đệm lịch sử
  for (int i = 0; i < HIST_SIZE; i++) {
    pressure_history[i] = 0.0f;
  }
  hist_idx = 0;
  hist_filled = false;
}

// -----------------------------------------------------------------------------------------
// 10. THU THẬP & XỬ LÝ TÍN HIỆU CẬN BIÊN (EDGE PROCESSING)
// -----------------------------------------------------------------------------------------
void readPressureSensor() {
  int32_t sample = 0;
  if (!hx710bRead(sample)) {
    return; // Chưa có dữ liệu mới từ HX710B
  }

  raw_count = sample;
  int32_t net_count = raw_count - zero_offset_count;

  // Tính điện áp vi sai ước tính (Full scale 50mV tương ứng ~3.3V VREF / Gain 128)
  diff_mv = ((float)net_count / 8388607.0f) * (3300.0f / 128.0f);

  // Quy đổi sang Bar: pressure_bar = (raw_count - zero_offset_count) / COUNTS_PER_BAR
  if (COUNTS_PER_BAR > 0.0f) {
    pressure_raw = (float)net_count / COUNTS_PER_BAR;
  } else {
    if (IS_SIMULATED) {
      // Khi đang bật giả lập, quy đổi ngược bằng hệ số lý thuyết để test thuật toán
      pressure_raw = (float)net_count / THEORETICAL_COUNTS_PER_BAR;
    } else {
      // Chưa hiệu chuẩn: giữ giá trị 0 và cảnh báo
      pressure_raw = 0.0f;
    }
  }

  if (pressure_raw < 0.0f) pressure_raw = 0.0f; // Chặn nhiễu âm
  if (pressure_raw > P_SENSOR_MAX * 1.5f) {
    pressure_raw = P_SENSOR_MAX * 1.5f; // Chặn tràn dải
  }

  // 1. Áp dụng bộ lọc số Exponential Moving Average (EMA)
  pressure_filtered = (EMA_ALPHA * pressure_raw) + ((1.0f - EMA_ALPHA) * pressure_filtered);

  // 2. Cập nhật bộ đệm lịch sử tính đạo hàm thời gian
  pressure_history[hist_idx] = pressure_filtered;
  hist_idx++;
  if (hist_idx >= HIST_SIZE) {
    hist_idx = 0;
    hist_filled = true;
  }

  // 3. Tính đạo hàm tốc độ tụt áp dP/dt (Bar/giây)
  if (hist_filled) {
    int oldest_idx = hist_idx; // Vì vừa tăng hist_idx nên vị trí hiện tại là mẫu cũ nhất
    float p_old = pressure_history[oldest_idx];
    float delta_p = pressure_filtered - p_old;
    float delta_t = (HIST_SIZE * SAMPLE_INTERVAL) / 1000.0f; // 1.0 giây
    dp_dt = delta_p / delta_t;
  } else {
    dp_dt = 0.0f;
  }

  // 4. Máy trạng thái phân loại sự cố
  evaluateSystemState();
}

/**
 * Thuật toán phân loại trạng thái đường ống & phát hiện bục vỡ
 */
void evaluateSystemState() {
  if (!sensor_ok) {
    current_state = STATE_SENSOR_FAULT;
    return;
  }

  // Kiểm tra điều kiện bục vỡ ống (dP/dt tụt dốc vượt ngưỡng liên tục ít nhất 3 chu kỳ)
  if (dp_dt <= DROP_THRESH && pressure_filtered < (P_SENSOR_MAX * 0.7f)) {
    rapid_drop_counter++;
    if (rapid_drop_counter >= 3) {
      current_state = STATE_RAPID_DROP;
      triggerIncident("RAPID_DROP (Bục vỡ đường ống)");
      return;
    }
  } else {
    if (rapid_drop_counter > 0) rapid_drop_counter--;
  }

  // Phân loại ngưỡng tĩnh
  if (pressure_filtered > P_MAX_THRESH) {
    current_state = STATE_HIGH_PRESSURE;
    triggerIncident("HIGH_PRESSURE (Quá áp / Búa nước)");
  } else if (pressure_filtered < P_MIN_THRESH && hist_filled) {
    current_state = STATE_LOW_PRESSURE;
    triggerIncident("LOW_PRESSURE (Mất áp / Rò rỉ)");
  } else {
    current_state = STATE_NORMAL;
  }
}

void triggerIncident(const char* type) {
  if (strcmp(last_incident_type, type) != 0) {
    incident_count++;
    strncpy(last_incident_type, type, sizeof(last_incident_type) - 1);
    snprintf(last_incident_time, sizeof(last_incident_time), "%lu ms kể từ khởi động", millis());

    Serial.print(F("[CẢNH BÁO SỰ CỐ] "));
    Serial.print(type);
    Serial.print(F(" | P: "));
    Serial.print(pressure_filtered, 3);
    Serial.print(F(" Bar | dP/dt: "));
    Serial.print(dp_dt, 3);
    Serial.println(F(" Bar/s"));
  }
}

// -----------------------------------------------------------------------------------------
// 11. UPLINK THINGSPEAK (CHƯƠNG 7 ĐỀ CƯƠNG MÔN HỌC IOT)
// -----------------------------------------------------------------------------------------
void handleThingSpeakUplink() {
  // Chỉ gửi khi đã có API Key, ở chế độ STA và có kết nối Internet
  if (strlen(THINGSPEAK_API_KEY) == 0) return;
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;
  http.setTimeout(3000); // Timeout 3s tránh chặn vòng loop

  String url = "http://api.thingspeak.com/update?api_key=" + String(THINGSPEAK_API_KEY);
  url += "&field1=" + String(pressure_filtered, 4);
  url += "&field2=" + String(dp_dt, 4);
  url += "&field3=" + String((int)current_state);
  url += "&field4=" + String(raw_count);

  if (http.begin(client, url)) {
    int httpCode = http.GET();
    if (httpCode > 0) {
      Serial.print(F("[THINGSPEAK] Gửi thành công! Mã HTTP: "));
      Serial.println(httpCode);
    } else {
      thingspeak_fail_count++;
      Serial.print(F("[THINGSPEAK] Gửi thất bại: "));
      Serial.println(http.errorToString(httpCode));
    }
    http.end();
  }
}

// -----------------------------------------------------------------------------------------
// 12. GIAO DIỆN WEB DASHBOARD VÀ CÁC API TRẢ DỮ LIỆU
// -----------------------------------------------------------------------------------------
void handleApiData() {
  String json = "{";
  json += "\"node_id\":\"" + String(NODE_ID) + "\",";
  json += "\"uptime_ms\":" + String(millis()) + ",";
  json += "\"raw_adc\":" + String(raw_count) + ",";
  json += "\"voltage_mv\":" + String(diff_mv, 2) + ",";
  json += "\"pressure_raw\":" + String(pressure_raw, 4) + ",";
  json += "\"pressure\":" + String(pressure_filtered, 4) + ",";
  json += "\"dp_dt\":" + String(dp_dt, 4) + ",";
  json += "\"status\":\"" + String(StateNames[current_state]) + "\",";
  json += "\"incident_count\":" + String(incident_count) + ",";
  json += "\"last_incident_type\":\"" + String(last_incident_type) + "\",";
  json += "\"last_incident_time\":\"" + String(last_incident_time) + "\",";
  if (IS_SIMULATED) {
    json += "\"simulated\":true,";
    json += "\"sim_scenario\":\"" + String(active_sim_scenario) + "\",";
  } else {
    json += "\"simulated\":false,";
  }
  json += "\"sensor_ok\":" + String(sensor_ok ? "true" : "false") + ",";
  json += "\"calibrated\":" + String(is_calibrated ? "true" : "false") + ",";
  json += "\"counts_per_bar\":" + String(COUNTS_PER_BAR, 1);
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleApiCalibrateGet() {
  String json = "{";
  json += "\"calibrated\":" + String(is_calibrated ? "true" : "false") + ",";
  json += "\"zero_offset_count\":" + String(zero_offset_count) + ",";
  json += "\"counts_per_bar\":" + String(COUNTS_PER_BAR, 2) + ",";
  json += "\"raw_count_now\":" + String(raw_count);
  json += "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleApiCalibrateZero() {
  calibrateZeroTare();
  if (is_calibrated) {
    saveCalibrationToEEPROM();
  }
  String json = "{\"status\":\"ok\",\"zero_offset\":" + String(zero_offset_count) + "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleApiCalibrateSpan() {
  float height_cm = 80.0f; // Mặc định 80cm nếu không gửi tham số
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    int idx = body.indexOf("\"height_cm\":");
    if (idx != -1) {
      height_cm = body.substring(idx + 12).toFloat();
    }
  } else if (server.hasArg("height_cm")) {
    height_cm = server.arg("height_cm").toFloat();
  }

  if (height_cm <= 10.0f) {
    server.send(400, "application/json", "{\"error\":\"Chiều cao cột nước quá nhỏ (tối thiểu 10cm)\"}");
    return;
  }

  // Đọc 30 mẫu đo điểm span
  int64_t sum = 0;
  int count = 0;
  unsigned long start = millis();
  while (count < 30 && (millis() - start < 4000)) {
    int32_t val;
    if (hx710bRead(val)) {
      sum += val;
      count++;
      delay(30);
    }
    yield();
  }

  if (count == 0) {
    server.send(500, "application/json", "{\"error\":\"Không đọc được cảm biến để hiệu chuẩn\"}");
    return;
  }

  int32_t span_count = (int32_t)(sum / count);
  // Áp suất cột nước P = rho * g * h = 1000 * 9.81 * (h/100) Pa => chia 100000 ra Bar
  // P (Bar) = 0.0981 * (h_cm / 100.0)
  float p_span_bar = 0.0981f * (height_cm / 100.0f);
  int32_t delta_count = span_count - zero_offset_count;

  if (delta_count <= 100) {
    server.send(400, "application/json", "{\"error\":\"Chênh lệch count quá nhỏ, kiểm tra lại cột nước\"}");
    return;
  }

  COUNTS_PER_BAR = (float)delta_count / p_span_bar;
  saveCalibrationToEEPROM();

  String json = "{";
  json += "\"status\":\"ok\",";
  json += "\"height_cm\":" + String(height_cm, 1) + ",";
  json += "\"p_span_bar\":" + String(p_span_bar, 4) + ",";
  json += "\"span_count\":" + String(span_count) + ",";
  json += "\"counts_per_bar\":" + String(COUNTS_PER_BAR, 1);
  json += "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleApiSim() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    if (body.indexOf("pipeBurst") != -1) startSimScenario("pipeBurst");
    else if (body.indexOf("tapUsage") != -1) startSimScenario("tapUsage");
    else if (body.indexOf("overPressure") != -1) startSimScenario("overPressure");
    else if (body.indexOf("supplyLoss") != -1) startSimScenario("supplyLoss");
    else startSimScenario("idle");
  } else if (server.hasArg("scenario")) {
    startSimScenario(server.arg("scenario").c_str());
  }
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"ok\",\"active_scenario\":\"" + String(active_sim_scenario) + "\"}");
}

void handleApiSimStop() {
  stopSimScenario();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"ok\",\"stopped\":true}");
}

/**
 * Giao diện Web HTML5 hiển thị trực tiếp từ bộ nhớ ESP8266
 */
void handleRoot() {
  String html = F(
    "<!DOCTYPE html><html lang='vi'><head><meta charset='UTF-8'>"
    "<meta name='viewport' content='width=device-width,initial-scale=1.0'>"
    "<title>HydroWatch - Giám Sát Áp Suất HX710B</title>"
    "<style>"
    ":root{--bg:#0f172a;--card:#1e293b;--text:#f8fafc;--accent:#38bdf8;--danger:#ef4444;--warn:#f59e0b;--ok:#10b981;}"
    "body{margin:0;font-family:'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);padding:20px;}"
    ".container{max-width:900px;margin:auto;}"
    ".sim-banner{background:#c2410c;color:#fff;padding:10px 15px;border-radius:8px;font-weight:700;margin-bottom:15px;text-align:center;display:none;}"
    "header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:15px;margin-bottom:20px;}"
    "h1{margin:0;font-size:1.5rem;color:var(--accent);}"
    ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;}"
    ".card{background:var(--card);border-radius:12px;padding:20px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);border:1px solid #334155;}"
    ".card h3{margin:0 0 10px 0;font-size:0.9rem;color:#94a3b8;text-transform:uppercase;}"
    ".value{font-size:2.2rem;font-weight:700;margin:5px 0;}"
    ".status-badge{display:inline-block;padding:6px 14px;border-radius:20px;font-weight:600;font-size:0.9rem;}"
    ".status-NORMAL{background:rgba(16,185,129,0.2);color:var(--ok);border:1px solid var(--ok);}"
    ".status-RAPID_DROP{background:rgba(239,68,68,0.2);color:var(--danger);border:1px solid var(--danger);animation:pulse 1s infinite;}"
    ".status-HIGH_PRESSURE{background:rgba(245,158,11,0.2);color:var(--warn);border:1px solid var(--warn);}"
    ".status-LOW_PRESSURE{background:rgba(56,189,248,0.2);color:var(--accent);border:1px solid var(--accent);}"
    ".status-SENSOR_FAULT{background:rgba(239,68,68,0.3);color:#fca5a5;border:1px solid #ef4444;}"
    "@keyframes pulse{0%{opacity:1;}50%{opacity:0.5;}100%{opacity:1;}}"
    "footer{text-align:center;color:#64748b;font-size:0.8rem;margin-top:30px;}"
    "</style></head><body>"
    "<div class='container'>"
    "<div id='sim-alert' class='sim-banner'>⚠️ CHẾ ĐỘ GIẢ LẬP ĐANG BẬT (SIMULATE_SENSOR = 1) — Số liệu thử nghiệm logic, không phải cảm biến thật!</div>"
    "<header><div><h1>GIÁM SÁT ÁP SUẤT ĐƯỜNG ỐNG IOT</h1><small>Node ID: <b>NODE-01</b> | Vi điều khiển: ESP8266 + HX710B 24-bit</small></div>"
    "<span id='badge' class='status-badge status-NORMAL'>ĐANG KẾT NỐI...</span></header>"
    "<div class='grid'>"
    "<div class='card'><h3>Áp Suất Hiện Tại (Bar)</h3><div class='value' id='p-val' style='color:var(--accent);'>0.000</div><small id='adc-val'>Count 24-bit: 0 | 0.00 mV vi sai</small></div>"
    "<div class='card'><h3>Tốc Độ Biến Thiên (dP/dt)</h3><div class='value' id='dp-val'>0.000</div><small>Đơn vị: Bar / giây</small></div>"
    "<div class='card'><h3>Sự Cố Đã Ghi Nhận</h3><div class='value' id='inc-val' style='color:var(--warn);'>0</div><small id='last-inc'>Chưa có</small></div>"
    "</div>"
    "<div class='card'><h3>Thông Tin Trạng Thái Vận Hành</h3>"
    "<p>• <b>Cảm biến:</b> MPS20N0040D (0 ~ 0.4 Bar) qua IC khuếch đại 24-bit HX710B.</p>"
    "<p>• <b>0.05 ~ 0.35 Bar:</b> Dải áp suất hoạt động tiêu chuẩn.</p>"
    "<p>• <b>dP/dt &lt; -0.08 Bar/s:</b> Thuật toán phát hiện sự cố bục vỡ tức thời.</p>"
    "<p>• <b>Hiệu chuẩn:</b> <span id='calib-status'>Chưa hiệu chuẩn</span></p>"
    "<p>• <b>Thời gian hoạt động:</b> <span id='uptime'>0</span>s</p>"
    "</div>"
    "<footer>Đồ Án IoT - Giám Sát Áp Suất Đường Ống Cấp Nước</footer></div>"
    "<script>"
    "async function updateData(){try{const r=await fetch('/api/data');const d=await r.json();"
    "document.getElementById('p-val').innerText=d.pressure.toFixed(3);"
    "document.getElementById('adc-val').innerText='Count 24-bit: '+d.raw_adc+' | '+d.voltage_mv.toFixed(2)+' mV vi sai';"
    "document.getElementById('dp-val').innerText=(d.dp_dt>0?'+':'')+d.dp_dt.toFixed(3);"
    "document.getElementById('inc-val').innerText=d.incident_count;"
    "document.getElementById('last-inc').innerText='Gần nhất: '+d.last_incident_type;"
    "document.getElementById('uptime').innerText=Math.floor(d.uptime_ms/1000);"
    "document.getElementById('sim-alert').style.display=d.simulated?'block':'none';"
    "document.getElementById('calib-status').innerText=d.calibrated?'Đã lưu EEPROM ('+d.counts_per_bar+' counts/Bar)':'Chưa hiệu chuẩn cột nước';"
    "const b=document.getElementById('badge');b.innerText=d.status;b.className='status-badge status-'+d.status;"
    "}catch(e){console.error(e);}}"
    "setInterval(updateData,500);updateData();"
    "</script></body></html>"
  );
  server.send(200, "text/html", html);
}

// -----------------------------------------------------------------------------------------
// 13. ĐIỀU KHIỂN ĐÈN LED THEO TRẠNG THÁI & CHẾ ĐỘ
// -----------------------------------------------------------------------------------------
void evaluateLedPattern() {
  if (IS_SIMULATED) {
    // Chế độ mô phỏng: nháy đôi mỗi 2 giây để phân biệt với chạy phần cứng thật
    unsigned long cycle = millis() % 2000;
    if ((cycle >= 0 && cycle < 100) || (cycle >= 200 && cycle < 300)) {
      digitalWrite(PIN_LED, LOW); // Bật LED (Active LOW)
    } else {
      digitalWrite(PIN_LED, HIGH); // Tắt LED
    }
  } else {
    if (current_state == STATE_NORMAL) {
      digitalWrite(PIN_LED, HIGH); // Tắt LED
    } else {
      digitalWrite(PIN_LED, LOW);  // Sáng LED báo sự cố
    }
  }
}

// -----------------------------------------------------------------------------------------
// 14. KHỞI TẠO (SETUP) & VÒNG LẶP CHÍNH (LOOP)
// -----------------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println(F("\n=================================================="));
  Serial.println(F(" KHỞI ĐỘNG HỆ THỐNG IOT GIÁM SÁT ÁP SUẤT NƯỚC"));
  Serial.println(F(" PHIÊN BẢN: HX710B 24-BIT + HIỆU CHUẨN CỘT NƯỚC"));
  Serial.println(F("=================================================="));

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);

  pinMode(PIN_HX_DOUT, INPUT);
  pinMode(PIN_HX_SCK, OUTPUT);
  digitalWrite(PIN_HX_SCK, LOW);

  if (IS_SIMULATED) {
    Serial.println(F("**************************************************"));
    Serial.println(F("[GIẢ LẬP] CỜ SIMULATE_SENSOR ĐANG BẬT = 1"));
    Serial.println(F("[GIẢ LẬP] SỐ LIỆU ĐANG SINH TỪ FIRMWARE SIMULATOR"));
    Serial.println(F("[GIẢ LẬP] KHÔNG PHẢI TỪ CẢM BIẾN PHẦN CỨNG THẬT"));
    Serial.println(F("**************************************************"));
  }

  // 1. Tải thông số hiệu chuẩn từ EEPROM
  loadCalibrationFromEEPROM();

  // 2. Khởi tạo mạng Wi-Fi
  if (strlen(STA_SSID) > 0) {
    Serial.print(F("[WIFI] Đang kết nối tới: "));
    Serial.println(STA_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(STA_SSID, STA_PASS);
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
      delay(500);
      Serial.print(F("."));
      retry++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print(F("\n[WIFI] Đã kết nối! IP trạm: "));
      Serial.println(WiFi.localIP());
    } else {
      Serial.println(F("\n[WIFI] Kết nối STA thất bại, chuyển sang Access Point!"));
      WiFi.mode(WIFI_AP);
      WiFi.softAP(AP_SSID, AP_PASS);
    }
  } else {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.print(F("[WIFI AP] Đã phát Wi-Fi: "));
    Serial.println(AP_SSID);
    Serial.print(F("[WIFI AP] Dashboard tại: http://"));
    Serial.println(WiFi.softAPIP());
  }

  // 3. Khởi chạy Web Server & đăng ký Endpoints
  server.on("/", handleRoot);
  server.on("/api/data", handleApiData);
  server.on("/api/calibrate", HTTP_GET, handleApiCalibrateGet);
  server.on("/api/calibrate/zero", HTTP_POST, handleApiCalibrateZero);
  server.on("/api/calibrate/span", HTTP_POST, handleApiCalibrateSpan);
  server.on("/api/sim", HTTP_POST, handleApiSim);
  server.on("/api/sim/stop", HTTP_POST, handleApiSimStop);
  server.begin();
  Serial.println(F("[HTTP] Web Server đã sẵn sàng phục vụ trên cổng 80!"));

  // 4. Lấy mẫu Zero Tare ban đầu
  calibrateZeroTare();
}

void loop() {
  server.handleClient();

  unsigned long current_time = millis();

  // 1. Chu kỳ lấy mẫu cảm biến & tính toán lọc EMA + dP/dt (mỗi 100ms)
  if (current_time - last_sample_time >= SAMPLE_INTERVAL) {
    last_sample_time = current_time;
    readPressureSensor();
    evaluateLedPattern();
  }

  // 2. Chu kỳ xuất Serial Telemetry (mỗi 500ms)
  if (current_time - last_report_time >= REPORT_INTERVAL) {
    last_report_time = current_time;
    Serial.print(F("[DATA] Count: "));
    Serial.print(raw_count);
    Serial.print(F(" | V_diff: "));
    Serial.print(diff_mv, 2);
    Serial.print(F(" mV | P: "));
    Serial.print(pressure_filtered, 3);
    Serial.print(F(" Bar | dP/dt: "));
    Serial.print(dp_dt, 3);
    Serial.print(F(" Bar/s | Trạng thái: "));
    Serial.println(StateNames[current_state]);
  }

  // 3. Chu kỳ gửi dữ liệu ThingSpeak (mỗi 15 giây)
  if (current_time - last_thingspeak_time >= THINGSPEAK_INTERVAL) {
    last_thingspeak_time = current_time;
    handleThingSpeakUplink();
  }

  // 4. Nhắc nhở cảnh báo định kỳ nếu chưa hiệu chuẩn (mỗi 5 giây)
  if (!is_calibrated && (current_time - last_calib_warn_time >= 5000)) {
    last_calib_warn_time = current_time;
    Serial.println(F("[CẢNH BÁO] Hệ thống chưa hiệu chuẩn cột nước! Giá trị áp suất chỉ mang tính ước lượng."));
  }

  // 5. Nhắc nhở banner giả lập định kỳ (mỗi 10 giây)
  if (IS_SIMULATED && (current_time - last_sim_warn_time >= 10000)) {
    last_sim_warn_time = current_time;
    Serial.println(F("[GIẢ LẬP] SIMULATE_SENSOR đang BẬT — số liệu KHÔNG PHẢI từ cảm biến thật."));
  }
}

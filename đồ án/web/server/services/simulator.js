/**
 * Bộ sinh dữ liệu mô phỏng thực nghiệm (Physical Simulation Generator)
 * Mô phỏng quá trình nén và xả khí/chất lỏng của pít-tông xi-lanh y tế gắn với MPS20N0040D.
 * Cung cấp 5 kịch bản chuẩn hóa phục vụ thuyết trình và kiểm chứng thuật toán.
 */

export const SCENARIOS = {
  idle: [
    { phase: 'steady', target: 0.22, seconds: Infinity }
  ],
  tapUsage: [
    // Kịch bản 1: Mở vòi nước sinh hoạt (tụt nhẹ rồi ổn định hoặc hồi áp -> KHÔNG BÁO ĐỘNG)
    { phase: 'steady', target: 0.22, seconds: 4 },
    { phase: 'ramp', from: 0.22, to: 0.16, seconds: 3 }, // dP/dt ≈ -0.02 Bar/s
    { phase: 'steady', target: 0.16, seconds: 6 },
    { phase: 'ramp', from: 0.16, to: 0.22, seconds: 4 }, // Hồi áp khi đóng vòi
    { phase: 'steady', target: 0.22, seconds: 5 }
  ],
  pipeBurst: [
    // Kịch bản 2: Bục vỡ đường ống (rút nhanh pít-tông -> dP/dt < -0.08 liên tục -> RAPID_DROP)
    { phase: 'steady', target: 0.30, seconds: 2 },
    { phase: 'ramp', from: 0.30, to: 0.01, seconds: 1.0 }, // dP/dt ≈ -0.15 Bar/s
    { phase: 'steady', target: 0.01, seconds: 10 }
  ],
  overPressure: [
    // Kịch bản 3: Quá áp do búa nước hoặc máy bơm áp lực
    { phase: 'steady', target: 0.22, seconds: 3 },
    { phase: 'ramp', from: 0.22, to: 0.38, seconds: 5 },
    { phase: 'steady', target: 0.38, seconds: 8 },
    { phase: 'ramp', from: 0.38, to: 0.22, seconds: 4 }
  ],
  supplyLoss: [
    // Kịch bản 4: Mất nguồn cấp nước (tụt chậm liên tục xuống dưới 0.05 Bar)
    { phase: 'steady', target: 0.20, seconds: 3 },
    { phase: 'ramp', from: 0.20, to: 0.03, seconds: 15 },
    { phase: 'steady', target: 0.03, seconds: 10 }
  ]
};

export class PhysicalSimulator {
  constructor() {
    this.activeScenarioName = null;
    this.scenarioSteps = [];
    this.stepIndex = 0;
    this.stepStartTime = 0;
    this.currentBasePressure = 0.22;
    this.isRunning = false;
  }

  start(scenarioName = 'idle', startTime = null) {
    if (!SCENARIOS[scenarioName]) {
      throw new Error(`Kịch bản mô phỏng không tồn tại: ${scenarioName}`);
    }
    this.activeScenarioName = scenarioName;
    this.scenarioSteps = SCENARIOS[scenarioName];
    this.stepIndex = 0;
    this.stepStartTime = startTime !== null ? startTime : Date.now();
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
    this.activeScenarioName = null;
    this.scenarioSteps = [];
  }

  getStatus() {
    return {
      active: this.isRunning,
      scenario: this.activeScenarioName,
    };
  }

  nextSample(customNow = null) {
    if (!this.isRunning || this.scenarioSteps.length === 0) {
      return null;
    }

    const now = customNow !== null ? customNow : Date.now();
    const currentStep = this.scenarioSteps[this.stepIndex];
    const elapsedSec = (now - this.stepStartTime) / 1000.0;

    // Chuyển sang bước tiếp theo trong kịch bản nếu đã hết thời gian
    if (elapsedSec >= currentStep.seconds && this.stepIndex < this.scenarioSteps.length - 1) {
      this.stepIndex += 1;
      this.stepStartTime = now;
      return this.nextSample(now);
    }

    // Tính áp suất cơ bản theo pha
    if (currentStep.phase === 'steady') {
      this.currentBasePressure = currentStep.target;
    } else if (currentStep.phase === 'ramp') {
      const progress = Math.min(1.0, elapsedSec / currentStep.seconds);
      this.currentBasePressure = currentStep.from + progress * (currentStep.to - currentStep.from);
    }

    // Thêm nhiễu ngẫu nhiên Gauss nhẹ (sigma = 0.0015 Bar)
    const noise = (Math.random() - 0.5) * 0.003;
    let pressureRaw = this.currentBasePressure + noise;

    // Giới hạn vật lý dải đo cảm biến MPS20N0040D (0 ~ 0.40 Bar)
    pressureRaw = Math.max(0.001, Math.min(0.40, pressureRaw));

    // Tính toán ngược các thông số điện tử theo mô hình khuếch đại HX710B 24-bit
    // Toàn dải cảm biến 0.40 Bar tương ứng ~50.0 mV vi sai
    const diffMv = (pressureRaw / 0.40) * 50.0;
    // HX710B 24-bit với gain 128 (quy đổi ~5.000.000 counts/Bar khớp với firmware)
    const rawAdc = Math.round(pressureRaw * 5000000.0);

    return {
      node_id: 'NODE-01',
      pressure_raw: parseFloat(pressureRaw.toFixed(4)),
      voltage_mv: parseFloat(diffMv.toFixed(2)),
      raw_adc: rawAdc,
      timestamp: new Date().toISOString(),
    };
  }
}

export const simulator = new PhysicalSimulator();

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useEffect } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useLiveStream } from '../hooks/useLiveStream.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../api/client.js', () => ({
  api: {
    getLive: vi.fn().mockResolvedValue({
      current: null,
      history: [],
      connected: false,
      sim: { active: false },
    }),
  },
}));

class MockEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.closed = false;
    this.onopen = null;
    this.onerror = null;
    MockEventSource.instances.push(this);

    setTimeout(() => {
      if (this.onopen && !this.closed) {
        this.onopen();
      }
    }, 0);
  }

  addEventListener(type, cb) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(cb);
  }

  removeEventListener(type, cb) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((fn) => fn !== cb);
  }

  emit(type, data) {
    if (this.closed) return;
    const cbs = this.listeners[type] || [];
    for (const cb of cbs) {
      cb({ data: JSON.stringify(data) });
    }
  }

  simulateError() {
    if (this.closed) return;
    if (this.onerror) {
      this.onerror(new Error('Connection failed'));
    }
  }

  close() {
    this.closed = true;
  }
}

describe('useLiveStream Hook', () => {
  let container;
  let root;
  let latestResult;

  function TestConsumer() {
    const res = useLiveStream('NODE-01');
    useEffect(() => {
      latestResult = res;
    }, [res]);
    return null;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    globalThis.EventSource = MockEventSource;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('nhận sự kiện sample thì cập nhật current và đẩy vào history', async () => {
    await act(async () => {
      root.render(<TestConsumer />);
    });

    const es = MockEventSource.instances[0];
    expect(es).toBeDefined();

    const sample1 = {
      node_id: 'NODE-01',
      pressure: 0.224,
      dp_dt: -0.002,
      status: 'NORMAL',
      esp_connected: true,
      sim_active: false,
    };

    await act(async () => {
      es.emit('sample', sample1);
    });

    expect(latestResult.current).toEqual(sample1);
    expect(latestResult.connected).toBe(true);
    expect(latestResult.history).toHaveLength(1);
    expect(latestResult.history[0]).toEqual(sample1);
  });

  it('history bị cắt đúng giới hạn (tối đa 120 điểm), không phình vô hạn', async () => {
    await act(async () => {
      root.render(<TestConsumer />);
    });

    const es = MockEventSource.instances[0];

    // Phát 150 mẫu liên tiếp
    await act(async () => {
      for (let i = 1; i <= 150; i++) {
        es.emit('sample', {
          node_id: 'NODE-01',
          pressure: 0.20 + (i * 0.001),
          dp_dt: 0,
          status: 'NORMAL',
          esp_connected: true,
          sim_active: false,
          seq: i,
        });
      }
    });

    expect(latestResult.history).toHaveLength(120);
    expect(latestResult.history[0].seq).toBe(31);
    expect(latestResult.history[119].seq).toBe(150);
  });

  it('mất kết nối thì connected = false và có lên lịch reconnect', async () => {
    await act(async () => {
      root.render(<TestConsumer />);
    });

    const es1 = MockEventSource.instances[0];

    // Báo kết nối thành công trước
    await act(async () => {
      es1.emit('sample', { esp_connected: true, pressure: 0.22 });
    });
    expect(latestResult.connected).toBe(true);

    // Kích hoạt lỗi kết nối
    await act(async () => {
      es1.simulateError();
    });

    expect(latestResult.streamConnected).toBe(false);
    expect(es1.closed).toBe(true);

    // Cho bộ đếm thời gian reconnect 1000ms chạy
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Sau khi hết delay, EventSource mới được khởi tạo lại
    expect(MockEventSource.instances.length).toBe(2);
    expect(MockEventSource.instances[1].closed).toBe(false);
  });

  it('cleanup khi unmount thì gọi close(), không rò rỉ listener', async () => {
    await act(async () => {
      root.render(<TestConsumer />);
    });

    const es = MockEventSource.instances[0];
    expect(es.closed).toBe(false);

    await act(async () => {
      root.unmount();
    });

    expect(es.closed).toBe(true);
  });
});

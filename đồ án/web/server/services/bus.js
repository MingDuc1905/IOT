import { EventEmitter } from 'node:events';

class SystemEventBus extends EventEmitter {}

export const bus = new SystemEventBus();
// Cho phép nhiều SSE client kết nối cùng lúc mà không bị warning MaxListeners
bus.setMaxListeners(100);

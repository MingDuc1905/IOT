/**
 * Bảng ánh xạ trạng thái hệ thống và sự cố sang nhãn Tiếng Việt và Tabler Tokens chuẩn:
 * Tuyệt đối không dùng class Bootstrap -subtle (cấm bg-blue-subtle, bg-danger-subtle...)
 * Chỉ dùng biến thể -lt chính thức của Tabler Palette: bg-red-lt, bg-orange-lt, bg-green-lt...
 */

export const ALERT_META = {
  RAPID_DROP: { label: 'Tụt áp nhanh (Vỡ ống)', badge: 'bg-red-lt', dot: 'status-red', avatar: 'bg-red-lt' },
  HIGH: { label: 'Quá áp (Búa nước)', badge: 'bg-orange-lt', dot: 'status-orange', avatar: 'bg-orange-lt' },
  LOW: { label: 'Mất áp / Rò rỉ', badge: 'bg-azure-lt', dot: 'status-azure', avatar: 'bg-azure-lt' },
};

export const STATUS_META = {
  NORMAL: { label: 'Bình thường', badge: 'bg-green-lt', dot: 'status-green', avatar: 'bg-green-lt' },
  HIGH_PRESSURE: { label: 'Quá áp', badge: 'bg-orange-lt', dot: 'status-orange', avatar: 'bg-orange-lt' },
  LOW_PRESSURE: { label: 'Mất áp', badge: 'bg-azure-lt', dot: 'status-azure', avatar: 'bg-azure-lt' },
  RAPID_DROP: { label: 'Tụt áp nhanh', badge: 'bg-red-lt', dot: 'status-red', avatar: 'bg-red-lt' },
  SENSOR_FAULT: { label: 'Lỗi cảm biến', badge: 'bg-purple-lt', dot: 'status-purple', avatar: 'bg-purple-lt' },
};

export const TICKET_META = {
  PENDING: { label: 'Chờ tiếp nhận', badge: 'bg-red-lt' },
  INVESTIGATING: { label: 'Đang kiểm tra', badge: 'bg-orange-lt' },
  RESOLVED: { label: 'Đã giải quyết', badge: 'bg-green-lt' },
};

const FALLBACK = {
  label: 'Không xác định',
  badge: 'bg-secondary-lt',
  dot: 'status-secondary',
  avatar: 'bg-secondary-lt',
};

export function metaOf(map, key) {
  if (!map || !key) return FALLBACK;
  return map[key] ?? FALLBACK;
}

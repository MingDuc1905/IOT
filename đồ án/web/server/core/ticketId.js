/**
 * Sinh mã sự cố duy nhất (Ticket ID) theo quy chuẩn AGENTS.md §3:
 * Định dạng: INC-YYYYMMDD-XXX (tăng dần, pad 3 chữ số, mở rộng 4 số nếu > 999)
 * Tuyệt đối không dùng Math.random().
 */
export function nextTicketId(dateIso, existingIdsSameDay = []) {
  // Chuẩn hóa định dạng YYYYMMDD từ chuỗi dateIso
  const cleanDate = dateIso.replace(/[-:]/g, '').slice(0, 8);
  const prefix = `INC-${cleanDate}-`;

  let maxSeq = 0;

  for (const id of existingIdsSameDay) {
    if (typeof id === 'string' && id.startsWith(prefix)) {
      const suffix = id.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const formattedSeq = nextSeq < 1000 ? String(nextSeq).padStart(3, '0') : String(nextSeq);

  return `${prefix}${formattedSeq}`;
}

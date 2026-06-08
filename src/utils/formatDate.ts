const DATE_KEY_PATTERN = /(date|time|created_at|updated_at|createdAt|updatedAt|paidAt|sentAt|invoiceDate)$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}/;

export function formatDisplayDate(value: unknown) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const period = hours24 >= 12 ? "PM" : "AM";

  return `${day}/${month}/${year} ${pad(hours12)}:${minutes}:${seconds} ${period}`;
}

export function shouldFormatAsDate(key: string, value: unknown) {
  if (value instanceof Date) return true;
  if (typeof value !== "string" || !value.trim()) return false;
  return DATE_KEY_PATTERN.test(key) || ISO_DATE_PATTERN.test(value);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

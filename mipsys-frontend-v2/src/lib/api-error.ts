/** Ekstrak pesan error API (axios) agar pesan 400 dari backend tetap tampil. */
export function extractApiError(
  error: unknown,
  fallback: string,
): string {
  const data = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data;
  if (Array.isArray(data?.message)) return data.message.join(', ');
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Pesan backend saat komposisi part berubah setelah penawaran disimpan. */
export const QUOTE_STALE_MESSAGE = 'Komposisi part berubah setelah penawaran disimpan';

export function isQuoteStaleError(error: unknown): boolean {
  return extractApiError(error, '').includes(QUOTE_STALE_MESSAGE);
}

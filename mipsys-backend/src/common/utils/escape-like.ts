export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export function likePattern(search: string): string {
  return `%${escapeLike(search.trim().slice(0, 100))}%`;
}

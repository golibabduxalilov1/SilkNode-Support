/** Joins truthy class name fragments — the system's only class-merge utility. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

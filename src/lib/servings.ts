export const MAX_SERVINGS = 1000;

export function parseServingCount(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= MAX_SERVINGS ? count : null;
}

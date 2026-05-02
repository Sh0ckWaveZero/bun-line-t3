/**
 * Reasoning models don't support temperature.
 */
export function supportsTemperature(modelName: string): boolean {
  const normalized = modelName.toLowerCase();

  if (normalized.startsWith("gpt-5")) return false;
  if (normalized.startsWith("o1")) return false;
  if (normalized.startsWith("o3")) return false;
  if (normalized.startsWith("o4")) return false;

  return true;
}

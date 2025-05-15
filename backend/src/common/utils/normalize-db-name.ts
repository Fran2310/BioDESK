export function normalizeDbName(raw: string): string {
  if (typeof raw !== 'string') return raw;

  let name = raw.trim().replace(/\s+/g, '_');

  if (!name.startsWith('lab_')) {
    name = `lab_${name}`;
  }

  return name;
}

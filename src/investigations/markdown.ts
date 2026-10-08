export function md(value: string): string { return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\r/g, ' ').replace(/\n/g, ' '); }
export function fenced(value: string): string { const fence = '`'.repeat(Math.max(3, ...(value.match(/`+/g) ?? []).map(x => x.length + 1))); return `${fence}text\n${value}\n${fence}`; }

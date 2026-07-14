export const ACTIVITY_MODULES = [
  { slug: 'penjualan', label: 'Penjualan' },
  { slug: 'pembelian', label: 'Pembelian' },
  { slug: 'inventori', label: 'Inventori' },
  { slug: 'pengeluaran', label: 'Pengeluaran' },
  { slug: 'kas', label: 'Kas & Bank' },
  { slug: 'hutang', label: 'Hutang' },
  { slug: 'akuntansi', label: 'Akuntansi' },
  { slug: 'pengguna', label: 'Pengguna & Akses' },
] as const;

export type ActivityModuleSlug = (typeof ACTIVITY_MODULES)[number]['slug'];

export function moduleLabel(slug: string): string {
  return ACTIVITY_MODULES.find(m => m.slug === slug)?.label ?? slug;
}

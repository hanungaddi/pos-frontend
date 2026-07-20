"use client";

import { useWatch } from "react-hook-form";
import { FormSelect } from "@/components/forms/form-select";
import type { CommandOption } from "@/components/ui/command-select";
import type { CoaMapping } from "@/features/accounting/api/coa-mapping-api";
import { AlertTriangle, PenTool } from "lucide-react";

interface CoaMappingRowProps {
    m: CoaMapping;
    coaOptions: CommandOption[];
    isDirty: boolean;
    isLoadingCoas: boolean;
}

const SLOT_LABELS: Record<string, string> = {
    sale_cash: "Kas (Tunai)",
    sale_card: "Bank (Kartu)",
    sale_receivable: "Piutang Usaha",
    sale_revenue: "Pendapatan Penjualan",
    sale_residual: "Diskon Penjualan",
    sale_vat: "Pajak Penjualan (VAT)",
    sale_cogs: "HPP (COGS)",
    sale_inventory: "Persediaan",
    receiving_inventory: "Persediaan",
    receiving_ap: "Hutang Usaha",
    payment_ap: "Hutang Usaha",
    payment_cash: "Kas (Tunai)",
    payment_bank: "Bank",
    expense_account: "Beban",
    expense_cash: "Kas (Tunai)",
    expense_bank: "Bank",
    memberpayment_receivable: "Piutang Usaha",
    return_ap: "Hutang Usaha",
    return_inventory: "Persediaan",
    movement_inventory: "Persediaan",
    movement_surplus: "Pendapatan Selisih Persediaan",
    movement_loss: "Beban Selisih Persediaan",
    cashledger_cash: "Kas (Tunai)",
    cashledger_bank: "Bank",
    cashledger_shortage: "Beban Kekurangan Kas",
    cashledger_overage: "Pendapatan Selisih Kas",
};

const SLOT_DESCRIPTIONS: Record<string, string> = {
    sale_cash: "Menampung pembayaran tunai dari transaksi penjualan kasir.",
    sale_card: "Menampung pembayaran kartu debit/kredit/QRIS dari transaksi penjualan.",
    sale_receivable: "Mencatat piutang pelanggan pada transaksi penjualan non-tunai (tempo).",
    sale_revenue: "Mencatat nilai pendapatan dari penjualan produk.",
    sale_residual: "Menampung selisih pembayaran, diskon penjualan, atau pembulatan transaksi penjualan.",
    sale_vat: "Mencatat kewajiban Pajak Pertambahan Nilai (PPN) yang dipungut dari transaksi penjualan.",
    sale_cogs: "Harga Pokok Penjualan (HPP) untuk mencatat beban biaya barang yang terjual.",
    sale_inventory: "Persediaan barang dagang yang berkurang akibat terjual.",
    receiving_inventory: "Persediaan barang dagang yang bertambah saat barang masuk dari supplier.",
    receiving_ap: "Hutang usaha yang timbul saat menerima barang tempo dari supplier.",
    payment_ap: "Hutang usaha yang berkurang saat melakukan pelunasan ke supplier.",
    payment_cash: "Kas tunai yang berkurang untuk membayar hutang supplier.",
    payment_bank: "Akun bank yang berkurang untuk membayar hutang supplier via transfer.",
    expense_account: "Akun beban/biaya saat mencatat pengeluaran operasional (listrik, gaji, air, dsb).",
    expense_cash: "Kas tunai yang berkurang untuk membayar pengeluaran operasional.",
    expense_bank: "Akun bank yang berkurang untuk membayar beban operasional via transfer.",
    memberpayment_receivable: "Piutang usaha yang berkurang saat member mencicil/melunasi piutangnya.",
    return_ap: "Hutang usaha yang berkurang akibat retur pembelian barang ke supplier.",
    return_inventory: "Persediaan barang dagang yang berkurang akibat retur barang ke supplier.",
    movement_inventory: "Menampung nilai persediaan barang dagang yang disesuaikan dalam transaksi penyesuaian stok.",
    movement_surplus: "Mencatat pendapatan dari selisih lebih persediaan saat dilakukan penyesuaian stok fisik.",
    movement_loss: "Mencatat beban dari selisih kurang (kerugian) persediaan saat dilakukan penyesuaian stok fisik.",
    cashledger_cash: "Akun kas tunai untuk mutasi kas masuk/keluar atau pemindahan dana manual.",
    cashledger_bank: "Akun bank untuk mutasi kas masuk/keluar atau pemindahan dana manual.",
    cashledger_shortage: "Mencatat beban selisih kurang (kekurangan) kas saat penyesuaian dana kasir.",
    cashledger_overage: "Mencatat pendapatan selisih lebih (kelebihan) kas saat penyesuaian dana kasir.",
};

export function CoaMappingRow({
    m,
    coaOptions,
    isDirty,
    isLoadingCoas,
}: CoaMappingRowProps) {
    const fieldName = `${m.transaction_type}:${m.slot}`;

    // Watch current form value to check if it's unconfigured
    const currentValue = useWatch({ name: fieldName });
    const isUnconfigured = !currentValue;

    const label = SLOT_LABELS[m.slot] ?? m.slot;
    const description = SLOT_DESCRIPTIONS[m.slot] ?? "Pemetaan akun untuk transaksi terkait.";

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] items-center gap-4 py-4 px-2 rounded-xl transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-b border-slate-100 last:border-0 dark:border-slate-800/60">
            <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {label}
                    </span>
                    <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        {m.slot}
                    </code>

                    {/* Visual Status Badges */}
                    {isDirty && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-500/20 shadow-sm animate-pulse">
                            <PenTool className="h-3 w-3" />
                            Diubah
                        </span>
                    )}
                    {isUnconfigured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-500/20 shadow-sm">
                            <AlertTriangle className="h-3 w-3 animate-bounce" style={{ animationDuration: "2s" }} />
                            Belum Diatur
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {description}
                </p>
            </div>

            <div className="w-full">
                <FormSelect
                    name={fieldName}
                    options={coaOptions}
                    placeholder="Pilih Akun COA..."
                    searchPlaceholder="Cari berdasarkan kode atau nama..."
                    emptyMessage="Akun COA tidak ditemukan."
                    isLoading={isLoadingCoas}
                    wrapperClassName="w-full"
                    className="w-full dark:bg-slate-900"
                />
            </div>
        </div>
    );
}

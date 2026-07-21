"use client";

import { FormInput } from "@/components/forms/form-input";
import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { Member } from "@/features/members/types";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { IconAlertTriangle, IconUser } from "@tabler/icons-react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface DebtPaymentFormProps {
    selectedMember: Member | null;
    grandTotal: number;
    isProcessing: boolean;
}

export function DebtPaymentForm({
    selectedMember,
    grandTotal,
    isProcessing,
}: DebtPaymentFormProps) {
    const { setValue, control } = useFormContext();
    const cashReceived = useWatch({ control, name: "cashReceived" });
    const cardAmount = useWatch({ control, name: "cardAmount" });
    const cardType = useWatch({ control, name: "cardType" }) || "debit";

    if (!selectedMember) {
        return (
            <div className="bg-rose-50/40 border border-rose-100 p-6 rounded-2xl text-center select-none animate-in fade-in-50 duration-200">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100/80 shadow-sm">
                    <IconAlertTriangle size={18} className="stroke-[2.2]" />
                </div>
                <p className="text-xs font-bold text-rose-900 uppercase tracking-widest">Member Belum Dipilih</p>
                <p className="text-[10px] text-rose-550/90 mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Pembayaran hutang hanya tersedia untuk member terdaftar. Silakan pilih member terlebih dahulu di layar kasir.
                </p>
            </div>
        );
    }

    // const cashNum = Number(cashReceived) || 0;
    const cardAmountNum = Number(cardAmount) || 0;
    // const remainingDebt = grandTotal - cashNum - cardAmountNum;

    return (
        <div className="space-y-2 animate-in fade-in-50 duration-200">
            {/* Selected Member Info Card (Minimalist flat style) */}
            <div className="bg-slate-50 border border-slate-200/50 p-2 rounded-xl flex items-center gap-3 select-none">
                <div className="w-9 h-9 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                    <IconUser size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Member Aktif</span>
                    <h4 className="font-bold text-slate-800 text-xs truncate mt-0.5">{selectedMember.nama}</h4>
                    <span className="text-[9px] text-slate-450 font-mono block mt-0.5">{selectedMember.kode}</span>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Sisa Limit/Hutang</span>
                    <h4 className="font-extrabold text-rose-600 text-xs mt-0.5 tabular-nums">
                        {formatRupiah(selectedMember.hutang || 0)}
                    </h4>
                </div>
            </div>

            {/* DP / Down Payment Input */}
            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Uang Muka / DP (Tunai) - Opsional
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg select-none z-10 font-mono">
                        Rp
                    </span>
                    <FormNominalInput
                        name="cashReceived"
                        placeholder="0"
                        className="h-14 pl-11 pr-20 text-2xl font-black text-slate-900 bg-white border border-slate-200/80 focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20 rounded-xl relative transition-all shadow-sm font-mono tracking-tight"
                        disabled={isProcessing}
                        onValueChange={(val) => {
                            const currentCardAmount = Number(cardAmount) || 0;
                            if (val !== null && (val + currentCardAmount) >= grandTotal) {
                                toast.warning("Total uang muka harus kurang dari total tagihan.");
                                setValue("cashReceived", null);
                            }
                        }}
                        autoFocus
                    />
                    {cashReceived !== null && cashReceived !== undefined && (
                        <button
                            type="button"
                            onClick={() => setValue("cashReceived", null)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-650 px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer select-none z-10 border-none"
                            disabled={isProcessing}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* DP / Down Payment Transfer/Card Input */}
            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Uang Muka / DP (Transfer/Card) - Opsional
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg select-none z-10 font-mono">
                        Rp
                    </span>
                    <FormNominalInput
                        name="cardAmount"
                        placeholder="0"
                        className="h-14 pl-11 pr-20 text-2xl font-black text-slate-900 bg-white border border-slate-200/80 focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20 rounded-xl relative transition-all shadow-sm font-mono tracking-tight"
                        disabled={isProcessing}
                        onValueChange={(val) => {
                            const currentCashReceived = Number(cashReceived) || 0;
                            if (val !== null && (val + currentCashReceived) >= grandTotal) {
                                toast.warning("Total uang muka harus kurang dari total tagihan.");
                                setValue("cardAmount", null);
                            }
                        }}
                    />
                    {cardAmount !== null && cardAmount !== undefined && (
                        <button
                            type="button"
                            onClick={() => setValue("cardAmount", null)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-650 px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer select-none z-10 border-none"
                            disabled={isProcessing}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Card details if cardAmount > 0 */}
            {cardAmountNum > 0 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                    {/* Card Type Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block select-none">
                            Jenis Kartu DP
                        </label>
                        <div className="bg-slate-100/80 p-1 rounded-xl grid grid-cols-2 select-none border border-slate-200/40">
                            <button
                                type="button"
                                onClick={() => setValue("cardType", "debit")}
                                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${cardType === "debit"
                                    ? "bg-white text-slate-900 shadow-sm font-extrabold"
                                    : "bg-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                                disabled={isProcessing}
                            >
                                Debit Card
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue("cardType", "credit")}
                                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${cardType === "credit"
                                    ? "bg-white text-slate-900 shadow-sm font-extrabold"
                                    : "bg-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                                disabled={isProcessing}
                            >
                                Credit Card
                            </button>
                        </div>
                    </div>

                    {/* Inputs Panel */}
                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                                4 Digit Terakhir Kartu (Opsional)
                            </label>
                            <FormInput
                                name="cardLast4"
                                type="text"
                                maxLength={4}
                                placeholder="XXXX"
                                className="h-11 border-slate-200/80 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 rounded-xl text-center font-mono font-bold text-sm tracking-widest"
                                disabled={isProcessing}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                    setValue("cardLast4", val);
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                                No. Referensi EDC (Opsional)
                            </label>
                            <FormInput
                                name="cardRef"
                                type="text"
                                placeholder="Masukkan nomor referensi transaksi..."
                                className="h-11 text-xs border-slate-200/80 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 rounded-xl px-3.5"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Sisa Hutang Baru Breakdown */}
            {/* <div className="bg-rose-50/50 border border-rose-100/50 p-2 rounded-xl text-center select-none">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">
                    Sisa Hutang Baru
                </span>
                <h2 className="text-xl font-black mt-1 tracking-tight tabular-nums text-rose-600">
                    {formatRupiah(remainingDebt)}
                </h2>
            </div> */}
        </div>
    );
}

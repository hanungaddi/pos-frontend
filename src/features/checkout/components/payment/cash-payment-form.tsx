"use client";

import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { useFormContext, useWatch } from "react-hook-form";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { useMemo } from "react";
import { generateCheckoutSuggestions } from "@/lib/cash-suggestions";

interface CashPaymentFormProps {
    grandTotal: number;
    isProcessing: boolean;
}

export function CashPaymentForm({
    grandTotal,
    isProcessing,
}: CashPaymentFormProps) {
    const { setValue, control } = useFormContext();
    const cashReceived = useWatch({ control, name: "cashReceived" });

    // Only values > grandTotal — see src/lib/cash-suggestions.ts
    const suggestions = useMemo(() => generateCheckoutSuggestions(grandTotal), [grandTotal]);


    const cashNum = Number(cashReceived) || 0;
    const isSufficient = cashNum >= grandTotal && cashNum > 0;

    return (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
            {/* Input Nominal */}
            <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-0.5">
                    Uang Diterima
                </label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 font-extrabold text-lg select-none z-10 font-mono transition-colors duration-200">
                        Rp
                    </span>
                    <FormNominalInput
                        name="cashReceived"
                        placeholder="0"
                        className={`h-14 pl-11 pr-20 text-2xl font-black bg-white border-2 rounded-xl relative transition-all shadow-sm font-mono tracking-tight ${
                            isSufficient
                                ? "text-emerald-700 border-emerald-300 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                                : "text-slate-900 border-slate-200/80 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                        }`}
                        disabled={isProcessing}
                        autoFocus
                    />
                    {cashReceived !== null && cashReceived !== undefined && (
                        <button
                            type="button"
                            onClick={() => setValue("cashReceived", null)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-red-50 hover:text-red-600 active:scale-95 text-slate-500 px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer select-none z-10 border-none"
                            disabled={isProcessing}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Suggestions / Quick Cash */}
            <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-0.5 select-none">
                    Pilihan Cepat
                </span>

                <div className="flex flex-wrap gap-2">
                    {/* Button Uang Pas — always first, visually distinct */}
                    {grandTotal > 0 && (
                        <button
                            type="button"
                            onClick={() => setValue("cashReceived", grandTotal)}
                            className={`group/btn h-11 px-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] select-none flex-1 min-w-[100px] flex flex-col items-center justify-center gap-0.5 ${
                                Number(cashReceived) === grandTotal
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]"
                                    : "bg-gradient-to-b from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-150/50 border-emerald-300 text-emerald-700 hover:shadow-md hover:shadow-emerald-500/10 hover:scale-[1.02]"
                            }`}
                            disabled={isProcessing}
                        >
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold leading-none select-none ${
                                Number(cashReceived) === grandTotal ? "text-emerald-100" : "text-emerald-500"
                            }`}>
                                Uang Pas
                            </span>
                            <span className="text-xs font-mono font-extrabold leading-none">
                                {formatRupiah(grandTotal)}
                            </span>
                        </button>
                    )}

                    {/* Denomination suggestion buttons */}
                    {suggestions.map((val, index) => {
                        const isSelected = Number(cashReceived) === val;
                        return (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setValue("cashReceived", val)}
                                className={`h-11 px-3 text-xs font-extrabold rounded-xl border-2 transition-all duration-200 active:scale-[0.97] select-none flex-1 min-w-[85px] flex items-center justify-center font-mono ${
                                    isSelected
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]"
                                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 hover:scale-[1.02]"
                                }`}
                                style={{
                                    animationDelay: `${index * 30}ms`,
                                    animationFillMode: "backwards",
                                }}
                                disabled={isProcessing}
                            >
                                {formatRupiah(val)}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

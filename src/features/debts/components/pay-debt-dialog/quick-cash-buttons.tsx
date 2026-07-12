"use client";

import { formatRupiah } from "@/hooks/use-format-rupiah";

interface QuickCashButtonsProps {
    suggestions: number[];
    currentDebt: number;
    receivedNum: number;
    isPending: boolean;
    onSelect: (val: number) => void;
}

/**
 * "Pilihan Cepat" denomination buttons — rendered only when payMethod === "cash".
 *
 * - First button is always "Uang Pas" (= exact debt amount).
 * - Suggestions below the debt are labelled "Cicilan".
 * - Selected button is highlighted in emerald.
 */
export function QuickCashButtons({
    suggestions,
    currentDebt,
    receivedNum,
    isPending,
    onSelect,
}: QuickCashButtonsProps) {
    return (
        <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                Pilihan Cepat
            </span>

            <div className="flex flex-wrap gap-1.5">
                {/* "Uang Pas" — always first, distinct style */}
                <button
                    type="button"
                    onClick={() => onSelect(currentDebt)}
                    className={`h-10 px-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] select-none flex-1 min-w-[90px] flex flex-col items-center justify-center gap-0.5 ${
                        receivedNum === currentDebt
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.01]"
                            : "bg-gradient-to-b from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-150/50 border-emerald-300 text-emerald-700 hover:shadow-md hover:shadow-emerald-500/10 hover:scale-[1.01]"
                    }`}
                    disabled={isPending}
                >
                    <span className={`text-[8px] uppercase tracking-wider font-extrabold leading-none select-none ${
                        receivedNum === currentDebt ? "text-emerald-100" : "text-emerald-500"
                    }`}>
                        Uang Pas
                    </span>
                    <span className="text-[11px] font-mono font-extrabold leading-none">
                        {formatRupiah(currentDebt)}
                    </span>
                </button>

                {/* Denomination suggestion buttons */}
                {suggestions.map((val, index) => {
                    const isSelected  = receivedNum === val;
                    const isBelowDebt = val < currentDebt;
                    return (
                        <button
                            key={val}
                            type="button"
                            onClick={() => onSelect(val)}
                            className={`h-10 px-2.5 text-[11px] font-extrabold rounded-xl border-2 transition-all duration-200 active:scale-[0.97] select-none flex-1 min-w-[72px] flex flex-col items-center justify-center gap-0.5 font-mono ${
                                isSelected
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.01]"
                                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm hover:scale-[1.01]"
                            }`}
                            style={{ animationDelay: `${index * 25}ms`, animationFillMode: "backwards" }}
                            disabled={isPending}
                        >
                            {isBelowDebt && !isSelected && (
                                <span className="text-[7px] uppercase tracking-wider font-extrabold text-amber-500 leading-none">
                                    Cicilan
                                </span>
                            )}
                            <span className={isBelowDebt && !isSelected ? "leading-none" : ""}>
                                {formatRupiah(val)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

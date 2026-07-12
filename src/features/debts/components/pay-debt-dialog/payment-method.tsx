"use client";

import { Input } from "@/components/ui/input";
import { IconCash, IconCreditCard } from "@tabler/icons-react";
import type { CardType, PayMethod } from "../../types/types";

// ─── PayMethodToggle ──────────────────────────────────────────────────────────

interface PayMethodToggleProps {
    payMethod: PayMethod;
    isPending: boolean;
    onChange: (method: PayMethod) => void;
}

/** Cash / Card toggle buttons. */
export function PayMethodToggle({ payMethod, isPending, onChange }: PayMethodToggleProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => onChange("cash")}
                    className={`h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border ${payMethod === "cash"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                    disabled={isPending}
                >
                    <IconCash size={14} /> Tunai (Cash)
                </button>
                <button
                    type="button"
                    onClick={() => onChange("card")}
                    className={`h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border ${payMethod === "card"
                            ? "bg-slate-700 text-white border-slate-700 shadow-sm shadow-slate-700/20"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                    disabled={isPending}
                >
                    <IconCreditCard size={14} /> Kartu / EDC
                </button>
            </div>
        </div>
    );
}

// ─── CardFields ───────────────────────────────────────────────────────────────

interface CardFieldsProps {
    cardType: CardType;
    cardLast4: string;
    cardRef: string;
    isPending: boolean;
    onCardTypeChange: (type: CardType) => void;
    onLast4Change: (val: string) => void;
    onRefChange: (val: string) => void;
}

/** Card / EDC detail fields (jenis, 4 digit terakhir, referensi). */
export function CardFields({
    cardType,
    cardLast4,
    cardRef,
    isPending,
    onCardTypeChange,
    onLast4Change,
    onRefChange,
}: CardFieldsProps) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            {/* Jenis Kartu toggle */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Jenis Kartu
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {(["debit", "kredit"] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => onCardTypeChange(t)}
                            className={`h-8 text-[11px] font-bold rounded-lg cursor-pointer transition-all border ${cardType === t
                                    ? "bg-slate-700 text-white border-slate-700"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                                }`}
                            disabled={isPending}
                        >
                            {t === "debit" ? "Debit" : "Kredit"}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4 Digit Terakhir + Ref EDC side-by-side */}
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        4 Digit Terakhir{" "}
                        <span className="text-slate-300 font-normal">(opsional)</span>
                    </label>
                    <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="XXXX"
                        className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-lg tracking-widest text-center font-mono bg-white"
                        value={cardLast4}
                        onChange={(e) => onLast4Change(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Ref EDC{" "}
                        <span className="text-slate-300 font-normal">(opsional)</span>
                    </label>
                    <Input
                        type="text"
                        placeholder="No. referensi..."
                        className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-lg bg-white"
                        value={cardRef}
                        onChange={(e) => onRefChange(e.target.value)}
                        disabled={isPending}
                    />
                </div>
            </div>
        </div>
    );
}

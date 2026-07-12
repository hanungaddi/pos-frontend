"use client";

import type { Member } from "@/features/members/types";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import {
    IconUser
} from "@tabler/icons-react";
import type { CardType, PayMethod } from "../../types/types";

interface SummaryPanelProps {
    member: Member;
    currentDebt: number;
    receivedNum: number;
    actualPayAmount: number;
    kembalian: number;
    sisaHutang: number;
    isLunas: boolean;
    progressPct: number;
    payMethod: PayMethod;
    cardType: CardType;
    cardLast4: string;
    isValid: boolean;
}

/**
 * Right-side summary panel — desktop only (hidden on mobile via `hidden sm:flex`).
 * Shows member info card, debt breakdown, payment method indicator, and validation badge.
 */
export function SummaryPanel({
    member,
    currentDebt,
    receivedNum,
    actualPayAmount,
    kembalian,
    sisaHutang,
    isLunas,
    progressPct,
}: SummaryPanelProps) {
    return (
        <div className="hidden sm:flex flex-col gap-3">

            {/* Member card */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-3.5 text-white relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
                <div className="absolute -bottom-3 -left-3 w-14 h-14 bg-emerald-500/10 rounded-full" />
                <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                        <IconUser size={15} className="text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Member</p>
                    <p className="text-sm font-extrabold text-white leading-tight mt-0.5 truncate">{member.nama}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{member.kode}</p>
                </div>
            </div>

            {/* Debt breakdown card */}
            <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-3 flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan</p>

                {/* Progress bar */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Hutang</span>
                        <span className="font-extrabold text-rose-600 tabular-nums">{formatRupiah(currentDebt)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isLunas ? "bg-emerald-500" : "bg-emerald-400"}`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-right text-slate-400 tabular-nums">{progressPct}% terbayar</p>
                </div>

                {/* Line items */}
                <div className="border-t border-slate-100 pt-2.5 space-y-2">
                    {receivedNum > 0 && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Uang Diterima</span>
                            <span className="font-bold tabular-nums text-slate-700">{formatRupiah(receivedNum)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Dibayar</span>
                        <span className={`font-bold tabular-nums ${actualPayAmount > 0 ? "text-emerald-600" : "text-slate-300"}`}>
                            {formatRupiah(actualPayAmount)}
                        </span>
                    </div>
                    {kembalian > 0 && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Kembalian</span>
                            <span className="font-bold tabular-nums text-slate-700">{formatRupiah(kembalian)}</span>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-1.5" />

                    {/* Sisa hutang */}
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Sisa Hutang</span>
                        {isLunas ? (
                            <span className="text-[10px] font-extrabold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
                                LUNAS ✓
                            </span>
                        ) : (
                            <span className={`text-xs font-extrabold tabular-nums ${actualPayAmount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                {formatRupiah(Math.max(0, sisaHutang))}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

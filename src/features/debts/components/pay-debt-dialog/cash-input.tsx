"use client";

import { Input } from "@/components/ui/input";
import type { Member } from "@/features/members/types";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { IconArrowRight, IconCheck, IconUser } from "@tabler/icons-react";

// ─── MemberInfoStrip ──────────────────────────────────────────────────────────

interface MemberInfoStripProps {
    member: Member;
    currentDebt: number;
}

/** Compact member info strip — shown only on mobile (sm:hidden). */
export function MemberInfoStrip({ member, currentDebt }: MemberInfoStripProps) {
    return (
        <div className="sm:hidden bg-gradient-to-r from-rose-50 to-slate-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                <IconUser size={15} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{member.nama}</p>
                <p className="text-[10px] text-slate-400">{member.kode}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Hutang</p>
                <p className="text-sm font-extrabold text-rose-600 tabular-nums">{formatRupiah(currentDebt)}</p>
            </div>
        </div>
    );
}

// ─── CashInput ────────────────────────────────────────────────────────────────

interface CashInputProps {
    cashReceived: string;
    currentDebt: number;
    isLunas: boolean;
    isCicilan: boolean;
    kembalian: number;
    actualPayAmount: number;
    isPending: boolean;
    onChangeReceived: (val: string) => void;
    onSetExact: () => void;
}

/** Single "Uang Diterima" input with realtime status badge (flex-col). */
export function CashInput({
    cashReceived,
    isLunas,
    isCicilan,
    isPending,
    onChangeReceived,
    onSetExact,
}: CashInputProps) {
    const receivedNum = Number(cashReceived) || 0;

    const statusColor = isLunas
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : isCicilan
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-slate-50 border-slate-100 text-slate-500";

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Uang Diterima dari Member
            </label>

            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">
                    Rp
                </span>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    autoFocus
                    className="h-12 pl-9 pr-[84px] font-extrabold text-slate-800 text-base border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                    value={cashReceived ? new Intl.NumberFormat("id-ID").format(Number(cashReceived)) : ""}
                    onChange={(e) => onChangeReceived(e.target.value.replace(/\D/g, ""))}
                    disabled={isPending}
                />
                <button
                    type="button"
                    onClick={onSetExact}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-emerald-100 whitespace-nowrap"
                    disabled={isPending}
                >
                    Pas / Lunas
                </button>
            </div>

            {/* Realtime status badge */}
            {receivedNum > 0 && (
                <div className={`flex flex-col gap-1 rounded-xl px-3 py-2.5 border text-xs font-bold transition-all ${statusColor}`}>
                    <div className="flex items-center gap-1.5">
                        {isLunas
                            ? <><IconCheck size={13} className="shrink-0" /> Hutang Lunas</>
                            : <><IconArrowRight size={13} className="shrink-0" /> Bayar Cicilan</>
                        }
                    </div>

                </div>
            )}
        </div>
    );
}

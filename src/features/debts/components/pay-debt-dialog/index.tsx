"use client";

import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePayMemberDebt, type PayDebtPayload } from "@/features/members/api/members-api";
import type { Member } from "@/features/members/types";
import { generateDebtSuggestions } from "@/lib/cash-suggestions";
import { db } from "@/lib/db";
import { IconCheck, IconLoader2, IconReceipt } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MemberInfoStrip, CashInput } from "./cash-input";
import { CardFields, PayMethodToggle } from "./payment-method";
import { QuickCashButtons } from "./quick-cash-buttons";
import { SummaryPanel } from "./summary-panel";
import type { CardType, PayMethod } from "../../types/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PayDebtDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    onSuccess?: (updatedMember: Member) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PayDebtDialog({ open, onOpenChange, member, onSuccess }: PayDebtDialogProps) {
    const payDebtMutation = usePayMemberDebt();

    // ── Form state ────────────────────────────────────────────────────────────
    const [cashReceived, setCashReceived] = useState("");
    const [payMethod, setPayMethod] = useState<PayMethod>("cash");
    const [cardType, setCardType] = useState<CardType>("debit");
    const [cardLast4, setCardLast4] = useState("");
    const [cardRef, setCardRef] = useState("");
    const [catatan, setCatatan] = useState("");

    // Reset form every time the dialog opens for a (new) member
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open && member) {
            setCashReceived((member.hutang || 0).toString());
            setPayMethod("cash");
            setCardLast4("");
            setCardRef("");
            setCatatan("");
            setCardType("debit");
        }
    }, [open, member]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // ── Derived values (computed before early return so useMemo is safe) ──────
    const currentDebt = member?.hutang || 0;
    const cashSuggestions = useMemo(() => generateDebtSuggestions(currentDebt), [currentDebt]);

    if (!member) return null;

    const receivedNum = Number(cashReceived) || 0;
    const actualPayAmount = Math.min(receivedNum, currentDebt);
    const kembalian = receivedNum > currentDebt ? receivedNum - currentDebt : 0;
    const sisaHutang = currentDebt - actualPayAmount;
    const isLunas = actualPayAmount > 0 && sisaHutang <= 0;
    const isCicilan = actualPayAmount > 0 && sisaHutang > 0;
    const progressPct = currentDebt > 0
        ? Math.min(100, Math.round((actualPayAmount / currentDebt) * 100))
        : 0;

    const isValid = actualPayAmount > 0;
    const isPending = payDebtMutation.isPending;

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        const payload: PayDebtPayload = {
            amount: actualPayAmount,
            metode_pembayaran: payMethod,
            catatan: catatan || undefined,
        };

        if (payMethod === "cash") {
            payload.cash_received = receivedNum;
        } else {
            payload.jenis_kartu = cardType;
            payload.nomor_kartu_akhir = cardLast4 || undefined;
            payload.referensi_edc = cardRef || undefined;
        }

        payDebtMutation.mutate(
            { uid: member.uid, data: payload },
            {
                onSuccess: (res) => {
                    toast.success(`Pembayaran hutang ${member.nama} berhasil!`);
                    onOpenChange(false);
                    if (res.data?.member) {
                        const updatedMember = res.data.member;
                        db.members
                            .update(updatedMember.uid, {
                                hutang: updatedMember.hutang || 0,
                                poin: updatedMember.poin || 0,
                            })
                            .catch((err) => console.warn("Gagal update IndexedDB:", err));
                        onSuccess?.(updatedMember);
                    }
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal mencatat pembayaran hutang.");
                },
            }
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <IconReceipt size={17} className="text-emerald-500" />
                    <span>Bayar Hutang Member</span>
                </div>
            }
            className="sm:max-w-[660px] w-full"
            scrollable
        >
            <form onSubmit={handleSubmit} className="pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_210px] gap-4">

                    {/* ── Left: Form ── */}
                    <div className="space-y-3">
                        <MemberInfoStrip member={member} currentDebt={currentDebt} />

                        <PayMethodToggle
                            payMethod={payMethod}
                            isPending={isPending}
                            onChange={setPayMethod}
                        />

                        <CashInput
                            cashReceived={cashReceived}
                            currentDebt={currentDebt}
                            isLunas={isLunas}
                            isCicilan={isCicilan}
                            kembalian={kembalian}
                            actualPayAmount={actualPayAmount}
                            isPending={isPending}
                            onChangeReceived={setCashReceived}
                            onSetExact={() => setCashReceived(currentDebt.toString())}
                        />

                        {payMethod === "cash" && (
                            <QuickCashButtons
                                suggestions={cashSuggestions}
                                currentDebt={currentDebt}
                                receivedNum={receivedNum}
                                isPending={isPending}
                                onSelect={(val) => setCashReceived(val.toString())}
                            />
                        )}

                        {payMethod === "card" && (
                            <CardFields
                                cardType={cardType}
                                cardLast4={cardLast4}
                                cardRef={cardRef}
                                isPending={isPending}
                                onCardTypeChange={setCardType}
                                onLast4Change={setCardLast4}
                                onRefChange={setCardRef}
                            />
                        )}

                        {/* Catatan */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Catatan{" "}
                                <span className="text-slate-300 font-normal text-[9px]">(opsional)</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="Mis: cicilan ke-1, pelunasan tagihan Jul..."
                                className="h-9 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {/* ── Right: Summary Panel ── */}
                    <SummaryPanel
                        member={member}
                        currentDebt={currentDebt}
                        receivedNum={receivedNum}
                        actualPayAmount={actualPayAmount}
                        kembalian={kembalian}
                        sisaHutang={sisaHutang}
                        isLunas={isLunas}
                        progressPct={progressPct}
                        payMethod={payMethod}
                        cardType={cardType}
                        cardLast4={cardLast4}
                        isValid={isValid}
                    />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 justify-end w-full mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-9 border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
                        disabled={isPending}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isValid || isPending}
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border-none cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                    >
                        {isPending
                            ? <><IconLoader2 size={13} className="animate-spin" /> Memproses...</>
                            : <><IconCheck size={13} /> Simpan Pembayaran</>
                        }
                    </Button>
                </div>
            </form>
        </BaseDialog>
    );
}

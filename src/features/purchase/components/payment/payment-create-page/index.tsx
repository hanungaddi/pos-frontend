"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/hooks/use-app-router";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { AlertTriangle } from "lucide-react";
import {
    useCreatePayment,
    useUpdatePayment,
    useCashAccounts,
    useOutstandingReceivings,
    usePaymentSummary,
    usePaymentDetail,
} from "../../../api/purchase-api";
import { paymentSchema, type PaymentInput } from "../../../schemas/payment-schema";
import { PaymentForm } from "./payment-form";
import { DebtSummary } from "./debt-summary";
import { todayStr, formatToISO, formatUTC } from "@/lib/date-utils";

export function PaymentCreatePage() {
    const router = useAppRouter();
    const searchParams = useSearchParams();
    const editIdParam = searchParams.get("edit");
    const editId = editIdParam || null;
    const isEdit = editId !== null && editId !== "";
    const preselectedReceivingId = searchParams.get("receiving_uid");
    const fromParam = searchParams.get("from");
    const backUrl = fromParam ? decodeURIComponent(fromParam) : "/admin/purchase/payment";

    // Block editing completely
    useEffect(() => {
        if (isEdit) {
            toast.error("Pembayaran yang sudah disimpan tidak dapat diubah.");
            router.push(backUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, router]);

    const createPayment = useCreatePayment();
    const updatePayment = useUpdatePayment();
    const { data: cashAccounts = [], isLoading: cashAccountsLoading } = useCashAccounts();
    const { data: outstandingReceivings = [], isLoading: receivingsLoading } = useOutstandingReceivings();

    // Confirm dialog states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<PaymentInput | null>(null);

    // Fetch payment detail if in edit mode
    const { data: editingPayment, isLoading: editingPaymentLoading } = usePaymentDetail(editId);

    const methods = useForm<PaymentInput>({
        resolver: zodResolver(paymentSchema) as Resolver<PaymentInput>,
        defaultValues: {
            receiving_uid: "",
            jumlah_bayar: 0,
            tanggal_bayar: todayStr(),
            cash_account_uid: "",
            metode_pembayaran: "Cash",
            nomor_referensi: "",
            catatan: "",
        },
    });

    const {
        handleSubmit,
        setValue,
        reset,
    } = methods;

    const selectedReceivingId = useWatch({ name: "receiving_uid", control: methods.control });

    // Fetch summary for selected receiving
    const { data: summary, isLoading: summaryLoading } = usePaymentSummary(
        selectedReceivingId || null
    );

    // Sync editing payment data into form defaults
    useEffect(() => {
        if (isEdit && editingPayment) {
            reset({
                receiving_uid: editingPayment.referensi_uid,
                jumlah_bayar: editingPayment.total,
                tanggal_bayar: formatToISO(editingPayment.created_at),
                cash_account_uid: editingPayment.cash_account_uid,
                metode_pembayaran: editingPayment.metode_pembayaran,
                nomor_referensi: editingPayment.nomor_referensi || "",
                catatan: editingPayment.catatan || "",
            });
        }
    }, [isEdit, editingPayment, reset]);

    // Pre-fill receiving_uid if provided in query string
    useEffect(() => {
        if (!isEdit && preselectedReceivingId) {
            setValue("receiving_uid", preselectedReceivingId);
        }
    }, [preselectedReceivingId, isEdit, setValue]);

    // Handle outstanding receivings options list
    const receivingOptions = outstandingReceivings.map((r) => {
        const sisaHutangVal = r.sisa_hutang !== undefined ? r.sisa_hutang : (r.nilai_faktur || 0);
        return {
            value: r.uid,
            label: `${r.nomor_penerimaan} - ${r.supplier_relationship?.nama || r.supplier || "Tanpa Supplier"}`,
            description: `Sisa Hutang: ${formatRupiah(sisaHutangVal)}`,
        };
    });

    // If editing, make sure the current receiving is in options
    if (isEdit && editingPayment && !receivingOptions.some(o => o.value === editingPayment.referensi_uid)) {
        const editSisaHutang = editingPayment.stock_receiving?.sisa_hutang !== undefined
            ? editingPayment.stock_receiving.sisa_hutang
            : (editingPayment.stock_receiving?.nilai_faktur || 0);
        receivingOptions.push({
            value: editingPayment.referensi_uid,
            label: `${editingPayment.stock_receiving?.nomor_penerimaan || "Penerimaan"} - ${editingPayment.stock_receiving?.supplier_relationship?.nama || editingPayment.stock_receiving?.supplier || "Supplier"}`,
            description: `Sisa Hutang: ${formatRupiah(editSisaHutang)}`,
        });
    }

    const cashAccountOptions = cashAccounts.map((acc) => ({
        value: acc.uid,
        label: `${acc.nama} (${formatRupiah(acc.saldo)})`,
    }));

    const paymentMethodOptions = [
        { value: "Cash", label: "Cash / Tunai" },
        { value: "Transfer", label: "Transfer Bank" },
        { value: "Giro", label: "Giro" },
    ];

    // Auto fill nominal when receiving is selected (only for create mode)
    useEffect(() => {
        if (!isEdit && selectedReceivingId) {
            const rec = outstandingReceivings.find((r) => r.uid === selectedReceivingId);
            if (rec) {
                // Default to remaining debt if sisa_hutang is available, otherwise nilai_faktur
                const defaultAmount = rec.sisa_hutang !== undefined ? rec.sisa_hutang : (rec.nilai_faktur || 0);
                setValue("jumlah_bayar", defaultAmount);
            }
        }
    }, [selectedReceivingId, isEdit, setValue, outstandingReceivings]);

    const isPending = createPayment.isPending || updatePayment.isPending;
    const showPageLoading = isEdit && editingPaymentLoading;

    // Calculate dynamic sisa_hutang for validation
    // If edit: sisa_hutang without current payment = current_sisa_hutang + editingPayment.total
    const selectedReceiving = outstandingReceivings.find((r) => r.uid === selectedReceivingId);
    const sisaHutangLimit = summary
        ? isEdit && editingPayment
            ? summary.sisa_hutang + editingPayment.total
            : summary.sisa_hutang
        : (selectedReceiving
            ? (selectedReceiving.sisa_hutang !== undefined ? selectedReceiving.sisa_hutang : (selectedReceiving.nilai_faktur || 0))
            : 0);

    const onSubmit = (data: PaymentInput) => {
        // Validate sisa_hutang limit
        if (summary) {
            if (data.jumlah_bayar > sisaHutangLimit) {
                toast.error(`Nominal pembayaran melebihi sisa hutang (Maksimal ${formatRupiah(sisaHutangLimit)})`);
                return;
            }
        }

        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;

        const payload = {
            ...pendingData,
            receiving_uid: pendingData.receiving_uid,
            jumlah_bayar: Number(pendingData.jumlah_bayar),
            cash_account_uid: pendingData.cash_account_uid,
            tanggal_bayar: formatUTC(pendingData.tanggal_bayar),
        };

        try {
            await createPayment.mutateAsync(payload);
            toast.success("Pembayaran supplier berhasil dicatat.");
            setIsConfirmOpen(false);
            router.push(backUrl);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Gagal mencatat pembayaran.";
            toast.error(message);
        }
    };

    if (showPageLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48 rounded" />
                        <Skeleton className="h-4 w-64 rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                    </div>
                    <div>
                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    onClick={() => router.push(backUrl)}
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 bg-white cursor-pointer"
                >
                    <IconArrowLeft size={18} />
                </Button>
                <div>
                    <h2 className="text-base font-bold text-slate-900">
                        {isEdit ? "Ubah Pembayaran Supplier" : "Catat Pembayaran Supplier Baru"}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isEdit
                            ? `Ubah data transaksi pembayaran ${editingPayment?.nomor_transaksi || ""}`
                            : "Catat transaksi pembayaran hutang dagang kepada supplier atas penerimaan barang."}
                    </p>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Column */}
                <div className="lg:col-span-2">
                    <FormProvider {...methods}>
                        <PaymentForm
                            onSubmit={handleSubmit(onSubmit)}
                            isPending={isPending}
                            isEdit={isEdit}
                            receivingOptions={receivingOptions}
                            cashAccountOptions={cashAccountOptions}
                            paymentMethodOptions={paymentMethodOptions}
                            receivingsLoading={receivingsLoading}
                            cashAccountsLoading={cashAccountsLoading}
                            onCancel={() => router.push(backUrl)}
                        />
                    </FormProvider>
                </div>

                {/* Debt Summary Column */}
                <div>
                    <DebtSummary
                        selectedReceivingId={selectedReceivingId}
                        summaryLoading={summaryLoading}
                        summary={summary}
                        isEdit={isEdit}
                        editId={editId}
                        sisaHutangLimit={sisaHutangLimit}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Konfirmasi Pembayaran"
                description={
                    <div className="mt-3 space-y-4 text-left w-full">
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Apakah Anda yakin ingin menyimpan transaksi pembayaran supplier ini? Periksa kembali rincian di bawah:
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3.5 space-y-2.5 font-sans">
                            {/* Outstanding Debt */}
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Total Hutang</span>
                                <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">
                                    {formatRupiah(sisaHutangLimit)}
                                </span>
                            </div>

                            {/* Paid Amount */}
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Jumlah Dibayar</span>
                                <span className="text-emerald-650 dark:text-emerald-400 font-mono font-bold">
                                    {formatRupiah(pendingData?.jumlah_bayar || 0)}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200/60 dark:border-slate-800/80 my-1" />

                            {/* Remaining Debt / Status */}
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Sisa Hutang</span>
                                {sisaHutangLimit - (pendingData?.jumlah_bayar || 0) > 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                                        {formatRupiah(sisaHutangLimit - (pendingData?.jumlah_bayar || 0))}
                                    </span>
                                ) : (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                        Lunas
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl flex gap-2.5 items-start">
                            <AlertTriangle className="text-rose-600 dark:text-rose-455 shrink-0 mt-0.5" size={15} />
                            <p className="text-[10px] text-rose-700 dark:text-rose-350 leading-relaxed font-semibold">
                                Setelah disimpan, data pembayaran tidak dapat diubah atau dihapus kembali.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Ya, Simpan"
                cancelText="Batal"
                variant="warning"
                onConfirm={handleConfirmSave}
                isLoading={createPayment.isPending}
            />
        </div>
    );
}

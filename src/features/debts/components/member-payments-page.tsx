"use client";

import { FilterForm } from "@/components/forms/filter-form";
import { FormInput } from "@/components/forms/form-input";
import { DataTable } from "@/components/ui/data-table";
import { hasPermission, hasRole } from "@/constants/roles";
import { useMemberPayments, useVoidMemberDebtPayment, type MemberPayment } from "@/features/members/api/members-api";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { IconCash, IconUser, IconCalendar, IconCreditCard } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MemberPaymentVoidDialog } from "./member-payment-void-dialog";

interface MemberPaymentsFilterValues {
    search: string;
}

export function MemberPaymentsPage() {
    const { data: session } = useSession();
    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];

    const hasViewMembers =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "view_members");

    const hasManageMembers =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "manage_members");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [appliedFilters, setAppliedFilters] = useState<{
        search?: string;
    }>(() => ({}));

    const [voidPayment, setVoidPayment] = useState<MemberPayment | null>(null);
    const [isVoidOpen, setIsVoidOpen] = useState(false);

    const voidPaymentMutation = useVoidMemberDebtPayment();

    const filterMethods = useForm<MemberPaymentsFilterValues>({
        defaultValues: {
            search: "",
        },
    });

    const handleFilterSubmit = (data: MemberPaymentsFilterValues) => {
        setAppliedFilters({
            search: data.search || undefined,
        });
        setPage(1);
    };

    const handleFilterReset = () => {
        filterMethods.reset({
            search: "",
        });
        setAppliedFilters({});
        setPage(1);
    };

    const handleDelete = (payment: MemberPayment) => {
        setVoidPayment(payment);
        setIsVoidOpen(true);
    };

    const handleConfirmVoid = (alasan: string) => {
        if (!voidPayment) return;
        const memberUid = voidPayment.member_uid || voidPayment.member?.uid;
        if (!memberUid) {
            toast.error("Data member tidak ditemukan untuk pembayaran ini.");
            return;
        }

        voidPaymentMutation.mutate(
            {
                memberUid,
                paymentUid: voidPayment.uid,
                data: { alasan },
            },
            {
                onSuccess: () => {
                    toast.success("Pembayaran hutang member berhasil dibatalkan (void).");
                    setIsVoidOpen(false);
                    setVoidPayment(null);
                },
                onError: (err) => {
                    toast.error(
                        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                        err.message ||
                        "Gagal membatalkan pembayaran hutang member."
                    );
                },
            }
        );
    };

    const { data: paymentsData, isLoading, isFetching } = useMemberPayments({
        page,
        per_page: perPage,
        ...appliedFilters,
    });

    const payments = paymentsData?.data || [];

    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
        } catch {
            return dateString;
        }
    };

    if (!hasViewMembers) {
        return (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-sm font-bold text-slate-800">Akses Ditolak</p>
                <p className="text-xs text-slate-400 mt-1">
                    Anda tidak memiliki izin untuk melihat data pembayaran hutang member.
                </p>
            </div>
        );
    }

    const columns: ColumnDef<MemberPayment>[] = [
        {
            accessorKey: "tanggal_bayar",
            header: "Tanggal Bayar",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconCalendar size={14} className="text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-600">
                        {formatDateTime(row.original.tanggal_bayar)}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "nomor_pembayaran",
            header: "No. Pembayaran",
            cell: ({ row }) => (
                <span className="font-bold text-slate-800 font-mono text-xs">
                    {row.original.nomor_pembayaran}
                </span>
            ),
        },
        {
            id: "member",
            header: "Member",
            cell: ({ row }) => {
                const member = row.original.member;
                if (!member) return <span className="text-slate-400 text-xs">-</span>;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 leading-tight">{member.nama}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{member.kode}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "cash_account",
            header: "Kas & Bank",
            cell: ({ row }) => {
                const account = row.original.cash_account;
                if (!account) return <span className="text-slate-400 text-xs">-</span>;
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 leading-tight">{account.nama}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{account.tipe}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "metode_pembayaran",
            header: "Metode",
            cell: ({ row }) => {
                const isCash = row.original.metode_pembayaran === "cash";
                return (
                    <span
                        className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 ${isCash
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-sky-50 text-sky-700 border-sky-100"
                            }`}
                    >
                        {isCash ? (
                            <>
                                <IconCash size={10} /> Tunai
                            </>
                        ) : (
                            <>
                                <IconCreditCard size={10} /> Kartu/EDC
                            </>
                        )}
                    </span>
                );
            },
        },
        {
            accessorKey: "jumlah_bayar",
            header: "Jumlah Bayar",
            meta: {
                headerClassName: "text-right",
                cellClassName: "text-right font-extrabold text-emerald-600 tabular-nums text-xs",
            },
            cell: ({ row }) => formatRupiah(row.original.jumlah_bayar),
        },
        {
            id: "mutasi_hutang",
            header: "Mutasi Hutang",
            meta: {
                headerClassName: "text-right",
                cellClassName: "text-right font-semibold text-slate-500 tabular-nums text-[11px]",
            },
            cell: ({ row }) => {
                const sebelum = row.original.hutang_sebelum || 0;
                const sesudah = row.original.hutang_sesudah || 0;
                return (
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <span>{formatRupiah(sebelum)}</span>
                            <span>&rarr;</span>
                        </div>
                        <span className="font-extrabold text-slate-700">{formatRupiah(sesudah)}</span>
                    </div>
                );
            },
        },
        {
            id: "user",
            header: "Kasir",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <IconUser size={12} className="text-slate-400" />
                    <span>{row.original.user?.name || "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status?.toLowerCase();
                const isVoid = status === "void" || status === "voided" || status === "batal" || status === "cancelled";
                return (
                    <span
                        className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 ${isVoid
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}
                    >
                        {isVoid ? "Void" : "Sukses"}
                    </span>
                );
            },
        },
        {
            accessorKey: "catatan",
            header: "Catatan",
            cell: ({ row }) => (
                <span className="text-slate-500 font-medium text-xs block max-w-[150px] truncate" title={row.original.catatan || ""}>
                    {row.original.catatan || "-"}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* List Table & Filter Section */}
            <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50">
                    <div>
                        <h4 className="text-xs font-bold text-slate-800">Daftar Pembayaran Hutang Member</h4>
                        <p className="text-[10px] text-slate-400">Gunakan kolom cari member untuk memfilter data.</p>
                    </div>
                </div>

                <FilterForm
                    methods={filterMethods}
                    onSubmit={handleFilterSubmit}
                    onReset={handleFilterReset}
                >
                    <FormInput<MemberPaymentsFilterValues>
                        name="search"
                        label="Cari Member"
                        placeholder="Nama atau kode member..."
                    />
                </FilterForm>

                <DataTable
                    columns={columns}
                    data={payments}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    emptyMessage="Tidak ada data pembayaran hutang yang ditemukan."
                    page={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={(newPerPage) => {
                        setPerPage(newPerPage);
                        setPage(1);
                    }}
                    meta={paymentsData?.meta}
                    entityName="pembayaran hutang member"
                    virtualize={true}
                    estimateRowHeight={52}
                    onDelete={handleDelete}
                    hideDelete={(p) => {
                        const status = p.status?.toLowerCase();
                        const isAlreadyVoid = status === "void" || status === "voided" || status === "batal" || status === "cancelled";
                        return !hasManageMembers || isAlreadyVoid;
                    }}
                />

                <MemberPaymentVoidDialog
                    open={isVoidOpen}
                    onOpenChange={setIsVoidOpen}
                    payment={voidPayment}
                    onConfirm={handleConfirmVoid}
                    isLoading={voidPaymentMutation.isPending}
                />
            </section>
        </div>
    );
}

export default MemberPaymentsPage;


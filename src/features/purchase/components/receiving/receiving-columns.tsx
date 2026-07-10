import { formatRupiah } from "@/hooks/use-format-rupiah";
import type { ColumnDef } from "@tanstack/react-table";
import type { Receiving } from "../../types";
import { formatToReadableDateTime } from "@/lib/date-utils";
import {
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_CLASSES,
    type PaymentStatus,
    RECEIVING_STATUS_LABELS,
    RECEIVING_STATUS_CLASSES,
    type ReceivingStatus,
} from "@/constants/purchase";

export const receivingColumns: ColumnDef<Receiving>[] = [
    {
        accessorKey: "created_at",
        header: "Tanggal",
        cell: ({ row }) => (
            <span className="text-slate-600 font-medium text-xs">
                {formatToReadableDateTime(row.original.created_at)}
            </span>
        ),
        size: 160,
    },
    {
        accessorKey: "nomor_penerimaan",
        header: "No. Penerimaan",
        cell: ({ row }) => (
            <span className="font-bold text-slate-900 text-xs">
                {row.original.nomor_penerimaan}
            </span>
        ),
        size: 160,
    },
    {
        accessorKey: "purchase_order_uid",
        header: "Sumber",
        cell: ({ row }) => {
            const isFromPo = !!row.original.purchase_order_uid;
            return (
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isFromPo
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : "bg-slate-50 text-slate-700 border-slate-100"
                    }`}
                >
                    {isFromPo ? "Dari PO" : "Langsung"}
                </span>
            );
        },
        size: 100,
    },
    {
        accessorKey: "supplier",
        header: "Supplier",
        enableSorting: false,
        cell: ({ row }) => {
            const relation = row.original.supplier_relationship;
            return (
                <span className="font-semibold text-slate-800 text-xs">
                    {relation ? relation.nama : row.original.supplier || "-"}
                </span>
            );
        },
        size: 240,
    },
    {
        accessorKey: "nomor_faktur",
        header: "Faktur",
        cell: ({ row }) => (
            <span className="text-slate-600 text-xs font-medium">
                {row.original.nomor_faktur || "-"}
            </span>
        ),
        size: 160,
    },
    {
        accessorKey: "nilai_faktur",
        header: "Nilai Faktur",
        cell: ({ row }) => (
            <span className="text-slate-700 text-xs font-semibold">
                {row.original.nilai_faktur !== null
                    ? formatRupiah(row.original.nilai_faktur)
                    : "-"}
            </span>
        ),
        size: 120,
    },
    {
        accessorKey: "status_pembayaran",
        header: "Pembayaran",
        cell: ({ row }) => {
            const status = row.original.status_pembayaran as PaymentStatus;
            return (
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        PAYMENT_STATUS_CLASSES[status] || "bg-slate-50 text-slate-700 border-slate-100"
                    }`}
                >
                    {PAYMENT_STATUS_LABELS[status] || status}
                </span>
            );
        },
        size: 120,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status as ReceivingStatus;
            return (
                <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        RECEIVING_STATUS_CLASSES[status] || "bg-slate-50 text-slate-700"
                    }`}
                >
                    {RECEIVING_STATUS_LABELS[status] || status}
                </span>
            );
        },
        size: 80,
    },
];

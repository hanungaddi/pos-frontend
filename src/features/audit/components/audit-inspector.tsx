"use client";

import { useState } from "react";
import { BaseDialog } from "@/components/ui/base-dialog";
import { ActivityLog } from "@/features/stock/api/stock-api";
import { formatToReadableDateTime, formatRelative } from "@/lib/date-utils";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import {
    Activity,
    ArrowRight,
    Check,
    Clock,
    Copy,
    CornerDownRight,
    Info,
    Monitor,
    User,
} from "lucide-react";

interface LogItem {
    product?: {
        nama?: string;
        barcode?: string;
        harga_jual?: number;
    };
    product_name?: string;
    barcode?: string;
    kuantitas?: number;
    quantity?: number;
    qty?: number;
    harga_beli?: number;
    price?: number;
}

interface LogSupplier {
    nama?: string;
    alamat?: string;
    nomor_telepon?: string;
}

interface AuditInspectorProps {
    log: ActivityLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuditInspector({ log, open, onOpenChange }: AuditInspectorProps) {
    const [activeTab, setActiveTab] = useState<"info" | "properties" | "json">("info");
    const [copied, setCopied] = useState(false);

    if (!log) return null;

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return { os: "Sistem / Script", browser: "CLI / Node" };
        const lower = ua.toLowerCase();

        let os = "Windows";
        if (lower.includes("macintosh") || lower.includes("mac os")) os = "macOS";
        else if (lower.includes("linux")) os = "Linux";
        else if (lower.includes("android")) os = "Android";
        else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";

        let browser = "Web Browser";
        if (lower.includes("chrome") || lower.includes("chromium")) browser = "Chrome";
        else if (lower.includes("firefox")) browser = "Firefox";
        else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
        else if (lower.includes("edge")) browser = "Edge";
        else if (lower.includes("node")) browser = "Node.js (API)";

        return { os, browser };
    };

    const isCurrencyField = (key: string) => {
        const k = key.toLowerCase();
        return (
            k.includes("harga") ||
            k.includes("nilai") ||
            k.includes("total") ||
            k.includes("bayar") ||
            k.includes("kembalian") ||
            k.includes("amount") ||
            k.includes("balance") ||
            k.includes("hutang") ||
            k.includes("faktur")
        );
    };

    const translateKey = (key: string) => {
        const dict: Record<string, string> = {
            total: "Total Transaksi",
            nominal_bayar: "Nominal Bayar",
            kembalian: "Uang Kembalian",
            amount: "Jumlah / Nominal",
            balance_before: "Saldo Sebelum",
            balance_after: "Saldo Sesudah",
            movement_uid: "ID Mutasi",
            transaction_uid: "ID Transaksi",
            transaction_number: "Nomor Transaksi",
            nomor_penerimaan: "Nomor Penerimaan",
            supplier: "Nama Supplier",
            nilai_faktur: "Nilai Faktur",
            sisa_hutang: "Sisa Hutang",
            status_pembayaran: "Status Pembayaran",
            status: "Status",
            tanggal_terima: "Tanggal Terima",
            catatan: "Catatan",
            store_uid: "ID Toko",
            purchase_order_uid: "ID Purchase Order",
            supplier_uid: "ID Supplier",
            user_uid: "ID Pengguna",
            uid: "ID Unik",
            created_at: "Dibuat Pada",
            updated_at: "Diperbarui Pada",
            is_jasa: "Jenis Jasa?",
            barcode: "Barcode",
            stok: "Stok Barang",
            harga_jual: "Harga Jual",
            harga_beli: "Harga Beli",
            harga_beli_avg: "Harga Beli Avg",
            margin: "Margin (%)",
            name: "Nama Lengkap",
            username: "Username",
            email: "Email"
        };

        if (dict[key]) return dict[key];
        return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatValue = (key: string, val: unknown): string => {
        if (val === null || val === undefined) return "-";
        if (typeof val === "boolean") return val ? "Ya" : "Tidak";

        if (isCurrencyField(key) && typeof val === "number") {
            return formatRupiah(val);
        }

        if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return formatToReadableDateTime(val);
        }

        if (typeof val === "object") {
            return JSON.stringify(val);
        }

        return String(val);
    };

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(log, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const dialogTitle = (
        <span className="flex items-center gap-2">
            <Info className="h-5 w-5 text-emerald-650 animate-pulse" />
            Inspeksi Detail Aktivitas
        </span>
    );

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={dialogTitle}
            className="sm:max-w-2xl"
            scrollable={true}
        >
            <div className="space-y-4 pt-2">
                <div className="text-xs text-slate-400">
                    Kode Keamanan Log: <span className="font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md border text-[10px]">{log.uid}</span>
                </div>

                {/* Tab Headers */}
                <div className="flex border-b border-slate-100 gap-1 shrink-0">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === "info"
                            ? "border-emerald-600 text-emerald-700 font-extrabold"
                            : "border-transparent text-slate-400 hover:text-slate-700"
                            }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            Informasi Utama
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("properties")}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === "properties"
                            ? "border-emerald-600 text-emerald-700 font-extrabold"
                            : "border-transparent text-slate-400 hover:text-slate-700"
                            }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            Properti Perubahan
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("json")}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === "json"
                            ? "border-emerald-600 text-emerald-700 font-extrabold"
                            : "border-transparent text-slate-400 hover:text-slate-700"
                            }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Copy className="h-3.5 w-3.5" />
                            JSON
                        </span>
                    </button>
                </div>

                {/* Tab: Info */}
                {activeTab === "info" && (
                    <div className="space-y-4 min-h-0">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pernyataan Log</h4>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed">{log.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Actor */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    Pelaku / Petugas
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm uppercase">
                                        {log.user ? log.user.name.substring(0, 2) : "S"}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-slate-800">{log.user ? log.user.name : "Sistem"}</span>
                                        {log.user && (
                                            <span className="text-[10px] text-slate-400 font-mono">@{log.user.username}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Client OS & Browser Context */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Monitor className="h-3.5 w-3.5 text-slate-400" />
                                    Konteks Sistem & Klien
                                </h4>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">IP Address:</span>
                                        <span className="font-mono text-slate-700 font-semibold">{log.ip_address || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Sistem Operasi:</span>
                                        <span className="text-slate-700 font-semibold">{parseUserAgent(log.user_agent).os}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Klien Browser:</span>
                                        <span className="text-slate-700 font-semibold">{parseUserAgent(log.user_agent).browser}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chronology Box */}
                            <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-3 md:col-span-2">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    Kronologi Waktu
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between sm:justify-start sm:gap-4">
                                        <span className="text-slate-400">Waktu Log:</span>
                                        <span className="text-slate-700 font-bold">{formatToReadableDateTime(log.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between sm:justify-end sm:gap-4">
                                        <span className="text-slate-400">Jarak Relatif:</span>
                                        <span className="text-emerald-700 font-bold">{formatRelative(log.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Properties */}
                {activeTab === "properties" && (() => {
                    const properties = log.properties;
                    if (!properties) {
                        return (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-150">
                                <Info className="h-6 w-6 text-slate-300 mb-2" />
                                <p className="text-xs font-semibold">Tidak ada properti tambahan yang dicatat untuk aktivitas ini.</p>
                            </div>
                        );
                    }

                    const hasOld = "old" in properties && properties.old !== null;
                    const hasNew = "new" in properties && properties.new !== null;
                    const oldData = hasOld ? (properties.old as Record<string, unknown>) : null;
                    const newData = hasNew ? (properties.new as Record<string, unknown>) : null;
                    const isFlat = !hasOld && !hasNew;

                    const items = (newData?.items || oldData?.items || properties?.items) as LogItem[];
                    const hasItems = Array.isArray(items) && items.length > 0;
                    const supplier = (newData?.supplier_relationship || oldData?.supplier_relationship || properties?.supplier_relationship) as LogSupplier | undefined;

                    return (
                        <div className="space-y-4">
                            {isFlat && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.keys(properties)
                                        .filter(k => k !== "items" && k !== "supplier_relationship" && typeof properties[k] !== "object")
                                        .map(key => (
                                            <div key={key} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{translateKey(key)}</span>
                                                <span className="text-xs font-extrabold text-slate-800 mt-1.5 tabular-nums break-all">
                                                    {formatValue(key, properties[key])}
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}

                            {(hasOld || hasNew) && (() => {
                                const allSubKeys = Array.from(new Set([
                                    ...Object.keys(oldData || {}),
                                    ...Object.keys(newData || {})
                                ])).filter(k => k !== "items" && k !== "supplier_relationship" && typeof (newData?.[k] || oldData?.[k]) !== "object");

                                if (allSubKeys.length === 0) return null;

                                return (
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                                                    <th className="p-3">Atribut / Kolom</th>
                                                    {hasOld && <th className="p-3">Sebelum</th>}
                                                    {hasOld && hasNew && <th className="p-1 text-center"></th>}
                                                    {hasNew && <th className="p-3">Sesudah</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {allSubKeys.map(key => {
                                                    const oldVal = oldData?.[key];
                                                    const newVal = newData?.[key];
                                                    const hasChanged = hasOld && hasNew && oldVal !== newVal;
                                                    return (
                                                        <tr key={key} className={`hover:bg-slate-50/30 ${hasChanged ? "bg-amber-50/20" : ""}`}>
                                                            <td className="p-3 font-bold text-slate-600">{translateKey(key)}</td>
                                                            {hasOld && (
                                                                <td className="p-3 font-medium text-slate-500 tabular-nums break-all">
                                                                    {formatValue(key, oldVal)}
                                                                </td>
                                                            )}
                                                            {hasOld && hasNew && (
                                                                <td className="p-1 text-center">
                                                                    {hasChanged ? (
                                                                        <ArrowRight className="h-3 w-3 inline text-amber-500 stroke-[2.5]" />
                                                                    ) : (
                                                                        <span className="text-slate-300 font-mono">=</span>
                                                                    )}
                                                                </td>
                                                            )}
                                                            {hasNew && (
                                                                <td className={`p-3 font-black tabular-nums break-all ${hasChanged ? "text-amber-800" : "text-slate-800"}`}>
                                                                    {formatValue(key, newVal)}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}

                            {supplier && (
                                <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-3 shadow-xs">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">Supplier</span>
                                        <p className="text-xs font-extrabold text-emerald-955">{supplier.nama}</p>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{supplier.alamat || "Alamat tidak dicantumkan"}</p>
                                    </div>
                                    <div className="text-left sm:text-right self-start sm:self-center">
                                        <span className="text-[9px] text-slate-400 block font-bold">Telepon</span>
                                        <span className="text-xs font-bold text-slate-700 tabular-nums">{supplier.nomor_telepon || "-"}</span>
                                    </div>
                                </div>
                            )}

                            {hasItems && (
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs mt-3">
                                    <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 font-bold text-xs text-slate-700 flex items-center gap-1.5">
                                        <CornerDownRight className="h-4 w-4 text-slate-400" />
                                        Daftar Item / Produk ({items.length})
                                    </div>
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/30 border-b border-slate-100 text-slate-400 font-bold">
                                                <th className="p-3">Nama Produk</th>
                                                <th className="p-3 text-center">Barcode</th>
                                                <th className="p-3 text-right">Kuantitas</th>
                                                <th className="p-3 text-right">Harga Beli</th>
                                                <th className="p-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {items.map((item, idx) => {
                                                const pName = item.product?.nama || item.product_name || "Produk Tidak Dikenal";
                                                const pBarcode = item.product?.barcode || item.barcode || "-";
                                                const pQty = item.kuantitas || item.quantity || item.qty || 0;
                                                const pPrice = item.harga_beli || item.price || 0;
                                                const pSubtotal = pQty * pPrice;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/20">
                                                        <td className="p-3 font-semibold text-slate-800">{pName}</td>
                                                        <td className="p-3 text-center font-mono text-[10px] text-slate-400">{pBarcode}</td>
                                                        <td className="p-3 text-right font-extrabold text-slate-700 tabular-nums">{pQty.toLocaleString("id-ID")}</td>
                                                        <td className="p-3 text-right font-medium text-slate-500 tabular-nums">{formatRupiah(pPrice)}</td>
                                                        <td className="p-3 text-right font-black text-emerald-600 tabular-nums">{formatRupiah(pSubtotal)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Tab: Raw JSON */}
                {activeTab === "json" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-500">Gunakan data JSON untuk analisis log sistem lengkap.</span>
                            <button
                                onClick={handleCopyJson}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-400 stroke-[3px]" />
                                        Tersalin!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        Salin JSON
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-[10px] font-mono overflow-auto max-h-96 border border-slate-800 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            {JSON.stringify(log, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </BaseDialog>
    );
}

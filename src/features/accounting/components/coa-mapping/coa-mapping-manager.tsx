"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlatChartOfAccounts } from "@/features/accounting/api/coa-api";
import { type CoaMapping } from "@/features/accounting/api/coa-mapping-api";
import { type ChartOfAccount } from "@/features/accounting/types";
import { useLedgerBackfillStatus } from "@/features/accounting/api/ledger-api";
import {
    AlertTriangle,
    ArrowLeftRight,
    Building2,
    Check,
    CreditCard,
    Loader2,
    Package,
    Receipt,
    RefreshCw,
    Save,
    ShoppingBag,
    Undo2,
    Users,
    X
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { FormProvider } from "react-hook-form";
import { BackfillSection } from "./backfill-section";
import { CoaMappingCard } from "./coa-mapping-card";
import { useCoaMappingForm } from "./hooks/use-coa-mapping-form";

export function CoaMappingManager() {
    const {
        methods,
        isDirty,
        dirtyFields,
        isSaving,
        handleSave,
        discardChanges,
        isLoading,
        mappings,
    } = useCoaMappingForm();

    const { data: coas, isLoading: isLoadingCoas } = useFlatChartOfAccounts();
    const [activeSection, setActiveSection] = useState<string>("sale");
    const [isBackfillOpen, setIsBackfillOpen] = useState<boolean>(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const isProgrammaticScroll = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    const backfillStatus = useLedgerBackfillStatus(true);
    const bfState = backfillStatus.data?.status ?? "idle";
    const isBackfilling = bfState === "queued" || bfState === "running";

    // Map accounts to options compatible with FormSelect
    const coaOptions = useMemo(() => {
        if (!coas) return [];
        return coas
            .filter((c: ChartOfAccount) => c.is_active)
            .map((c: ChartOfAccount) => ({
                value: c.uid,
                label: `[${c.kode}] ${c.nama}`,
                description: `${c.tipe.toUpperCase()} — ${c.saldo_normal === "debit" ? "Debit" : "Kredit"}`,
            }));
    }, [coas]);

    // Live watch form values
    const formValues = methods.watch();
    const totalCount = mappings?.length ?? 0;
    const configuredCount = useMemo(() => {
        if (!mappings) return 0;
        return mappings.filter(
            (m: CoaMapping) => !!formValues[`${m.transaction_type}:${m.slot}`]
        ).length;
    }, [mappings, formValues]);

    const unconfiguredCount = totalCount - configuredCount;
    const progressPercent = totalCount > 0 ? Math.round((configuredCount / totalCount) * 100) : 0;

    // Calculate settings groups and their specific completion states
    const groupsWithStatus = useMemo(() => {
        if (!mappings) return [];
        return [
            {
                id: "sale",
                label: "Penjualan",
                description: "Pemetaan akun untuk transaksi kasir, pendapatan, HPP, diskon/pajak, dan persediaan.",
                icon: <ShoppingBag className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "sale"),
            },
            {
                id: "stock_receiving",
                label: "Penerimaan Barang",
                description: "Pemetaan akun untuk penambahan persediaan dan hutang usaha dari penerimaan supplier.",
                icon: <Package className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "stock_receiving"),
            },
            {
                id: "purchase_return",
                label: "Retur Pembelian",
                description: "Pemetaan akun untuk pengurangan hutang usaha dan nilai persediaan dari retur supplier.",
                icon: <Undo2 className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "purchase_return"),
            },
            {
                id: "stock_movement",
                label: "Penyesuaian & Mutasi Stok",
                description: "Pemetaan akun untuk penyesuaian nilai persediaan fisik dan pencatatan selisih lebih/kurang stok.",
                icon: <ArrowLeftRight className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "stock_movement"),
            },
            {
                id: "supplier_payment",
                label: "Pembayaran Supplier",
                description: "Pemetaan akun pelunasan hutang pembelian ke supplier.",
                icon: <CreditCard className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "supplier_payment"),
            },
            {
                id: "expense",
                label: "Pengeluaran Operasional",
                description: "Pemetaan akun beban operasional dan pengeluaran biaya langsung.",
                icon: <Receipt className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "expense"),
            },
            {
                id: "member_payment",
                label: "Piutang Member",
                description: "Pemetaan akun pelunasan piutang pelanggan ketika member mencicil tagihan tempo.",
                icon: <Users className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "member_payment"),
            },
            {
                id: "cash_ledger",
                label: "Cash Ledger (Kas/Bank)",
                description: "Pemetaan akun kas, bank, serta selisih kurang/lebih kas untuk penyesuaian dana kasir manual.",
                icon: <Building2 className="h-4 w-4" />,
                items: mappings.filter((m: CoaMapping) => m.transaction_type === "cash_ledger"),
            },
        ].map((group) => {
            const mappedCount = group.items.filter(
                (m: CoaMapping) => !!formValues[`${m.transaction_type}:${m.slot}`]
            ).length;
            const total = group.items.length;
            return {
                ...group,
                mappedCount,
                total,
                isComplete: mappedCount === total,
            };
        });
    }, [mappings, formValues]);

    // Scroll-Spy Setup with IntersectionObserver
    useEffect(() => {
        const findScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
            if (!el) return null;
            const style = window.getComputedStyle(el);
            if (el.tagName === 'MAIN' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return el;
            }
            return findScrollContainer(el.parentElement);
        };

        const scrollContainer = findScrollContainer(rootRef.current);
        if (!scrollContainer) return;

        const sectionIds = [
            "sale",
            "stock_receiving",
            "purchase_return",
            "stock_movement",
            "supplier_payment",
            "expense",
            "member_payment",
            "cash_ledger"
        ];

        // Track which sections are currently intersecting in the active zone
        const intersectingSections: Record<string, boolean> = {};

        const observerOptions = {
            root: scrollContainer,
            // Active zone matches the scroll-margin-top offset (120px) to about 40% from top
            rootMargin: "-120px 0px -60% 0px",
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                intersectingSections[entry.target.id] = entry.isIntersecting;
            });

            if (isProgrammaticScroll.current) return;

            // Find the first intersecting section in list order
            const active = sectionIds.find((id) => intersectingSections[id]);
            if (active) {
                setActiveSection(active);
            }
        }, observerOptions);

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        // Check if scrolled near the bottom of the container (to force-activate the last item if it's too short to scroll fully)
        const handleScroll = () => {
            if (isProgrammaticScroll.current) return;

            const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight;
            const isAtBottom = isScrollable && (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 40);

            if (isAtBottom) {
                setActiveSection(sectionIds[sectionIds.length - 1]);
            }
        };

        scrollContainer.addEventListener("scroll", handleScroll);

        // Initial check for bottom scroll
        handleScroll();

        return () => {
            observer.disconnect();
            scrollContainer.removeEventListener("scroll", handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, [mappings]);

    // Scroll handler for sidebar links
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            isProgrammaticScroll.current = true;
            setActiveSection(id);

            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

            el.scrollIntoView({ behavior: "smooth", block: "start" });

            scrollTimeout.current = setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 800); // Allow smooth scroll animation to finish
        }
    };

    if (isLoading || isLoadingCoas) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-96 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-44 rounded-xl" />
                </div>

                {/* Sidebar + Content skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                    <div className="space-y-2.5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-xl" />
                        ))}
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-80 rounded-2xl" />
                        <Skeleton className="h-80 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <div ref={rootRef} className="space-y-8 pb-28">
                {/* Two-Column Sidebar Settings Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 items-start">
                    {/* Left Column: Sticky quick links sidebar */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 p-3 rounded-2xl space-y-1 lg:sticky lg:top-[90px] shadow-sm">
                        <div className="px-2.5 py-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Navigasi Pemetaan
                        </div>

                        {/* List of 7 Groups */}
                        {groupsWithStatus.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                    setIsBackfillOpen(false);
                                    scrollToSection(g.id);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all text-xs font-semibold text-left border ${activeSection === g.id && !isBackfillOpen
                                    ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-50 border-slate-200/80 dark:border-slate-750 shadow-sm font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 border-transparent"
                                    }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={activeSection === g.id && !isBackfillOpen ? "text-emerald-500" : "text-slate-400"}>
                                        {g.icon}
                                    </span>
                                    <span className="truncate">{g.label}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[9px] font-mono ${g.isComplete ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                                        {g.mappedCount}/{g.total}
                                    </span>
                                    <div className={`h-1.5 w-1.5 rounded-full ${g.isComplete ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Right Column: Scrolling Cards Area */}
                    <div className="space-y-8 min-w-0">
                        {/* 7 Feature Settings Cards */}
                        {groupsWithStatus.map((g) => {
                            if (g.items.length === 0) return null;
                            return (
                                <div
                                    key={g.id}
                                    id={g.id}
                                    className="scroll-mt-[120px] transition-all duration-300"
                                >
                                    <CoaMappingCard
                                        title={g.label}
                                        description={g.description}
                                        icon={g.icon}
                                        items={g.items}
                                        coaOptions={coaOptions}
                                        dirtyFields={dirtyFields}
                                        isLoadingCoas={isLoadingCoas}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Floating Backfill & Status Panel */}
                {!isBackfillOpen ? (
                    <button
                        type="button"
                        onClick={() => setIsBackfillOpen(true)}
                        className="fixed bottom-6 right-6 z-40 bg-white dark:bg-slate-900 border border-slate-200 shadow-xl hover:shadow-2xl px-4 py-3 rounded-full flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group dark:border-slate-800"
                    >
                        <div className={`p-1.5 rounded-full ${isBackfilling
                            ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-500/10 dark:text-indigo-400 animate-spin'
                            : bfState === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : bfState === 'failed'
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 animate-pulse'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {isBackfilling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : bfState === 'completed' ? (
                                <Check className="h-4 w-4" />
                            ) : bfState === 'failed' ? (
                                <AlertTriangle className="h-4 w-4 animate-bounce" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </div>
                        <div className="flex flex-col items-start leading-none text-left">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                Sinkronisasi Jurnal
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                {isBackfilling
                                    ? "Sedang Sinkronisasi..."
                                    : bfState === 'completed'
                                        ? "Jurnal Up-to-date"
                                        : bfState === 'failed'
                                            ? "Sinkronisasi Gagal"
                                            : "Mulai Sinkronisasi"}
                            </span>
                        </div>

                        {unconfiguredCount > 0 && (
                            <span className="relative flex h-5 w-5 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 text-[9px] font-extrabold text-white items-center justify-center bg-rose-600">
                                    {unconfiguredCount}
                                </span>
                            </span>
                        )}
                    </button>
                ) : (
                    <div className="fixed bottom-6 right-6 z-40 w-[calc(100vw-32px)] sm:w-[350px] max-h-[460px] bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        {/* Header */}
                        <div className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RefreshCw className={`h-3.5 w-3.5 ${isBackfilling ? "text-indigo-500 animate-spin" : "text-slate-500"}`} />
                                <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-50 tracking-wide uppercase">
                                    Sinkronisasi Jurnal
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsBackfillOpen(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-4 overflow-y-auto space-y-4 max-h-[380px]">
                            {/* Mapping Progress Section */}
                            <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100/80 dark:border-slate-800/40">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    <span>PEMETAAN AKUN</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-350">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-slate-400">
                                    <span>{configuredCount} / {totalCount} terhubung</span>
                                    {unconfiguredCount > 0 ? (
                                        <span className="text-amber-600 dark:text-amber-450 font-semibold">{unconfiguredCount} belum terhubung</span>
                                    ) : (
                                        <span className="text-emerald-600 dark:text-emerald-450 font-semibold">Semua terhubung</span>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800" />

                            {/* Backfill controls */}
                            <BackfillSection borderless />
                        </div>
                    </div>
                )}

                {/* Shopify-Style Unsaved Actions Floating Bar */}
                {isDirty && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 rounded-2xl border border-slate-200/80 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 animate-in fade-in slide-in-from-bottom-6 duration-450 w-[90%] max-w-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate">
                                Perubahan pemetaan belum disimpan
                            </span>
                        </div>

                        <div className="flex gap-2.5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={discardChanges}
                                disabled={isSaving}
                                className="h-9 px-4 text-xs font-semibold border-slate-200 hover:bg-slate-50 dark:border-slate-800 rounded-xl"
                            >
                                <X className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                                Batalkan
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 rounded-xl transition-all"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-1.5 h-3.5 w-3.5" />
                                        Simpan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </FormProvider>
    );
}

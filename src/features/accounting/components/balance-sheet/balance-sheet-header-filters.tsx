"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    IconScale,
    IconInfoCircle,
    IconLayoutGrid,
    IconMathSymbols,
    IconCalendar,
    IconAdjustmentsHorizontal,
    IconChevronDown,
    IconCheck,
} from "@tabler/icons-react";

interface BalanceSheetHeaderFiltersProps {
    asOfDate: string;
    onAsOfDateChange: (val: string) => void;
    viewType: "standard" | "equation";
    onViewTypeChange: (val: "standard" | "equation") => void;
    showDebitCredit: boolean;
    onShowDebitCreditChange: (val: boolean) => void;
    extraAction?: React.ReactNode;
    title?: string;
    description?: string;
    badge?: React.ReactNode;
    icon?: React.ReactNode;
}

export function BalanceSheetHeaderFilters({
    asOfDate,
    onAsOfDateChange,
    viewType,
    onViewTypeChange,
    showDebitCredit,
    onShowDebitCreditChange,
    extraAction,
    title = "Neraca Keuangan",
    description = "Pencatatan posisi Aset, Kewajiban (Liabilitas), dan Ekuitas Modal untuk usaha Anda.",
    badge,
    icon,
}: BalanceSheetHeaderFiltersProps) {
    // Generate active date presets
    const presets = useMemo(() => {
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastYear = new Date(today.getFullYear() - 1, 12, 0);

        const formatDateStr = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        };

        return [
            { label: "Hari Ini", value: formatDateStr(today), type: "today" as const },
            { label: "Akhir Bulan Ini", value: formatDateStr(thisMonth), type: "this-month" as const },
            { label: "Akhir Bulan Lalu", value: formatDateStr(lastMonth), type: "last-month" as const },
            { label: "Akhir Tahun Lalu", value: formatDateStr(lastYear), type: "last-year" as const },
        ];
    }, []);

    const iconToRender = icon || <IconScale className="w-6 h-6" />;
    const badgeToRender = badge || (
        <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30 uppercase tracking-wider shadow-sm">
            Laporan Aktif
        </span>
    );

    return (
        <TooltipProvider>
            <div className="space-y-6 mb-6">
                {/* 1. Header Hero Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div className="flex items-center gap-4">
                        {/* Glowing Icon Container */}
                        <div className="relative flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-500 to-violet-650 dark:from-indigo-600 dark:to-violet-850 text-white rounded-2xl shadow-lg shadow-indigo-500/15 dark:shadow-indigo-950/30 ring-4 ring-indigo-50 dark:ring-indigo-950/20 shrink-0">
                            {iconToRender}
                            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-25 -z-10" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                    {title}
                                </h2>
                                {badgeToRender}
                            </div>
                            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed max-w-xl">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Extra Action (e.g. Edit Neraca) */}
                    {extraAction && (
                        <div className="shrink-0 self-end sm:self-auto transition-transform hover:scale-[1.02] active:scale-[0.98]">
                            {extraAction}
                        </div>
                    )}
                </div>

                {/* 2. Control Panel Card (Filter Toolbar) */}
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 shadow-sm rounded-3xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
                    {/* Left Side: Segmented control & switch */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
                        {/* Segmented Tab Selector for viewType */}
                        <div className="relative flex bg-slate-100/80 dark:bg-slate-950/80 p-0.5 rounded-xl border border-slate-200/30 dark:border-slate-800/50 w-fit">
                            {(["standard", "equation"] as const).map((mode) => {
                                const isActive = viewType === mode;
                                return (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => onViewTypeChange(mode)}
                                        className={cn(
                                            "relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors duration-250 cursor-pointer flex items-center gap-1.5 select-none",
                                            isActive
                                                ? "text-indigo-950 dark:text-indigo-50 font-extrabold"
                                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeViewType"
                                                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200/40 dark:border-slate-800/80 -z-10"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        {mode === "standard" ? (
                                            <>
                                                <IconLayoutGrid className="w-3.5 h-3.5 shrink-0" />
                                                <span>Neraca Standar</span>
                                            </>
                                        ) : (
                                            <>
                                                <IconMathSymbols className="w-3.5 h-3.5 shrink-0" />
                                                <span>Persamaan</span>
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Vertical Divider */}
                        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />

                        {/* Switch Detail D/K */}
                        <div className="flex items-center gap-2 pl-0.5">
                            <Switch
                                id="show-dk-header"
                                checked={showDebitCredit}
                                onCheckedChange={onShowDebitCreditChange}
                                className="scale-90"
                            />
                            <label
                                htmlFor="show-dk-header"
                                className="text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none flex items-center gap-1.5"
                            >
                                <span>Detail D/K</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
                                            aria-label="Detail D/K info"
                                        >
                                            <IconInfoCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="text-[11px] leading-relaxed max-w-[250px] bg-slate-950 text-white rounded-xl p-3 shadow-xl border border-slate-800"
                                    >
                                        Menampilkan kolom nominal mutasi Debit dan Kredit secara terpisah untuk setiap pos akun akun Neraca.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                        </div>
                    </div>

                    {/* Right Side: Date Picker & Presets */}
                    <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-end sm:justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                        {/* Dropdown Pintasan Periode */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm flex items-center gap-1.5 transition-all select-none cursor-pointer"
                                >
                                    <IconAdjustmentsHorizontal className="w-3.5 h-3.5" />
                                    <span>Pintasan Periode</span>
                                    <IconChevronDown className="w-3 h-3 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 shadow-lg rounded-2xl"
                            >
                                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 py-1">
                                    Pilih Periode Neraca
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                                {presets.map((preset) => {
                                    const isActive = asOfDate === preset.value;
                                    return (
                                        <DropdownMenuItem
                                            key={preset.type}
                                            onClick={() => onAsOfDateChange(preset.value)}
                                            className={cn(
                                                "w-full text-xs font-semibold py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900",
                                                isActive
                                                    ? "bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 font-extrabold"
                                                    : "text-slate-600 dark:text-slate-300"
                                            )}
                                        >
                                            <span>{preset.label}</span>
                                            {isActive && <IconCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Date Picker Input */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="hidden sm:inline">Per Tanggal:</span>
                            </span>
                            <DatePicker
                                value={asOfDate}
                                onChange={(val) => onAsOfDateChange(val || "")}
                                size="sm"
                                clearable={false}
                                className="w-[130px] sm:w-[145px]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

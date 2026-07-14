"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipsSelectOption {
    value: string;
    label: string;
}

interface ChipsSelectProps {
    options: ChipsSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    label?: string;
    className?: string;
    wrapperClassName?: string;
    disabled?: boolean;
}

export function ChipsSelect({
    options,
    value = [],
    onChange,
    label,
    className,
    wrapperClassName,
    disabled = false,
}: ChipsSelectProps) {
    const toggleOption = (val: string) => {
        if (disabled) return;
        const newValue = value.includes(val)
            ? value.filter((v) => v !== val)
            : [...value, val];
        onChange(newValue);
    };

    return (
        <div className={cn("space-y-1.5 w-full", wrapperClassName)}>
            {label && (
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {label}
                </label>
            )}
            <div className={cn("flex flex-wrap gap-2", className)}>
                {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleOption(option.value)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer select-none",
                                isSelected
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isSelected && <Check className="h-3 w-3 text-emerald-600 stroke-[3px]" />}
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

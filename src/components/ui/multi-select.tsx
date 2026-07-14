"use client";

import * as React from "react";
import { ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Pilih kategori...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ada hasil ditemukan.",
  isLoading = false,
  className,
  wrapperClassName,
  disabled = false,
  size = "sm",
  label,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedValuesSet = React.useMemo(() => new Set(value), [value]);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(searchLower));
  }, [options, search]);

  const triggerLabel = React.useMemo(() => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length && options.length > 0) return "Semua Kategori";
    
    if (value.length <= 2) {
      return options
        .filter((opt) => selectedValuesSet.has(opt.value))
        .map((opt) => opt.label)
        .join(", ");
    }
    
    return `${value.length} Kategori`;
  }, [value, options, selectedValuesSet, placeholder]);

  const handleSelect = (optionValue: string) => {
    const newValue = [...value];
    const index = newValue.indexOf(optionValue);
    if (index > -1) {
      newValue.splice(index, 1);
    } else {
      newValue.push(optionValue);
    }
    onChange(newValue);
  };

  const handleSelectAll = () => {
    // Select all currently filtered options
    const allOptionValues = filteredOptions.map((opt) => opt.value);
    const uniqueValues = Array.from(new Set([...value, ...allOptionValues]));
    onChange(uniqueValues);
  };

  const handleClearAll = () => {
    if (!search) {
      // Clear all
      onChange([]);
    } else {
      // Clear only filtered options
      const filteredSet = new Set(filteredOptions.map((opt) => opt.value));
      const newValue = value.filter((val) => !filteredSet.has(val));
      onChange(newValue);
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs font-normal text-slate-700",
    md: "h-10 text-xs font-normal text-slate-800",
    lg: "h-12 text-sm font-normal text-slate-800",
  }[size];

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className={cn("relative w-full max-w-full min-w-0 select-none", wrapperClassName)}>
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger
            render={
              <button
                type="button"
                disabled={disabled}
                title={triggerLabel}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] w-full max-w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 outline-none transition-all hover:bg-slate-50 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer overflow-hidden",
                  sizeClasses,
                  className
                )}
              >
                <span className="truncate text-left font-medium">
                  {triggerLabel}
                </span>
                <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50 justify-self-end" />
              </button>
            }
          />

          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
              align="start"
              side="bottom"
              sideOffset={4}
              className="isolate z-50"
            >
              <PopoverPrimitive.Popup
                className="w-(--anchor-width) min-w-[200px] max-h-[320px] origin-(--transform-origin) animate-in fade-in-0 zoom-in-95 duration-100 outline-none overflow-hidden rounded-xl bg-white border border-slate-100 shadow-lg text-slate-950 flex flex-col"
              >
                {/* Search bar */}
                <div className="flex items-center border-b border-slate-100 px-3 py-1 bg-slate-50/10 shrink-0">
                  <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50 text-slate-400" />
                  <input
                    className="flex h-9 w-full rounded-md bg-transparent py-3 text-xs outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Action buttons (Select All / Clear All) */}
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 bg-slate-50/40 text-[10px] font-bold tracking-wide text-slate-500 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                  >
                    {search ? "Bersihkan Hasil" : "Kosongkan"}
                  </button>
                </div>

                {/* Options list */}
                <div className="overflow-y-auto overflow-x-hidden p-1 custom-scrollbar flex-1 max-h-[180px]">
                  {isLoading && (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      <span>Memuat...</span>
                    </div>
                  )}

                  {!isLoading && filteredOptions.length === 0 && (
                    <div className="py-4 text-center text-xs text-slate-400">
                      {emptyMessage}
                    </div>
                  )}

                  {!isLoading &&
                    filteredOptions.map((opt) => {
                      const isChecked = selectedValuesSet.has(opt.value);
                      return (
                        <div
                          key={opt.value}
                          data-disabled={opt.disabled}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 gap-2.5",
                            isChecked && "bg-indigo-50/45 text-indigo-700 font-bold"
                          )}
                          onClick={() => !opt.disabled && handleSelect(opt.value)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Controlled by wrapper div click
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                          />
                          <span className="min-w-0 flex-1 truncate text-left text-slate-700">
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    </div>
  );
}

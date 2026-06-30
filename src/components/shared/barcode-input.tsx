"use client";

import { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from "react";
import { IconBarcode, IconSearch, IconLoader2 } from "@tabler/icons-react";
import { lookupProductByBarcode } from "@/features/purchase/api/purchase-api";
import type { Product } from "@/features/products/types";
import { useQuery } from "@tanstack/react-query";

interface BarcodeInputProps {
    onProductFound: (product: Product) => void;
    onError?: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
    products?: Product[];
    mode?: "purchase" | "sell";
    searchLabel?: string;
    onSearchSubmit?: (query: string) => void;
}

export const BarcodeInput = forwardRef<HTMLInputElement, BarcodeInputProps>(
    function BarcodeInput({
        onProductFound,
        onError,
        disabled = false,
        placeholder = "Scan barcode atau ketik nama produk...",
        products = [],
        mode = "purchase",
        searchLabel = "Cari",
        onSearchSubmit,
    }: BarcodeInputProps, ref) {
        const localRef = useRef<HTMLInputElement>(null);
        const inputRef = (ref || localRef) as React.MutableRefObject<HTMLInputElement | null>;
        const containerRef = useRef<HTMLDivElement>(null);
        const [value, setValue] = useState("");
        const [isSearching, setIsSearching] = useState(false);
        const [flashState, setFlashState] = useState<"success" | "error" | null>(null);
        const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        // Autocomplete states
        const [showDropdown, setShowDropdown] = useState(false);
        const [focusedIndex, setFocusedIndex] = useState(-1);
        const [debouncedValue, setDebouncedValue] = useState("");
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Scroll focused suggestion into view
        useEffect(() => {
            if (focusedIndex >= 0 && dropdownRef.current) {
                const selectedElement = dropdownRef.current.querySelector(`[data-index="${focusedIndex}"]`);
                if (selectedElement) {
                    selectedElement.scrollIntoView({ block: "nearest", behavior: "auto" });
                }
            }
        }, [focusedIndex]);

        // Debounce input value for search queries
        useEffect(() => {
            const timer = setTimeout(() => {
                setDebouncedValue(value);
            }, 300);
            return () => clearTimeout(timer);
        }, [value]);

        // Show/hide dropdown based on input content
        useEffect(() => {
            if (value.trim().length >= 2) {
                setShowDropdown(true);
            } else {
                setShowDropdown(false);
                setFocusedIndex(-1);
            }
        }, [value]);

        // Close dropdown on click outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setShowDropdown(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const isLocalMode = products && products.length > 0;

        // TanStack Query for searching products from API
        const { data: apiProducts, isLoading: isApiLoading } = useQuery({
            queryKey: ["products", "autocomplete", debouncedValue],
            queryFn: async () => {
                try {
                    return await lookupProductByBarcode(debouncedValue);
                } catch {
                    return [];
                }
            },
            enabled: !isLocalMode && debouncedValue.trim().length >= 2,
            retry: false,
            staleTime: 30000,
        });

        // Compute suggestion list
        const suggestions = useMemo(() => {
            if (value.trim().length < 2) return [];
            if (isLocalMode) {
                const words = value.toLowerCase().trim().split(/\s+/);
                const rawSearch = value.toLowerCase().trim();
                return products
                    .filter((p) => {
                        // Optional exact barcode match
                        if (p.barcode && p.barcode.toLowerCase().includes(rawSearch)) return true;
                        
                        const productName = p.nama ? p.nama.toLowerCase() : "";
                        // Every word must be found in the product name
                        return words.every(word => productName.includes(word));
                    })
                    .slice(0, 8);
            }
            return apiProducts || [];
        }, [value, isLocalMode, products, apiProducts]);

        // Auto-focus on mount
        useEffect(() => {
            if (!disabled) {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }, [disabled, inputRef]);

        // Clear flash after animation
        useEffect(() => {
            if (flashState) {
                const timer = setTimeout(() => {
                    setFlashState(null);
                }, 600);
                return () => clearTimeout(timer);
            }
        }, [flashState]);

        const triggerFlash = (type: "success" | "error") => {
            setFlashState(type);
        };

        const refocusInput = useCallback(() => {
            setTimeout(() => inputRef.current?.focus(), 50);
        }, [inputRef]);

        const handleSelectProduct = (product: Product) => {
            setValue("");
            setShowDropdown(false);
            setFocusedIndex(-1);
            onProductFound(product);
            refocusInput();
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const query = value.trim();

            setValue("");
            setShowDropdown(false);
            setFocusedIndex(-1);

            if (!query) {
                refocusInput();
                return;
            }

            setIsSearching(true);

            try {
                // 1. Try local match by barcode
                let found = products.find(
                    (p) => p.barcode?.toLowerCase() === query.toLowerCase(),
                );

                // 2. Try local match by name
                if (!found) {
                    found = products.find((p) =>
                        p.nama.toLowerCase().includes(query.toLowerCase()),
                    );
                }

                // 3. Try API barcode lookup (only when not in local/offline mode)
                if (!found && !isLocalMode) {
                    try {
                        const results = await lookupProductByBarcode(query);
                        if (results && results.length > 0) {
                            found = results[0];
                        }
                    } catch {
                        // API lookup failed
                    }
                }

                if (found) {
                    triggerFlash("success");
                    onProductFound(found);
                } else {
                    triggerFlash("error");
                    onError?.(`Produk "${query}" tidak ditemukan!`);
                }
            } catch {
                triggerFlash("error");
                onError?.("Terjadi kesalahan saat mencari produk.");
            } finally {
                setIsSearching(false);
                refocusInput();
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (showDropdown && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                    return;
                }
                if (e.key === "Escape") {
                    e.preventDefault();
                    setShowDropdown(false);
                    setFocusedIndex(-1);
                    return;
                }
                if (e.key === "Enter") {
                    if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
                        e.preventDefault();
                        handleSelectProduct(suggestions[focusedIndex]);
                        return;
                    }
                }
            }

            // Debounce for rapid scanner input
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            if (e.key === "Enter") {
                e.preventDefault();
                debounceRef.current = setTimeout(() => {
                    const form = inputRef.current?.form;
                    if (form) {
                        form.requestSubmit();
                    }
                }, 100);
            }
        };

        const flashClasses =
            flashState === "success"
                ? "ring-2 ring-emerald-400 bg-emerald-50/50"
                : flashState === "error"
                    ? "ring-2 ring-rose-400 bg-rose-50/50 animate-shake"
                    : "";

        return (
            <div ref={containerRef} className="relative">
                <form onSubmit={handleSubmit}>
                    <div
                        className={`
                            relative flex items-center gap-2 rounded-2xl border border-slate-200 
                            bg-white px-4 py-3 transition-all duration-200
                            focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20
                            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                            ${flashClasses}
                        `}
                    >
                        {isSearching ? (
                            <IconLoader2 size={20} className="text-emerald-500 animate-spin shrink-0" />
                        ) : (
                            <IconBarcode size={20} className="text-slate-400 shrink-0" />
                        )}

                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled || isSearching}
                            autoComplete="off"
                            onFocus={() => {
                                if (value.trim().length >= 2) {
                                    setShowDropdown(true);
                                }
                            }}
                            className="
                                flex-1 bg-transparent border-none outline-none text-sm text-slate-800
                                placeholder:text-slate-400 font-medium
                                disabled:cursor-not-allowed
                            "
                        />

                        <button
                            type={onSearchSubmit ? "button" : "submit"}
                            onClick={onSearchSubmit ? () => {
                                onSearchSubmit(value.trim());
                                setShowDropdown(false);
                                setFocusedIndex(-1);
                            } : undefined}
                            disabled={disabled || isSearching || (!onSearchSubmit && !value.trim())}
                            className="
                                flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold
                                bg-emerald-50 text-emerald-600 hover:bg-emerald-100
                                disabled:opacity-40 disabled:cursor-not-allowed
                                transition-colors cursor-pointer
                            "
                        >
                            <IconSearch size={14} />
                            <span>{searchLabel}</span>
                        </button>
                    </div>
                </form>

                {/* Suggestions Dropdown list */}
                {showDropdown && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto overflow-x-hidden min-w-[280px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl outline-none"
                    >
                        {isApiLoading ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                                <IconLoader2 size={16} className="text-emerald-500 animate-spin" />
                                <span>Mencari produk...</span>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                Tidak ada produk yang cocok.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {suggestions.map((p, index) => {
                                    const isFocused = index === focusedIndex;
                                    return (
                                        <div
                                            key={p.uid}
                                            data-index={index}
                                            onClick={() => handleSelectProduct(p)}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                            className={`
                                                flex items-center justify-between pr-4 py-3 cursor-pointer transition-all duration-150 border-l-4
                                                ${isFocused
                                                    ? "bg-emerald-100 dark:bg-emerald-900/60 border-l-emerald-500 pl-3"
                                                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-l-transparent pl-3"
                                                }
                                            `}
                                        >
                                            <div className="flex flex-col gap-0.5 text-left">
                                                <span className={`text-xs font-semibold ${isFocused ? "text-emerald-950 dark:text-emerald-50" : "text-slate-800 dark:text-slate-200"}`}>
                                                    {p.nama}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                    {p.barcode && (
                                                        <span className="font-mono flex items-center gap-0.5">
                                                            <IconBarcode size={12} className="opacity-70" />
                                                            {p.barcode}
                                                        </span>
                                                    )}
                                                    {p.merek && (
                                                        <span className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">
                                                            {p.merek}
                                                        </span>
                                                    )}
                                                    {p.category?.nama && (
                                                        <span className="text-slate-300">•</span>
                                                    )}
                                                    {p.category?.nama && (
                                                        <span>{p.category.nama}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-0.5">
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono">
                                                    {mode === "sell"
                                                        ? `Rp ${p.harga.toLocaleString("id-ID")}`
                                                        : p.harga_beli !== undefined && p.harga_beli !== null
                                                            ? `Rp ${p.harga_beli.toLocaleString("id-ID")}`
                                                            : `Rp ${p.harga.toLocaleString("id-ID")}`}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.stok > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"}`}>
                                                    Stok: {p.stok}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Auto-focus indicator */}
                <div className="flex items-center gap-1.5 mt-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">
                        Scanner aktif — otomatis fokus ke input
                    </span>
                </div>
            </div>
        );
    }
);

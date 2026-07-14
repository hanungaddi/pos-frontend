"use client";

import { UseFormReturn } from "react-hook-form";
import { FilterForm } from "@/components/forms/filter-form";
import { FormInput } from "@/components/forms/form-input";
import { FormChipsSelect } from "@/components/forms/form-chips-select";
import { ACTIVITY_MODULES } from "@/constants/activity-modules";

interface AuditFilterValues {
    search: string;
    modules: string[];
}

interface AuditFiltersProps {
    filterMethods: UseFormReturn<AuditFilterValues>;
    onSubmit: (data: AuditFilterValues) => void;
    onReset: () => void;
}

export function AuditFilters({
    filterMethods,
    onSubmit,
    onReset,
}: AuditFiltersProps) {
    const moduleOptions = ACTIVITY_MODULES.map((m) => ({
        value: m.slug,
        label: m.label,
    }));

    return (
        <FilterForm
            methods={filterMethods}
            onSubmit={onSubmit}
            onReset={onReset}
            submitLabel="Cari & Filter"
            cols={1}
        >
            <FormInput<AuditFilterValues>
                name="search"
                label="Cari Log Aktivitas"
                placeholder="Masukkan kata kunci pencarian (contoh: nomor transaksi, tindakan, deskripsi)..."
                className="w-full"
            />
            <FormChipsSelect<AuditFilterValues>
                name="modules"
                label="Filter Modul"
                options={moduleOptions}
            />
        </FilterForm>
    );
}

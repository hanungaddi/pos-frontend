"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hasRole, hasPermission } from "@/constants/roles";
import { useCashDrawers } from "./api/cash-drawers-api";
import { CashDrawerList } from "./components/cash-drawer-list";
import { CashDrawerDialog } from "./components/cash-drawer-dialog";
import { cashDrawerSchema, type CashDrawerInput } from "./schemas/cash-drawer-schema";
import type { CashDrawer } from "./types";
import { FilterForm } from "@/components/forms/filter-form";
import { FormInput } from "@/components/forms/form-input";

interface CashDrawerFilterValues {
    search: string;
}

export function CashDrawers() {
    const { data: session } = useSession();
    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];

    const hasView =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "view_cash_drawer");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortBy, setSortBy] = useState<string | undefined>("nama");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("asc");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const filterMethods = useForm<CashDrawerFilterValues>({
        defaultValues: { search: "" },
    });

    const handleFilterSubmit = (data: CashDrawerFilterValues) => {
        setDebouncedSearch(data.search);
        setPage(1);
    };

    const handleFilterReset = () => {
        filterMethods.reset({ search: "" });
        setDebouncedSearch("");
        setPage(1);
    };

    const { data: drawersData, isLoading, isFetching } = useCashDrawers({
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: debouncedSearch || undefined,
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDrawer, setEditingDrawer] = useState<CashDrawer | null>(null);

    const dialogMethods = useForm<CashDrawerInput>({
        resolver: zodResolver(cashDrawerSchema) as Resolver<CashDrawerInput>,
        defaultValues: {
            nama: "",
            saldo: 0,
            is_active: true,
        },
    });

    if (!hasView) {
        return (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-sm font-bold text-slate-800">Akses Ditolak</p>
                <p className="text-xs text-slate-400 mt-1">Anda tidak memiliki izin untuk melihat data laci kasir.</p>
            </div>
        );
    }

    const handleEdit = (drawer: CashDrawer) => {
        setEditingDrawer(drawer);
        dialogMethods.reset({
            nama: drawer.nama,
            saldo: drawer.saldo,
            is_active: drawer.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleAddClick = () => {
        setEditingDrawer(null);
        dialogMethods.reset({
            nama: "",
            saldo: 0,
            is_active: true,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <FormProvider {...dialogMethods}>
                <CashDrawerList
                    drawers={drawersData?.data || []}
                    meta={drawersData?.meta}
                    page={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={setPerPage}
                    onEdit={handleEdit}
                    onAddClick={handleAddClick}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(by, order) => {
                        setSortBy(by);
                        setSortOrder(order);
                        setPage(1);
                    }}
                    filterElement={
                        <FilterForm
                            methods={filterMethods}
                            onSubmit={handleFilterSubmit}
                            onReset={handleFilterReset}
                        >
                            <FormInput<CashDrawerFilterValues>
                                name="search"
                                label="Cari Laci Kasir"
                                placeholder="Masukkan nama laci kasir..."
                            />
                        </FilterForm>
                    }
                />

                <CashDrawerDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    editingDrawer={editingDrawer}
                />
            </FormProvider>
        </div>
    );
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChartOfAccount } from "@/features/accounting/types";
import type { ManualJournal, ManualJournalLine } from "@/features/accounting/types/manual-journal";
import type { BalanceSheetItem } from "@/features/accounting/types";

export interface BalanceSheetEditItem {
    uid: string;
    kode: string | null;
    nama: string;
    debit: number;
    credit: number;
    amount: number;
}

export interface BalanceSheetEditData {
    assets: BalanceSheetEditItem[];
    liabilities: BalanceSheetEditItem[];
    equity: BalanceSheetEditItem[];
    revenue: BalanceSheetEditItem[];
    expense: BalanceSheetEditItem[];
}

interface BalanceSheetStoreState {
    isEditing: boolean;
    editedData: BalanceSheetEditData | null;
    description: string;
    transactionDate: string;

    setEditing: (editing: boolean) => void;
    initializeData: (
        data: {
            assets?: { items: BalanceSheetItem[] };
            liabilities?: { items: BalanceSheetItem[] };
            equity?: { items: BalanceSheetItem[] };
            revenue?: { items: BalanceSheetItem[] };
            expense?: { items: BalanceSheetItem[] };
        },
        coaList: ChartOfAccount[]
    ) => void;
    initializeFromJournal: (journal: ManualJournal, coaList: ChartOfAccount[]) => void;
    updateItemDebitCredit: (
        section: "assets" | "liabilities" | "equity" | "revenue" | "expense",
        uid: string,
        debit: number,
        credit: number
    ) => void;
    addItem: (
        section: "assets" | "liabilities" | "equity" | "revenue" | "expense",
        item: Omit<BalanceSheetEditItem, "debit" | "credit" | "amount">
    ) => void;
    removeItem: (
        section: "assets" | "liabilities" | "equity" | "revenue" | "expense",
        uid: string
    ) => void;
    setDescription: (desc: string) => void;
    setTransactionDate: (date: string) => void;
    reset: () => void;
}

export const useBalanceSheetStore = create<BalanceSheetStoreState>()(
    persist(
        (set) => ({
            isEditing: false,
            editedData: null,
            description: "",
            transactionDate: "",

            setEditing: (editing) => set({ isEditing: editing }),

            initializeData: (data, coaList) => {
                const mapSection = (items: BalanceSheetItem[] | undefined) => {
                    return (items || []).map((item) => {
                        const matched = coaList.find((coa) => coa.kode === item.kode);
                        return {
                            uid: matched?.uid || `temp-${Math.random().toString(36).substring(2, 9)}`,
                            kode: item.kode,
                            nama: item.nama,
                            debit: item.debit || 0,
                            credit: item.credit || 0,
                            amount: item.amount || 0,
                        };
                    });
                };

                set({
                    editedData: {
                        assets: mapSection(data.assets?.items),
                        liabilities: mapSection(data.liabilities?.items),
                        equity: mapSection(data.equity?.items),
                        revenue: mapSection(data.revenue?.items),
                        expense: mapSection(data.expense?.items),
                    },
                    description: "Penyesuaian Neraca Keuangan",
                    transactionDate: new Date().toISOString().split("T")[0],
                });
            },

            initializeFromJournal: (journal, coaList) => {
                const assets: BalanceSheetEditItem[] = [];
                const liabilities: BalanceSheetEditItem[] = [];
                const equity: BalanceSheetEditItem[] = [];
                const revenue: BalanceSheetEditItem[] = [];
                const expense: BalanceSheetEditItem[] = [];

                (journal.lines || []).forEach((line: ManualJournalLine) => {
                    const matchedCoa = coaList.find(
                        (coa) => coa.uid === line.chart_of_account_uid || coa.kode === line.account?.kode
                    );
                    if (!matchedCoa) return;

                    const tipe = matchedCoa.tipe;
                    const debitVal = Number(line.debit) || 0;
                    const creditVal = Number(line.credit) || 0;

                    let amount = 0;
                    if (tipe === "asset" || tipe === "expense") {
                        amount = debitVal - creditVal;
                    } else {
                        amount = creditVal - debitVal;
                    }

                    const item: BalanceSheetEditItem = {
                        uid: matchedCoa.uid,
                        kode: matchedCoa.kode,
                        nama: matchedCoa.nama,
                        debit: debitVal,
                        credit: creditVal,
                        amount,
                    };

                    if (tipe === "asset") assets.push(item);
                    else if (tipe === "liability") liabilities.push(item);
                    else if (tipe === "equity") equity.push(item);
                    else if (tipe === "revenue") revenue.push(item);
                    else if (tipe === "expense") expense.push(item);
                });

                set({
                    editedData: {
                        assets,
                        liabilities,
                        equity,
                        revenue,
                        expense,
                    },
                    description: journal.description || "",
                    transactionDate: journal.transaction_date ? journal.transaction_date.split("T")[0] : new Date().toISOString().split("T")[0],
                    isEditing: true,
                });
            },

            updateItemDebitCredit: (section, uid, debit, credit) =>
                set((state) => {
                    if (!state.editedData) return {};
                    const isDebitNormal = section === "assets" || section === "expense";
                    const amount = isDebitNormal ? debit - credit : credit - debit;
                    return {
                        editedData: {
                            ...state.editedData,
                            [section]: state.editedData[section].map((item) =>
                                item.uid === uid ? { ...item, debit, credit, amount } : item
                            ),
                        },
                    };
                }),

            addItem: (section, item) =>
                set((state) => {
                    if (!state.editedData) return {};
                    const exists = state.editedData[section].some(
                        (i) => i.uid === item.uid || i.kode === item.kode
                    );
                    if (exists) return {};
                    return {
                        editedData: {
                            ...state.editedData,
                            [section]: [
                                ...state.editedData[section],
                                {
                                    ...item,
                                    debit: 0,
                                    credit: 0,
                                    amount: 0,
                                },
                            ],
                        },
                    };
                }),

            removeItem: (section, uid) =>
                set((state) => {
                    if (!state.editedData) return {};
                    return {
                        editedData: {
                            ...state.editedData,
                            [section]: state.editedData[section].filter((item) => item.uid !== uid),
                        },
                    };
                }),

            setDescription: (desc) => set({ description: desc }),
            setTransactionDate: (date) => set({ transactionDate: date }),

            reset: () =>
                set({
                    isEditing: false,
                    editedData: null,
                    description: "",
                    transactionDate: "",
                }),
        }),
        {
            name: "balance-sheet-edit-storage",
        }
    )
);

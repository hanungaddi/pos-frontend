import { z } from "zod";

export const openCashDrawerSchema = z.object({
    opening_balance: z.coerce.number().min(0, "Saldo awal minimal Rp 0"),
    opening_note: z.string().optional(),
});

export type OpenCashDrawerInput = z.infer<typeof openCashDrawerSchema>;

export const cashInSchema = z.object({
    amount: z.coerce.number().min(1, "Jumlah uang masuk minimal Rp 1"),
    note: z.string().optional(),
});

export type CashInInput = z.infer<typeof cashInSchema>;

export const cashOutSchema = z.object({
    amount: z.coerce.number().min(1, "Jumlah uang keluar minimal Rp 1"),
    note: z.string().min(1, "Catatan pengeluaran wajib diisi"),
    expense_category_uid: z.string().optional().nullable(),
});

export type CashOutInput = z.infer<typeof cashOutSchema>;

export const closeCashDrawerSchema = z.object({
    actual_closing_balance: z
        .union([z.number(), z.null(), z.undefined()])
        .refine((val): val is number => val !== null && val !== undefined, {
            message: "Jumlah saldo akhir (fisik laci) wajib diisi",
        })
        .refine((val) => val >= 0, {
            message: "Saldo akhir minimal Rp 0",
        }),
    closing_note: z.string().optional(),
});

export type CloseCashDrawerInput = z.infer<typeof closeCashDrawerSchema>;

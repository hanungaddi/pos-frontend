import { z } from "zod";

export const manualJournalLineSchema = z
    .object({
        chart_of_account_uid: z.string().min(1, "Akun wajib dipilih"),
        description: z.string().min(1, "Keterangan baris wajib diisi"),
        debit: z
            .number({ error: "Debit harus berupa angka" })
            .default(0),
        credit: z
            .number({ error: "Kredit harus berupa angka" })
            .default(0),
    })
    .refine(
        (data) => {
            // Must have at least one non-zero debit or credit (can be negative)
            const hasDebit = data.debit !== 0;
            const hasCredit = data.credit !== 0;
            return hasDebit || hasCredit;
        },
        {
            message: "Baris harus diisi debit atau kredit (tidak boleh keduanya nol)",
            path: ["debit"], // point error to debit field
        }
    );

export const manualJournalSchema = z
    .object({
        transaction_date: z.string().min(1, "Tanggal transaksi wajib diisi"),
        description: z.string().min(1, "Keterangan jurnal wajib diisi"),
        status: z.enum(["draft", "posted"]).default("draft"),
        lines: z
            .array(manualJournalLineSchema)
            .min(2, "Jurnal manual minimal harus memiliki 2 baris transaksi"),
    })
    .refine(
        (data) => {
            const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
            // Allow minor floating point difference (e.g. up to 0.01)
            return Math.abs(totalDebit - totalCredit) < 0.01;
        },
        {
            message: "Total Debit dan Kredit harus seimbang (sama)",
            path: ["lines"], // point error to lines field
        }
    );

export type ManualJournalSchemaInput = z.infer<typeof manualJournalSchema>;
export type ManualJournalLineSchemaInput = z.infer<typeof manualJournalLineSchema>;

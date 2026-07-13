import { z } from "zod";

export const cashDrawerSchema = z.object({
    nama: z.string().min(1, "Nama laci kasir wajib diisi"),
    saldo: z.coerce.number().min(0, "Saldo minimal Rp 0").optional(),
    is_active: z.boolean().optional(),
});

export type CashDrawerInput = z.infer<typeof cashDrawerSchema>;

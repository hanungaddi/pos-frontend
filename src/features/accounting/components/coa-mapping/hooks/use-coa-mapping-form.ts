import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
    useCoaMappings,
    useUpdateCoaMappings,
    type CoaMappingUpdate,
} from "@/features/accounting/api/coa-mapping-api";
import { toast } from "sonner";

export interface CoaMappingFormValues {
    [key: string]: string;
}

export function useCoaMappingForm() {
    const { data: mappings, isLoading } = useCoaMappings();
    const updateMutation = useUpdateCoaMappings();

    // Map coa-mappings to flat form state object (key: "transaction_type:slot")
    const defaultValues = useMemo(() => {
        if (!mappings) return {};
        const vals: CoaMappingFormValues = {};
        mappings.forEach((m) => {
            vals[`${m.transaction_type}:${m.slot}`] = m.chart_of_account_uid || "";
        });
        return vals;
    }, [mappings]);

    const methods = useForm<CoaMappingFormValues>({
        defaultValues,
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty, dirtyFields },
    } = methods;

    // Reset form when mappings are initially loaded or refetched
    useEffect(() => {
        if (mappings) {
            reset(defaultValues);
        }
    }, [mappings, defaultValues, reset]);

    const handleSave = handleSubmit((values) => {
        if (!mappings) return;

        // Construct update payload only matching mappings
        const payload: CoaMappingUpdate[] = mappings.map((m) => {
            const key = `${m.transaction_type}:${m.slot}`;
            return {
                transaction_type: m.transaction_type,
                slot: m.slot,
                chart_of_account_uid: values[key] ?? m.chart_of_account_uid,
            };
        });

        updateMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Mapping COA berhasil disimpan.");
                reset(values); // Reset to current values so form is not dirty anymore
            },
            onError: (err) => {
                toast.error(err.message || "Gagal menyimpan mapping COA.");
            },
        });
    });

    const discardChanges = () => {
        reset(defaultValues);
        toast.info("Perubahan dibatalkan.");
    };

    return {
        methods,
        control,
        isDirty,
        dirtyFields,
        isSaving: updateMutation.isPending,
        handleSave,
        discardChanges,
        isLoading,
        mappings,
    };
}

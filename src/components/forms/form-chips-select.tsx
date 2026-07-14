"use client";

import { useFormContext, Controller, type FieldPath, type FieldValues, type FieldError, type FieldErrors } from "react-hook-form";
import { ChipsSelect, type ChipsSelectOption } from "@/components/ui/chips-select";
import { cn } from "@/lib/utils";

interface FormChipsSelectProps<T extends FieldValues> {
    name: FieldPath<T>;
    label?: string;
    options: ChipsSelectOption[];
    onChange?: (value: string[]) => void;
    className?: string;
    wrapperClassName?: string;
    disabled?: boolean;
}

export function FormChipsSelect<T extends FieldValues>({
    name,
    label,
    options,
    onChange,
    className,
    wrapperClassName,
    disabled,
}: FormChipsSelectProps<T>) {
    const {
        control,
        formState: { errors },
    } = useFormContext<T>();

    const getNestedError = (
        obj: FieldErrors<T>,
        path: string,
    ): FieldError | undefined => {
        const value = path
            .split(/[.[\]]+/)
            .filter(Boolean)
            .reduce<unknown>((prev, curr) => {
                if (prev && typeof prev === "object") {
                    return (prev as Record<string, unknown>)[curr];
                }
                return undefined;
            }, obj);
        return value as FieldError | undefined;
    };

    const error = getNestedError(errors, name);

    return (
        <div className={cn("space-y-1.5 w-full", wrapperClassName)}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <ChipsSelect
                        options={options}
                        value={Array.isArray(field.value) ? field.value : []}
                        onChange={(val) => {
                            field.onChange(val);
                            if (onChange) {
                                onChange(val);
                            }
                        }}
                        label={label}
                        disabled={disabled}
                        className={className}
                    />
                )}
            />
            {error && (
                <p className="text-[10px] text-rose-500 font-medium">
                    {error.message}
                </p>
            )}
        </div>
    );
}

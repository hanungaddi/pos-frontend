import { SupplierDebtsDetailPage } from "@/features/debts/components/supplier-debts-detail-page";

interface PageProps {
    params: Promise<{ supplier_uid: string }>;
    searchParams: Promise<{ nama?: string }>;
}

export const metadata = {
    title: "Detail Hutang Supplier",
};

export default async function AdminSupplierDebtsDetailPage({ params, searchParams }: PageProps) {
    const { supplier_uid } = await params;
    const { nama } = await searchParams;

    return (
        <SupplierDebtsDetailPage
            supplierUid={supplier_uid}
            supplierName={nama ? decodeURIComponent(nama) : "Supplier"}
        />
    );
}

// Constants for Purchase Order, Receiving, and Payment Statuses
// Centralized mapping to make UI labels and styling easily maintainable.

export const PO_STATUS = {
    DRAFT: "draft",
    ORDERED: "ordered",
    PARTIALLY_RECEIVED: "partially_received",
    RECEIVED: "received",
    CLOSED: "closed",
    CANCELLED: "cancelled",
} as const;

export type POStatus = typeof PO_STATUS[keyof typeof PO_STATUS];

export const PO_STATUS_LABELS: Record<POStatus, string> = {
    [PO_STATUS.DRAFT]: "Draft",
    [PO_STATUS.ORDERED]: "Dipesan",
    [PO_STATUS.PARTIALLY_RECEIVED]: "Diterima Sebagian",
    [PO_STATUS.RECEIVED]: "Diterima",
    [PO_STATUS.CLOSED]: "Selesai",
    [PO_STATUS.CANCELLED]: "Dibatalkan",
};

export const PO_STATUS_CLASSES: Record<POStatus, string> = {
    [PO_STATUS.DRAFT]: "bg-amber-50 text-amber-700 border-amber-100",
    [PO_STATUS.ORDERED]: "bg-blue-50 text-blue-700 border-blue-100",
    [PO_STATUS.PARTIALLY_RECEIVED]: "bg-indigo-50 text-indigo-700 border-indigo-100",
    [PO_STATUS.RECEIVED]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    [PO_STATUS.CLOSED]: "bg-purple-50 text-purple-700 border-purple-100",
    [PO_STATUS.CANCELLED]: "bg-rose-50 text-rose-700 border-rose-100",
};

export const RECEIVING_STATUS = {
    DRAFT: "draft",
    COMPLETED: "completed",
} as const;

export type ReceivingStatus = typeof RECEIVING_STATUS[keyof typeof RECEIVING_STATUS];

export const RECEIVING_STATUS_LABELS: Record<ReceivingStatus, string> = {
    [RECEIVING_STATUS.DRAFT]: "Draft",
    [RECEIVING_STATUS.COMPLETED]: "Selesai",
};

export const RECEIVING_STATUS_CLASSES: Record<ReceivingStatus, string> = {
    [RECEIVING_STATUS.DRAFT]: "bg-amber-50 text-amber-700 border-amber-100",
    [RECEIVING_STATUS.COMPLETED]: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const PAYMENT_STATUS = {
    PENDING: "pending",
    UNPAID: "unpaid",
    PARTIAL: "partial",
    PAID: "paid",
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    [PAYMENT_STATUS.PENDING]: "Pending",
    [PAYMENT_STATUS.UNPAID]: "Belum Dibayar",
    [PAYMENT_STATUS.PARTIAL]: "Sebagian",
    [PAYMENT_STATUS.PAID]: "Lunas",
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
    [PAYMENT_STATUS.PENDING]: "bg-amber-50 text-amber-700 border-amber-100",
    [PAYMENT_STATUS.UNPAID]: "bg-rose-50 text-rose-700 border-rose-100",
    [PAYMENT_STATUS.PARTIAL]: "bg-indigo-50 text-indigo-700 border-indigo-100",
    [PAYMENT_STATUS.PAID]: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const RETURN_STATUS = {
    DRAFT: "draft",
    COMPLETED: "completed",
} as const;

export type ReturnStatus = typeof RETURN_STATUS[keyof typeof RETURN_STATUS];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
    [RETURN_STATUS.DRAFT]: "Draft",
    [RETURN_STATUS.COMPLETED]: "Selesai",
};

export const RETURN_STATUS_CLASSES: Record<ReturnStatus, string> = {
    [RETURN_STATUS.DRAFT]: "bg-amber-50 text-amber-700 border-amber-100",
    [RETURN_STATUS.COMPLETED]: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const PAYMENT_TRANSACTION_STATUS = {
    COMPLETED: "completed",
    VOID: "void",
} as const;

export type PaymentTransactionStatus = typeof PAYMENT_TRANSACTION_STATUS[keyof typeof PAYMENT_TRANSACTION_STATUS];

export const PAYMENT_TRANSACTION_STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
    [PAYMENT_TRANSACTION_STATUS.COMPLETED]: "Selesai",
    [PAYMENT_TRANSACTION_STATUS.VOID]: "Batal (Void)",
};

export const PAYMENT_TRANSACTION_STATUS_CLASSES: Record<PaymentTransactionStatus, string> = {
    [PAYMENT_TRANSACTION_STATUS.COMPLETED]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    [PAYMENT_TRANSACTION_STATUS.VOID]: "bg-rose-50 text-rose-700 border-rose-100",
};
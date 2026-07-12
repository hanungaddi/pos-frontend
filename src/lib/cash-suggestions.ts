/**
 * Cash suggestion utilities for POS — two variants with different intent:
 *
 * - `generateCheckoutSuggestions`: for checkout payment. Only suggests
 *   amounts ABOVE the total (customer always pays ≥ total; change is returned).
 *   Uses the original checkout logic with `addIfValid(val > total)`.
 *
 * - `generateDebtSuggestions`: for debt payment. Suggests amounts BOTH
 *   below the total (cicilan/instalment) and above it (overpay with change).
 *   Cicilan fractions (¼, ½) are rounded with `roundToNice()` so e.g.
 *   ¼ of Rp 3.999.000 = 999.750 → Rp 1.000.000 (not Rp 950.000).
 */

// ─── Checkout ─────────────────────────────────────────────────────────────────

/**
 * Generates suggested cash amounts for **checkout** payments.
 * All returned values are strictly greater than `total` (kembalian will occur).
 * The exact `total` is excluded — callers render a "Uang Pas" button separately.
 *
 * Examples:
 *   43.200  → [43.500, 44.000, 45.000, 50.000, 100.000]
 *   82.500  → [83.000, 85.000, 90.000, 100.000]
 *   167.000 → [170.000, 180.000, 200.000]
 */
export function generateCheckoutSuggestions(total: number): number[] {
    if (total <= 0) return [10_000, 20_000, 50_000, 100_000];

    const results  = new Set<number>();
    const capLimit = Math.max(100_000, Math.ceil(total / 100_000) * 100_000);

    /** Only add values strictly above total and within cap. */
    const add = (val: number) => {
        if (val > total && val <= capLimit) results.add(val);
    };

    if (total < 50_000) {
        // Small: fine-grained steps + denomination boundaries
        const round500 = Math.ceil(total / 500)    * 500;
        const round1k  = Math.ceil(total / 1_000)  * 1_000;
        const round5k  = Math.ceil(total / 5_000)  * 5_000;
        const round10k = Math.ceil(total / 10_000) * 10_000;

        add(round500);
        add(round1k);
        add(round1k + 1_000);
        add(round5k);
        add(round10k);
        add(50_000);
        add(100_000);

    } else if (total < 100_000) {
        // Medium: denomination boundaries
        const round500 = Math.ceil(total / 500)    * 500;
        const round1k  = Math.ceil(total / 1_000)  * 1_000;
        const round5k  = Math.ceil(total / 5_000)  * 5_000;
        const round10k = Math.ceil(total / 10_000) * 10_000;
        const round20k = Math.ceil(total / 20_000) * 20_000;

        add(round500);
        add(round1k);
        add(round1k + 1_000);
        add(round5k);
        add(round10k);
        add(round20k);
        add(100_000);

    } else {
        // Large: 10k, 20k, 50k boundaries + cap
        const round10k = Math.ceil(total / 10_000) * 10_000;
        const round20k = Math.ceil(total / 20_000) * 20_000;
        const round50k = Math.ceil(total / 50_000) * 50_000;

        add(round10k);
        add(round20k);
        add(round50k);
        add(capLimit);
    }

    return Array.from(results).sort((a, b) => a - b);
}

// ─── Debt Payment ─────────────────────────────────────────────────────────────

/**
 * Round a value to the nearest "clean" denomination for its scale.
 * Used to produce tidy cicilan fractions (e.g. ¼ of 3.999.000 → 1.000.000).
 */
function roundToNice(val: number): number {
    if (val <= 0)         return 0;
    if (val >= 1_000_000) return Math.round(val / 500_000) * 500_000;
    if (val >= 100_000)   return Math.round(val / 100_000) * 100_000;
    if (val >= 10_000)    return Math.round(val / 10_000)  * 10_000;
    return                       Math.round(val / 1_000)   * 1_000;
}

/**
 * Generates suggested cash amounts for **debt payment**.
 * Includes values BELOW `total` (cicilan instalments) and ABOVE it (overpay).
 * The exact `total` is excluded — callers render a "Uang Pas" button separately.
 *
 * Examples:
 *   3.999.000 → [1.000.000 (cicilan), 2.000.000 (cicilan), 4.000.000 (overpay)]
 *   75.000    → [37.000 (cicilan), 76.000, 80.000, 100.000]
 */
export function generateDebtSuggestions(total: number): number[] {
    if (total <= 0) return [10_000, 20_000, 50_000, 100_000];

    const results  = new Set<number>();
    const capLimit = Math.max(100_000, Math.ceil(total / 100_000) * 100_000);

    /** Add if positive and within cap (allows values both below and above total). */
    const add = (val: number) => {
        if (val > 0 && val <= capLimit) results.add(val);
    };

    if (total < 50_000) {
        const round500 = Math.ceil(total / 500)    * 500;
        const round1k  = Math.ceil(total / 1_000)  * 1_000;
        const round5k  = Math.ceil(total / 5_000)  * 5_000;
        const round10k = Math.ceil(total / 10_000) * 10_000;

        if (total >= 10_000) add(roundToNice(total / 2)); // cicilan ½
        add(round500);
        add(round1k);
        add(round1k + 1_000);
        add(round5k);
        add(round10k);
        add(50_000);
        add(100_000);

    } else if (total < 100_000) {
        const round1k  = Math.ceil(total / 1_000)  * 1_000;
        const round5k  = Math.ceil(total / 5_000)  * 5_000;
        const round10k = Math.ceil(total / 10_000) * 10_000;
        const round20k = Math.ceil(total / 20_000) * 20_000;

        add(roundToNice(total / 2)); // cicilan ½
        add(round1k);
        add(round5k);
        add(round10k);
        add(round20k);
        add(100_000);

    } else {
        // Cicilan suggestions (below total)
        add(roundToNice(total / 4)); // cicilan ¼
        add(roundToNice(total / 2)); // cicilan ½
        // Above-total suggestions (next round denomination)
        const round10k = Math.ceil(total / 10_000) * 10_000;
        const round50k = Math.ceil(total / 50_000) * 50_000;
        add(round10k);
        add(round50k);
        add(capLimit);
    }

    results.delete(total); // caller renders "Uang Pas" button separately
    return Array.from(results).filter(v => v > 0).sort((a, b) => a - b);
}

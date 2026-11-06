import { DEFAULT_CURRENCY } from '@/common/constants'

interface Priced {
	currency?: string | null
	shouldCalculate?: boolean
}

/**
 * The currency totals are billed in. Free joke items can carry their own unit
 * (e.g. "barks"), so only charged lines count.
 */
export const billingCurrency = (lines: Priced[]) =>
	lines.find(l => l.shouldCalculate !== false && l.currency)?.currency ??
	DEFAULT_CURRENCY

/**
 * Rounds amounts to cents so they still add up to the rounded total, giving the
 * leftover cents to the largest remainders (11 × 69/11 shows 6.28 ×3, 6.27 ×8).
 */
export function allocateCents(amounts: number[]): number[] {
	const exact = amounts.map(a => a * 100)
	const floors = exact.map(Math.floor)
	let left =
		Math.round(exact.reduce((s, a) => s + a, 0)) -
		floors.reduce((s, a) => s + a, 0)
	const order = exact
		.map((a, i) => ({ i, frac: a - floors[i] }))
		.sort((x, y) => y.frac - x.frac || x.i - y.i)
	for (const { i } of order) {
		if (left <= 0) break
		floors[i] += 1
		left -= 1
	}
	return floors.map(c => c / 100)
}

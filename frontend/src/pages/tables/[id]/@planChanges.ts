import type {
	OrderResponseDto,
	PlanBaselineItemDto,
	TablePlanItemDto,
} from '@/api/model'

export interface RemovedDish {
	variantId: string
	name: string
	label: string | null
	imageUrl: string | null
	quantity: number
}

/** The changes a modify suggestion makes, as amounts to add to or take off the live orders. */
export interface PlanChanges {
	adds: { variantId: string; quantity: number }[]
	/** quantity 0 deletes the order */
	cuts: { orderId: string; quantity: number }[]
	/** Change per dish against what the table had when the suggestion was made. */
	deltas: Map<string, number>
	removed: RemovedDish[]
	count: number
	/** The orders changed after the suggestion; dishes added since are left alone. */
	stale: boolean
}

const sumByVariant = (rows: { variantId: string; quantity: number }[]) => {
	const totals = new Map<string, number>()
	for (const row of rows)
		totals.set(row.variantId, (totals.get(row.variantId) ?? 0) + row.quantity)
	return totals
}

/**
 * Applies the suggestion as the differences it showed, measured from the orders it was
 * made from, so a dish someone ordered afterwards is never removed by an older suggestion.
 */
export function planChanges(
	items: TablePlanItemDto[],
	orders: OrderResponseDto[],
	baseline: PlanBaselineItemDto[]
): PlanChanges {
	const linesOf = new Map<string, OrderResponseDto[]>()
	for (const order of orders)
		linesOf.set(order.variantId, [
			...(linesOf.get(order.variantId) ?? []),
			order,
		])
	const live = sumByVariant(orders)
	const from = sumByVariant(baseline)
	const to = new Map(items.map(i => [i.variantId, i.quantity]))

	const adds: PlanChanges['adds'] = []
	const cuts: PlanChanges['cuts'] = []
	const deltas = new Map<string, number>()
	const removed: RemovedDish[] = []

	for (const variantId of new Set([...to.keys(), ...from.keys()])) {
		const lines = linesOf.get(variantId) ?? []
		const delta = (to.get(variantId) ?? 0) - (from.get(variantId) ?? 0)
		deltas.set(variantId, delta)
		if (delta > 0) adds.push({ variantId, quantity: delta })
		if (delta < 0) {
			// trim the newest orders first, so what people picked early stays as it was
			let excess = -delta
			for (const line of [...lines].sort((a, b) =>
				b.createdAt.localeCompare(a.createdAt)
			)) {
				if (excess === 0) break
				const take = Math.min(excess, line.quantity)
				cuts.push({ orderId: line.id, quantity: line.quantity - take })
				excess -= take
			}
		}
		if (!to.has(variantId) && lines.length > 0) {
			const [first] = lines
			removed.push({
				variantId,
				name: first.foodName,
				label: first.variantLabel || null,
				imageUrl: first.foodImageUrl,
				quantity: -delta,
			})
		}
	}

	const stale = [...new Set([...live.keys(), ...from.keys()])].some(
		variantId => (live.get(variantId) ?? 0) !== (from.get(variantId) ?? 0)
	)

	return {
		adds,
		cuts,
		deltas,
		removed,
		count: [...deltas.values()].filter(d => d !== 0).length,
		stale,
	}
}

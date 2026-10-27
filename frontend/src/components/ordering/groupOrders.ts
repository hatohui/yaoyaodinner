import type { OrderResponseDto } from '@/api/model'

export interface OrderedLine extends OrderResponseDto {
	key: string
	/** Every order folded into this line; the first is the one edits apply to. */
	ids: string[]
}

/** Collapses repeat orders of the same option, price and split into one line. */
export function groupOrders(orders: OrderResponseDto[]): OrderedLine[] {
	const lines = new Map<string, OrderedLine>()
	for (const order of orders) {
		const people = order.splits
			.map(s => s.personId)
			.sort()
			.join(',')
		const key = `${order.variantId}|${order.price}|${order.splitAll ? '*' : people}`
		const line = lines.get(key)
		if (line) {
			line.quantity += order.quantity
			line.ids.push(order.id)
		} else lines.set(key, { ...order, key, ids: [order.id] })
	}
	return [...lines.values()]
}

import type { OrderResponseDto } from '@/api/model'

export interface OrderedLine extends OrderResponseDto {
	key: string
	/** Every order folded into this line; the first is the one edits apply to. */
	ids: string[]
}

/** Collapses repeat orders of the same round, option, price and split into one line. */
export function groupOrders(orders: OrderResponseDto[]): OrderedLine[] {
	const lines = new Map<string, OrderedLine>()
	for (const order of orders) {
		const people = order.splits
			.map(s => s.personId)
			.sort()
			.join(',')
		const key = `${order.round}|${order.variantId}|${order.price}|${order.priceEdited}|${order.splitAll ? '*' : people}`
		const line = lines.get(key)
		if (line) {
			line.quantity += order.quantity
			line.ids.push(order.id)
		} else lines.set(key, { ...order, key, ids: [order.id] })
	}
	return [...lines.values()]
}

/** Same dish and portion, however it was split. */
export const dishKey = (o: Pick<OrderResponseDto, 'foodId' | 'variantId'>) =>
	`${o.foodId}|${o.variantId}`

export const countDishes = (lines: OrderResponseDto[]) =>
	new Set(lines.map(dishKey)).size

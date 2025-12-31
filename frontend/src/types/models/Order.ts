import type { FoodVariant } from './Food'
import type { People } from './People'
import type { Table } from './Table'

export interface Order {
	id: string
	tableId: Table['id']
	variantId: FoodVariant['id']
	quantity: number
	price: number
	orderedBy: People['id'] | null
	updatedAt: string
	createdAt: string
}

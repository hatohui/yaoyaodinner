import type { FoodVariant } from './Food'

export interface PresetMenu {
	id: string
	price: number
	isActive: boolean
}

export interface PresetMenuFood {
	presetId: PresetMenu['id']
	variantId: FoodVariant['id']
	quantity: number
}

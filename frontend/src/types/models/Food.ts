import type { Category } from './Category'
import type { Language } from './Language'

export interface Food {
	id: string
	name: string
	imageUrl: string | null
	description: string | null
	categoryId: Category['id'] | null
	isAvailable: boolean
	isChecked: boolean
}

export interface FoodTranslation {
	foodId: Food['id']
	language: Language['code']
	name: string
	description: string | null
}

export interface FoodVariant {
	id: string
	foodId: Food['id']
	label: string
	price: number | null
	currency: string
	isSeasonal: boolean
	isAvailable: boolean
}

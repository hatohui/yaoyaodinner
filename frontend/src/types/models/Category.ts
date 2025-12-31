import type { Language } from './Language'

export interface Category {
	id: string
	name: string
	description: string | null
}

export interface CategoryTranslation {
	categoryId: string
	language: Language['code']
	name: string
	description: string | null
}

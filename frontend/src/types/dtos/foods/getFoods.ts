import type { Food } from '@/types/models/Food'

export interface GetFoodsParams {
	lang?: string
	page?: number
	count?: number
	category?: string
}

export interface GetFoodsResponse {
	foods: Food[]
	page: number
	count: number
	total: number
}

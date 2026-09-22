import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export type MenuSort = 'name' | 'price' | 'price_desc' | 'popular'

export interface MenuSearchParams {
	page?: number
	count?: number
	category?: string
	sort?: MenuSort
	popular?: boolean
	recommended?: boolean
	lang?: string
}

const isMenuSort = (value: string | null): value is MenuSort =>
	value === 'name' || value === 'price' || value === 'price_desc' || value === 'popular'

export function useMenuSearchParams() {
	const [searchParams, setSearchParams] = useSearchParams()

	const pageParam = parseInt(searchParams.get('page') || '1', 10)
	const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1
	
	const countParam = parseInt(searchParams.get('count') || '16', 10)
	const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 16
	const category = searchParams.get('category') || 'all'
	const sort = isMenuSort(searchParams.get('sort'))
		? (searchParams.get('sort') as MenuSort)
		: 'name'
	const popular = searchParams.get('popular') === 'true'
	const recommended = searchParams.get('recommended') === 'true'
	const lang = searchParams.get('lang') || undefined

	const updateParams = useCallback(
		(updates: Partial<MenuSearchParams>) => {
			setSearchParams(params => {
				Object.entries(updates).forEach(([key, value]) => {
					if (value === undefined || value === null || value === false) {
						params.delete(key)
					} else {
						params.set(key, String(value))
					}
				})
				return params
			})
		},
		[setSearchParams]
	)

	const setPage = useCallback(
		(newPage: number) => {
			updateParams({ page: newPage })
		},
		[updateParams]
	)

	const setCount = useCallback(
		(newCount: number) => {
			updateParams({ count: newCount, page: 1 })
		},
		[updateParams]
	)

	const setCategory = useCallback(
		(newCategory: string) => {
			updateParams({ category: newCategory, page: 1 })
		},
		[updateParams]
	)

	const setSort = useCallback(
		(newSort: MenuSort) => {
			updateParams({ sort: newSort, page: 1 })
		},
		[updateParams]
	)

	const setPopular = useCallback(
		(newPopular: boolean) => {
			updateParams({ popular: newPopular, page: 1 })
		},
		[updateParams]
	)

	const setRecommended = useCallback(
		(newRecommended: boolean) => {
			updateParams({ recommended: newRecommended, page: 1 })
		},
		[updateParams]
	)

	const setLang = useCallback(
		(newLang: string | undefined) => {
			updateParams({ lang: newLang })
		},
		[updateParams]
	)

	const resetParams = useCallback(() => {
		setSearchParams({})
	}, [setSearchParams])

	return {
		page,
		count,
		category,
		sort,
		popular,
		recommended,
		lang,
		setPage,
		setCount,
		setCategory,
		setSort,
		setPopular,
		setRecommended,
		setLang,
		updateParams,
		resetParams,
	}
}

export function buildSearchParams(params: MenuSearchParams): URLSearchParams {
	const searchParams = new URLSearchParams()

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			searchParams.set(key, String(value))
		}
	})

	return searchParams
}

export function parseMenuSearchParams(
	searchParams: URLSearchParams
): MenuSearchParams {
	const pageParam = parseInt(searchParams.get('page') || '1', 10)
	const countParam = parseInt(searchParams.get('count') || '20', 10)
	
	return {
		page: Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1,
		count: Number.isFinite(countParam) && countParam > 0 ? countParam : 20,
		category: searchParams.get('category') || 'all',
		sort: isMenuSort(searchParams.get('sort'))
			? (searchParams.get('sort') as MenuSort)
			: 'name',
		popular: searchParams.get('popular') === 'true',
		recommended: searchParams.get('recommended') === 'true',
		lang: searchParams.get('lang') || undefined,
	}
}

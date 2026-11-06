import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getGetFoodByIdQueryOptions } from '@/api/foods/foods'

/** Starts loading a food's detail on hover/touch so the detail view opens filled. */
export function usePrefetchFood() {
	const qc = useQueryClient()
	const { i18n } = useTranslation()

	return (id: string) =>
		qc.prefetchQuery(getGetFoodByIdQueryOptions(id, { lang: i18n.language }))
}

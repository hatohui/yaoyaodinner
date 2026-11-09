import { useTranslation } from 'react-i18next'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
	useDeleteFood,
	useUpdateFood,
	getGetFoodsQueryKey,
	getGetFoodsForAdminQueryKey,
} from '@/api/foods/foods'
import type {
	EventSummaryDto,
	FoodItemDto,
	GetFoodsResponseDto,
	SeasonalPriceDto,
} from '@/api/model'
import { useGetActiveEvent } from '@/api/events/events'
import { useGetSeasonalPrices } from '@/api/seasonal-prices/seasonal-prices'
import { useToast } from '@/hooks/useToast'
import { useEditMode } from '@/hooks/useEditMode'

export function useMenuAdmin() {
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const { editing, toggle } = useEditMode()
	const { data: activeEvent } = useGetActiveEvent<EventSummaryDto | null>({
		query: { enabled: editing },
	})
	const eventId = activeEvent?.id ?? ''
	const { data: seasonal = [] } = useGetSeasonalPrices<SeasonalPriceDto[]>(
		eventId,
		{ lang: i18n.language },
		{ query: { enabled: editing && Boolean(eventId) } }
	)
	const seasonalByFood = new Map<string, SeasonalPriceDto[]>()
	for (const dish of seasonal)
		seasonalByFood.set(dish.foodId, [
			...(seasonalByFood.get(dish.foodId) ?? []),
			dish,
		])

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: getGetFoodsQueryKey() })
		qc.invalidateQueries({ queryKey: getGetFoodsForAdminQueryKey() })
	}

	/** Patches every cached menu page at once; the snapshot restores on failure. */
	const patchMenus = async (apply: (foods: FoodItemDto[]) => FoodItemDto[]) => {
		const filter = { queryKey: getGetFoodsQueryKey() }
		await qc.cancelQueries(filter)
		const snapshot = qc.getQueriesData<GetFoodsResponseDto>(filter)
		qc.setQueriesData<GetFoodsResponseDto>(filter, prev =>
			prev ? { ...prev, foods: apply(prev.foods) } : prev
		)
		return { snapshot }
	}

	const rollback = (ctx?: { snapshot: [QueryKey, unknown][] }) =>
		ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))

	const { mutate: remove } = useDeleteFood({
		mutation: {
			onMutate: ({ id }) => patchMenus(foods => foods.filter(f => f.id !== id)),
			onSuccess: () => toast.success(t('menu.admin.deleted')),
			onSettled: invalidate,
			// Foods that were ever ordered are kept for history; hiding is the way out.
			onError: (e, _v, ctx) => {
				rollback(ctx)
				toast.error(
					isAxiosError(e) && e.response?.status === 409
						? t('menu.admin.delete_has_orders')
						: t('menu.admin.delete_failed')
				)
			},
		},
	})

	const { mutate: update } = useUpdateFood({
		mutation: {
			onMutate: ({ id, data }) =>
				data.isAvailable === undefined
					? undefined
					: patchMenus(foods =>
							foods.map(f =>
								f.id === id ? { ...f, isAvailable: data.isAvailable! } : f
							)
						),
			onSettled: invalidate,
			onSuccess: (_d, { data }) => {
				toast.success(
					data.imageUrl !== undefined
						? t('menu.admin.image_updated')
						: data.isAvailable
							? t('menu.admin.shown')
							: t('menu.admin.hidden')
				)
			},
			onError: (_e, _v, ctx) => {
				rollback(ctx)
				toast.error(t('menu.admin.update_failed'))
			},
		},
	})

	return {
		editing,
		exitEditMode: toggle,
		deleteFood: (id: string) => remove({ id }),
		setAvailable: (id: string, isAvailable: boolean) =>
			update({ id, data: { isAvailable } }),
		setImage: (id: string, imageUrl: string) =>
			update({ id, data: { imageUrl } }),
		eventId,
		seasonalByFood,
	}
}

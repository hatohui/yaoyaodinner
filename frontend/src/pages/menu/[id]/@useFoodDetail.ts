import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	useGetFoodById,
	useUpdateFood,
	useUpdateFoodVariant,
	getGetFoodByIdQueryKey,
} from '@/api/foods/foods'
import type { FoodDetailWithStatsDto, UpdateFoodDto } from '@/api/model'
import { useToast } from '@/hooks/useToast'
import { useMenuBasketStore } from '../@useMenuSelection'

export function useFoodDetail(idOverride?: string) {
	const { id: idParam = '' } = useParams()
	const id = idOverride ?? idParam
	const { t, i18n } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const inCart = useMenuBasketStore(s => s.selected.has(id))
	const toggleCart = useMenuBasketStore(s => s.toggle)

	const {
		data: food,
		isLoading,
		isError,
	} = useGetFoodById<FoodDetailWithStatsDto>(
		id,
		{ lang: i18n.language },
		{
			query: {
				refetchOnWindowFocus: false,
				enabled: Boolean(id),
			},
		}
	)

	const availableVariants = (food?.variants ?? []).filter(v => v.isAvailable)

	const invalidate = () =>
		qc.invalidateQueries({
			queryKey: getGetFoodByIdQueryKey(id, { lang: i18n.language }),
		})
	const onError = () => toast.error(t('admin.food.save_failed'))

	const { mutate: updateFoodMutate } = useUpdateFood({
		mutation: { onSuccess: invalidate, onError },
	})
	const { mutate: updateVariantMutate } = useUpdateFoodVariant({
		mutation: { onSuccess: invalidate, onError },
	})

	return {
		id,
		food,
		isLoading,
		isError,
		availableVariants,
		inCart,
		toggleCart: () => toggleCart(id),
		updateFood: (patch: UpdateFoodDto) =>
			updateFoodMutate({ id, data: { ...patch, lang: i18n.language } }),
		updateVariant: (
			variantId: string,
			patch: { label?: string; price?: number }
		) =>
			updateVariantMutate({
				variantId,
				data: { ...patch, lang: i18n.language },
			}),
	}
}
